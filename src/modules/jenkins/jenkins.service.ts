import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Build } from 'src/database/entities/build.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { getJenkinsJobConfig, TechStack } from './pipeline-templates';

@Injectable()
export class JenkinsService {
  private readonly logger = new Logger(JenkinsService.name);

  constructor(
    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>,
    @InjectRepository(Repo)
    private readonly repoRepository: Repository<Repo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  async handlePushEvent(payload: any, signature: string) {
    // Step 1: Find the repo from the database using the payload, include createdBy for GitHub token
    const repo = await this.repoRepository.findOne({
      where: { fullName: payload.repository.full_name },
      relations: ['createdBy'],
    });
    if (!repo || !repo.webhookSecret) {
      throw new UnauthorizedException(`Repo not found or webhook secret is not configured for ${payload.repository.full_name}`);
    }

    // Step 2: Verify the signature using the secret from the database
    this.verifySignature(JSON.stringify(payload), signature, repo.webhookSecret);

    // Step 3: Continue with the original logic
    if (payload.ref !== `refs/heads/${repo.defaultBranch}`) {
      this.logger.log(`Ignoring push to non-default branch: ${payload.ref}`);
      return;
    }

    const user = await this.userRepository.findOne({ where: { githubName: payload.pusher.name } });

    // Get the correct Jenkins job name
    const jobName = repo.jenkinsJobName || repo.name;

    const newBuild = this.buildRepository.create({
      repo: repo,
      commitHash: payload.after,
      triggeredBy: user,
      jenkinsJobName: jobName,
    });
    await this.buildRepository.save(newBuild);

    this.logger.log(`Build ${newBuild.id} created for commit ${newBuild.commitHash.substring(0, 7)}`);

    // Get GitHub token from repo creator
    const githubToken = repo.createdBy?.githubToken || '';
    await this.triggerJenkinsJob(jobName, newBuild.commitHash, newBuild.id, githubToken);
  }

  async triggerBuildForPR(repo: Repo, commitHash: string, triggeredBy: User | null) {
    // Get the correct Jenkins job name - use jenkinsJobName if available, otherwise fallback
    const jobName = repo.jenkinsJobName || repo.name;

    const newBuild = this.buildRepository.create({
      repo: repo,
      commitHash: commitHash,
      triggeredBy: triggeredBy,
      jenkinsJobName: jobName, // Save the job name for reference
    });
    await this.buildRepository.save(newBuild);

    this.logger.log(`Build ${newBuild.id} created for merged PR with commit ${newBuild.commitHash.substring(0, 7)}`);

    // Load repo with createdBy to get GitHub token
    const repoWithCreator = await this.repoRepository.findOne({
      where: { id: repo.id },
      relations: ['createdBy'],
    });
    const githubToken = repoWithCreator?.createdBy?.githubToken || '';
    await this.triggerJenkinsJob(jobName, newBuild.commitHash, newBuild.id, githubToken);
  }


  private verifySignature(payload: string, signature: string, secret: string) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
      throw new UnauthorizedException('Invalid signature');
    }
  }

  private async triggerJenkinsJob(repoName: string, commitHash: string, buildId: string, githubToken: string) {
    const jenkinsUrl = this.configService.getOrThrow<string>('JENKINS_URL');
    const jenkinsUser = this.configService.getOrThrow<string>('JENKINS_USER');
    const jenkinsToken = this.configService.getOrThrow<string>('JENKINS_TOKEN');

    // This assumes your Jenkins job is named the same as your repo and is parameterized
    const jobName = repoName;
    const triggerUrl = `${jenkinsUrl}/job/${jobName}/buildWithParameters`;

    const auth = Buffer.from(`${jenkinsUser}:${jenkinsToken}`).toString('base64');

    try {
      this.logger.log(`Triggering Jenkins job: ${jobName}`);
      await firstValueFrom(
        this.httpService.post(
          triggerUrl,
          null, // body is null for form params
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${auth}`,
            },
            params: {
              COMMIT_HASH: commitHash,
              BUILD_ID_FROM_BACKEND: buildId,
              GITHUB_TOKEN: githubToken, // Pass user's GitHub token for private repo access
            },
          },
        ),
      );
      this.logger.log(`Successfully triggered Jenkins job for commit ${commitHash.substring(0, 7)}`);
    } catch (error) {
      this.logger.error('Failed to trigger Jenkins job', error.response?.data || error.message);
      // Here you might want to update the build status to FAILED
    }
  }

  /**
   * Auto-create a Jenkins Pipeline job when a repository is created.
   * @param repoName - The name of the repository (used as job name)
   * @param repoFullName - The full name of the repository (owner/repo) for git clone
   * @param techStack - The tech stack preset to use for the pipeline
   */
  async createJob(repoName: string, repoFullName: string, techStack: string = 'nodejs'): Promise<boolean> {
    const jenkinsUrl = this.configService.get<string>('JENKINS_URL');
    const jenkinsUser = this.configService.get<string>('JENKINS_USER');
    const jenkinsToken = this.configService.get<string>('JENKINS_TOKEN');
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:4000';

    // Skip if Jenkins is not configured
    if (!jenkinsUrl || !jenkinsUser || !jenkinsToken) {
      this.logger.warn('Jenkins is not configured, skipping job creation');
      return false;
    }

    const auth = Buffer.from(`${jenkinsUser}:${jenkinsToken}`).toString('base64');
    const createUrl = `${jenkinsUrl}/createItem?name=${encodeURIComponent(repoName)}`;

    // Use the pipeline templates based on tech stack
    const jobConfig = getJenkinsJobConfig(techStack as TechStack, repoFullName, backendUrl);

    try {
      this.logger.log(`Creating Jenkins job: ${repoName} with tech stack: ${techStack}`);
      await firstValueFrom(
        this.httpService.post(createUrl, jobConfig, {
          headers: {
            'Content-Type': 'application/xml',
            Authorization: `Basic ${auth}`,
          },
        }),
      );
      this.logger.log(`Successfully created Jenkins job: ${repoName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create Jenkins job: ${repoName}`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Delete a Jenkins job when a repository is deleted.
   * @param repoName - The name of the job to delete
   */
  async deleteJob(repoName: string): Promise<boolean> {
    const jenkinsUrl = this.configService.get<string>('JENKINS_URL');
    const jenkinsUser = this.configService.get<string>('JENKINS_USER');
    const jenkinsToken = this.configService.get<string>('JENKINS_TOKEN');

    if (!jenkinsUrl || !jenkinsUser || !jenkinsToken) {
      this.logger.warn('Jenkins is not configured, skipping job deletion');
      return false;
    }

    const auth = Buffer.from(`${jenkinsUser}:${jenkinsToken}`).toString('base64');
    const deleteUrl = `${jenkinsUrl}/job/${encodeURIComponent(repoName)}/doDelete`;

    try {
      this.logger.log(`Deleting Jenkins job: ${repoName}`);
      await firstValueFrom(
        this.httpService.post(deleteUrl, null, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }),
      );
      this.logger.log(`Successfully deleted Jenkins job: ${repoName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete Jenkins job: ${repoName}`, error.response?.data || error.message);
      return false;
    }
  }
}


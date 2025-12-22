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
  ) {}

  async handlePushEvent(payload: any, signature: string) {
    // Step 1: Find the repo from the database using the payload
    const repo = await this.repoRepository.findOne({ where: { fullName: payload.repository.full_name } });
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

    const newBuild = this.buildRepository.create({
      repo: repo,
      commitHash: payload.after,
      triggeredBy: user,
    });
    await this.buildRepository.save(newBuild);

    this.logger.log(`Build ${newBuild.id} created for commit ${newBuild.commitHash.substring(0, 7)}`);

    await this.triggerJenkinsJob(repo.name, newBuild.commitHash, newBuild.id);
  }

  async triggerBuildForPR(repo: Repo, commitHash: string, triggeredBy: User | null) {
    const newBuild = this.buildRepository.create({
      repo: repo,
      commitHash: commitHash,
      triggeredBy: triggeredBy,
    });
    await this.buildRepository.save(newBuild);

    this.logger.log(`Build ${newBuild.id} created for merged PR with commit ${newBuild.commitHash.substring(0, 7)}`);

    await this.triggerJenkinsJob(repo.name, newBuild.commitHash, newBuild.id);
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

  private async triggerJenkinsJob(repoName: string, commitHash: string, buildId: string) {
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
          {
            COMMIT_HASH: commitHash,
            BUILD_ID_FROM_BACKEND: buildId, // Send our build ID to Jenkins
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${auth}`,
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
}


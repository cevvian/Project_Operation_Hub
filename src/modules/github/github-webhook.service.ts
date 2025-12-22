import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { PRStatus } from 'src/database/entities/enum/pr-status.enum';
import { WebhookStatus } from 'src/database/entities/enum/webhook-status.enum';

import { ConfigService } from '@nestjs/config';
import { DataSource, LessThan, Repository } from 'typeorm';
import { AppException } from 'src/exceptions/app.exception';
import { User } from 'src/database/entities/user.entity';
import { ErrorCode } from 'src/exceptions/error-code';
import { Octokit } from '@octokit/rest';
import { CommitService } from '../commit/commit.service';
import { PullRequestService } from '../pull-request/pull-request.service';
import { Repo } from 'src/database/entities/repo.entity';

@Injectable()
export class GithubWebhookService {
  private readonly logger = new Logger(GithubWebhookService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly commitService: CommitService,
    private readonly pullRequestService: PullRequestService,
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Repo)
    private readonly repoRepo: Repository<Repo>,
  ) {}

  async getGitHubTokenAndUsername(userId: string) {
    // TODO: Implement proper user identification from request
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }
    return { name: user.githubName, token: user.githubToken };
  }

  async createWehookRepo(repoName: string, webhookUrl: string, secret: string, userId: string) {
    const { name: owner, token } = await this.getGitHubTokenAndUsername(userId);
    const octokit = new Octokit({ auth: token });

    const res = await octokit.repos.createWebhook({
      owner: owner,
      repo: repoName,
      name: 'web',
      events: ['push', 'pull_request'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret,
        insecure_ssl: '0', // Use '1' for self-signed certs, '0' for valid certs
      },
    });

    return res.data;
  }
 

  async handlePingEvent(payload: any) {
    const repoGithubId = payload.repository.id;
    const repo = await this.repoRepo.findOne({ where: { githubId: repoGithubId } });

    if (!repo) {
      this.logger.warn(`Received ping event for unknown repository with GitHub ID: ${repoGithubId}`);
      return;
    }

    if (repo.webhookStatus !== 'ACTIVE') {
      repo.webhookStatus = WebhookStatus.ACTIVE;
      await this.repoRepo.save(repo);
      this.logger.log(`Webhook for repo ${repo.fullName} is now ACTIVE.`);
    }
  }

  async handlePushEvent(payload: any) {
    const repoFullName = payload.repository.full_name;
    const repo = await this.repoRepo.findOne({ where: { fullName: repoFullName } });

    if (!repo) {
      this.logger.warn(`Received push event for unknown repository: ${repoFullName}`);
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const commitData of payload.commits) {
        const taskKeyMatch = commitData.message.match(/([A-Z]+-\d+)/);

        await this.commitService.create(
          {
            hash: commitData.id,
            message: commitData.message,
            repoId: repo.id,
            authorName: commitData.author.name,
            authorEmail: commitData.author.email,
            taskKey: taskKeyMatch ? taskKeyMatch[1] : undefined,
          },
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully processed ${payload.commits.length} commits for repo ${repoFullName}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process push event for repo ${repoFullName}. Rolled back transaction.`, error.stack);
      throw new AppException(ErrorCode.DATABASE_TRANSACTION_FAIL);
    } finally {
      await queryRunner.release();
    }
  }

  async handlePullRequestEvent(payload: any) {
    switch (payload.action) {
      case 'opened':
        return this.handlePROpened(payload);
      case 'closed':
        if (payload.pull_request.merged) {
          return this.handlePRMerged(payload);
        }
        break;
      default:
        this.logger.log(`Ignoring PR event action: ${payload.action}`);
        return;
    }
  }

  private async handlePROpened(payload: any) {
    const prPayload = payload.pull_request;
    const repoPayload = payload.repository;

    return this.pullRequestService.createFromWebhook({
      title: prPayload.title,
      description: prPayload.body,
      status: PRStatus.OPEN,
      repoFullName: repoPayload.full_name,
      authorGithubName: prPayload.user.login,
      sourceBranch: prPayload.head.ref,
      targetBranch: prPayload.base.ref,
      githubId: prPayload.id,
      number: prPayload.number,
      url: prPayload.html_url,
    });
  }

  private async handlePRMerged(payload: any) {
    const githubId = payload.pull_request.id;
    this.logger.log(`Processing merge event for PR with GitHub ID: ${githubId}`);
    return this.pullRequestService.processMergedPR(payload);
  }

  private async deleteWebhook(owner: string, repoName: string, hookId: number, token: string): Promise<void> {
    const octokit = new Octokit({ auth: token });
    try {
      await octokit.repos.deleteWebhook({
        owner,
        repo: repoName,
        hook_id: hookId,
      });
      this.logger.log(`Successfully deleted webhook ${hookId} from ${owner}/${repoName}`);
    } catch (error) {
      if (error.status !== 404) {
        this.logger.error(`Failed to delete webhook ${hookId} from ${owner}/${repoName}`, error.stack);
        throw error;
      }
      this.logger.warn(`Webhook ${hookId} not found on GitHub for repo ${owner}/${repoName}. Proceeding as if deleted.`);
    }
  }

  private async recreateWebhook(repo: Repo): Promise<void> {
    this.logger.log(`Attempting to recreate webhook for repo: ${repo.fullName}`);
    const user = repo.createdBy;

    if (!user || !user.githubToken) {
      this.logger.error(`Cannot recreate webhook for repo ${repo.fullName}: User or GitHub token is missing.`);
      repo.webhookStatus = WebhookStatus.FAILED;
      await this.repoRepo.save(repo);
      return;
    }

    if (repo.webhookId) {
      const repoName = repo.fullName.split('/')[1];
      await this.deleteWebhook(repo.owner, repoName, repo.webhookId, user.githubToken);
    }

    const webhookUrl = this.configService.get<string>('WEBHOOK_BASE_URL');
    if (!webhookUrl) {
        this.logger.error('WEBHOOK_BASE_URL is not configured. Cannot create webhook.');
        repo.webhookStatus = WebhookStatus.FAILED;
        await this.repoRepo.save(repo);
        return;
    }

    if (!repo.webhookSecret) {
      this.logger.error(`Cannot recreate webhook for repo ${repo.fullName}: Webhook secret is missing.`);
      repo.webhookStatus = WebhookStatus.FAILED;
      await this.repoRepo.save(repo);
      return;
    }

    const newWebhook = await this.createWehookRepo(
      repo.fullName.split('/')[1],
      webhookUrl,
      repo.webhookSecret,
      user.id,
    );

    repo.webhookId = newWebhook.id;
    repo.webhookRetryCount += 1;
    await this.repoRepo.save(repo);

    this.logger.log(`Successfully recreated webhook for ${repo.fullName}. New webhook ID: ${newWebhook.id}. Retry count: ${repo.webhookRetryCount}.`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePendingWebhooks() {
    this.logger.log('Running cron job to check for pending webhooks...');

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const pendingRepos = await this.repoRepo.find({
      where: {
        webhookStatus: WebhookStatus.PENDING,
        createdAt: LessThan(tenMinutesAgo),
      },
      relations: ['createdBy'], // Eagerly load the createdBy user
    });

    if (pendingRepos.length === 0) {
      this.logger.log('No pending webhooks found that require action.');
      return;
    }

    this.logger.warn(`Found ${pendingRepos.length} repo(s) with pending webhooks older than 10 minutes.`);

    for (const repo of pendingRepos) {
      if (repo.webhookRetryCount < 3) {
        try {
          await this.recreateWebhook(repo);
        } catch (error) {
          this.logger.error(`An error occurred while trying to recreate webhook for repo ${repo.fullName}`, error.stack);
        }
      } else {
        this.logger.error(`Max retries reached for repo ${repo.fullName}. Marking webhook as FAILED.`);
        repo.webhookStatus = WebhookStatus.FAILED;
        await this.repoRepo.save(repo);
      }
    }
  }
}

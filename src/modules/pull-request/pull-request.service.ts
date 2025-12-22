import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PullRequest } from 'src/database/entities/pull-request.entity';
import { PRTaskLink } from 'src/database/entities/pr-task-link.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { CreatePrFromWebhookDto } from './dto/create-pr-from-webhook.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto';
import { PRStatus } from 'src/database/entities/enum/pr-status.enum';
import { TasksService } from '../tasks/tasks.service';
import { TaskStatus } from 'src/database/entities/enum/task-status.enum';
import { JenkinsService } from '../jenkins/jenkins.service'; // Import JenkinsService

@Injectable()
export class PullRequestService {
  private readonly logger = new Logger(PullRequestService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PullRequest)
    private readonly prRepository: Repository<PullRequest>,
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
    @Inject(forwardRef(() => JenkinsService))
    private readonly jenkinsService: JenkinsService, // Inject JenkinsService
  ) {}

  async createFromWebhook(dto: CreatePrFromWebhookDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = await queryRunner.manager.findOne(Repo, { where: { fullName: dto.repoFullName } });
      if (!repo) {
        this.logger.warn(`Repo ${dto.repoFullName} not found. Skipping PR creation.`);
        return;
      }

      const author = await queryRunner.manager.findOne(User, { where: { githubName: dto.authorGithubName } });
      if (!author) {
        this.logger.warn(`User with githubName ${dto.authorGithubName} not found. PR will be created without an author.`);
      }

      const newPR = queryRunner.manager.create(PullRequest, {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        repo: repo,
        createdBy: author, // Can be null if author not found
        githubId: dto.githubId,
        number: dto.number,
        url: dto.url,
      });

      const savedPR = await queryRunner.manager.save(newPR);

      // Find task key from title or branch name
      const taskKeyMatch = dto.title.match(/([A-Z]+-\d+)/) || dto.sourceBranch.match(/([A-Z]+-\d+)/);
      if (taskKeyMatch) {
        const taskKey = taskKeyMatch[1];
        const task = await queryRunner.manager.findOne(Task, { where: { key: taskKey } });
        if (task) {
          const prTaskLink = queryRunner.manager.create(PRTaskLink, {
            pullRequest: savedPR,
            task: task,
          });
          await queryRunner.manager.save(prTaskLink);
          this.logger.log(`Linked PR ${savedPR.id} to task ${task.key}`);
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully created PR ${savedPR.id} for repo ${repo.fullName}`);
      return savedPR;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create PR from webhook', error.stack);
      throw new AppException(ErrorCode.DATABASE_TRANSACTION_FAIL);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(repoId: string, page: number, limit: number) {
    const [data, total] = await this.prRepository.findAndCount({
      where: { repo: { id: repoId } },
      relations: ['createdBy', 'taskLinks', 'taskLinks.task'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const pr = await this.prRepository.findOne({
      where: { id },
      relations: ['createdBy', 'repo', 'taskLinks', 'taskLinks.task'],
    });

    if (!pr) {
      throw new AppException(ErrorCode.PR_NOT_FOUND);
    }
    return pr;
  }

  async update(id: string, dto: UpdatePullRequestDto) {
    const pr = await this.findOne(id);

    Object.assign(pr, dto);

    return this.prRepository.save(pr);
  }

  async remove(id: string) {
    const pr = await this.findOne(id);
    await this.prRepository.remove(pr);
    return { message: 'Pull request deleted successfully.' };
  }

  async findByGithubId(githubId: number): Promise<PullRequest | null> {
    return this.prRepository.findOne({
      where: { githubId },
      relations: ['taskLinks', 'taskLinks.task', 'repo', 'createdBy'],
    });
  }

  async updateStatus(id: string, status: PRStatus) {
    const pr = await this.findOne(id);
    pr.status = status;
    return this.prRepository.save(pr);
  }

  async processMergedPR(payload: any) {
    const prPayload = payload.pull_request;
    const githubId = prPayload.id;
    const mergeCommitSha = prPayload.merge_commit_sha;

    if (!mergeCommitSha) {
      this.logger.warn(`PR merge event for githubId ${githubId} is missing a merge_commit_sha. Cannot trigger build.`);
      return;
    }

    const pr = await this.findByGithubId(githubId);
    if (!pr) {
      this.logger.warn(`Received merge event for a PR not found in DB (githubId: ${githubId})`);
      return;
    }

    if (!pr.repo) {
      this.logger.error(`PR ${pr.id} is missing repository information. Cannot trigger build.`);
      return;
    }

    // Update the PR status to MERGED
    await this.updateStatus(pr.id, PRStatus.MERGED);

    // Update status for all linked tasks
    if (pr.taskLinks && pr.taskLinks.length > 0) {
      for (const link of pr.taskLinks) {
        if (link.task) {
          try {
            await this.tasksService.updateStatus(link.task.id, TaskStatus.QA);
            this.logger.log(`Updated task ${link.task.key} to QA status.`);
          } catch (error) {
            this.logger.error(`Failed to update status for task ${link.task.key}`, error.stack);
          }
        }
      }
    }

    // Trigger Jenkins build
    await this.jenkinsService.triggerBuildForPR(pr.repo, mergeCommitSha, pr.createdBy);
  }
}


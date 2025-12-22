import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Build } from 'src/database/entities/build.entity';
import { Deployment } from 'src/database/entities/deployment.entity';
import { Commit } from 'src/database/entities/commit.entity';
import { BuildStatus } from 'src/database/entities/enum/build-status.enum';
import { DeploymentStatus } from 'src/database/entities/enum/deploy-status.enum';
import { TaskStatus } from 'src/database/entities/enum/task-status.enum';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { In, Repository } from 'typeorm';
import { TasksService } from '../tasks/tasks.service';
import { UpdateBuildStatusDto } from './dto/update-build-status.dto';

@Injectable()
export class BuildsService {
  private readonly logger = new Logger(BuildsService.name);

  constructor(
    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>,
    @InjectRepository(Deployment)
    private readonly deploymentRepository: Repository<Deployment>,
    @InjectRepository(Commit)
    private readonly commitRepository: Repository<Commit>,
    private readonly tasksService: TasksService,
  ) {}

  async updateStatusFromJenkins(id: string, dto: UpdateBuildStatusDto) {
    const build = await this.buildRepository.findOne({ where: { id }, relations: ['repo', 'triggeredBy'] });
    if (!build) {
      throw new AppException(ErrorCode.BUILD_NOT_FOUND);
    }

    build.status = dto.status;
    build.finishedAt = new Date(dto.finishedAt);
    build.jenkinsBuildNumber = dto.jenkinsBuildNumber;

    if (dto.status === BuildStatus.SUCCESS) {
      await this.handleSuccessfulBuild(build);
    } else if (dto.status === BuildStatus.FAILED) {
      await this.handleFailedBuild(build);
    }

    return this.buildRepository.save(build);
  }

  private async handleSuccessfulBuild(build: Build) {
    this.logger.log(`Build ${build.id} succeeded. Creating deployment record.`);
    const deployment = this.deploymentRepository.create({
      build: build,
      // Assuming a default environment for now. This could be parameterized.
      // environment: stagingEnvironment,
      deployedBy: build.triggeredBy,
      status: DeploymentStatus.SUCCESS, // Or 'IN_PROGRESS' if deployment is a separate step
    });
    await this.deploymentRepository.save(deployment);
    // TODO: Notify QA team
  }

  private async handleFailedBuild(build: Build) {
    this.logger.warn(`Build ${build.id} failed. Finding related tasks to update.`);

    const commit = await this.commitRepository.findOne({
      where: { hash: build.commitHash },
      relations: ['task'],
    });

    if (!commit || !commit.task) {
      this.logger.log(`No task found linked to commit ${build.commitHash.substring(0, 7)}.`);
      // TODO: Notify developer who triggered the build as a fallback
      return;
    }

    const task = commit.task;
    this.logger.log(`Found task to update: ${task.key}`);

    try {
      await this.tasksService.updateStatus(task.id, TaskStatus.BLOCKED);
    } catch (error) {
      this.logger.error(`Failed to update task ${task.key} to BLOCKED`, error.stack);
    }

    // TODO: Notify developer
  }
}


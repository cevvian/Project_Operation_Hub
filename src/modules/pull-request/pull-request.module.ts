import { forwardRef, Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PullRequest } from 'src/database/entities/pull-request.entity';
import { PRTaskLink } from 'src/database/entities/pr-task-link.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { PullRequestController } from './pull-request.controller';
import { PullRequestService } from './pull-request.service';
import { JenkinsModule } from '../jenkins/jenkins.module'; // Import JenkinsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([PullRequest, PRTaskLink, Repo, Task, User]),
    forwardRef(() => TasksModule), // Use forwardRef to avoid circular dependencies
    forwardRef(() => JenkinsModule), // Import JenkinsModule
  ],
  controllers: [PullRequestController],
  providers: [PullRequestService],
  exports: [PullRequestService],
})
export class PullRequestModule {}


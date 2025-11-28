import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { GithubWebhookService } from './github-webhook.service';
import { PRTaskLink } from 'src/database/entities/pr-task-link.entity';
import { PullRequest } from 'src/database/entities/pull-request.entity';
import { Task } from 'src/database/entities/task.entity';
import { Commit } from 'src/database/entities/commit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([PullRequest]),
    TypeOrmModule.forFeature([Task]),
    TypeOrmModule.forFeature([Commit]),
    TypeOrmModule.forFeature([PRTaskLink]),
  ],
  controllers: [GithubController, /*GithubWebhookController*/],
  providers: [GithubService, GithubWebhookService],
  exports: [GithubService],
})
export class GithubModule {}

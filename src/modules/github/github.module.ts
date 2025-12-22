import { forwardRef, Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from 'src/database/entities/user.entity';
import { GithubWebhookService } from './github-webhook.service';
import { PRTaskLink } from 'src/database/entities/pr-task-link.entity';
import { PullRequest } from 'src/database/entities/pull-request.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { CommitModule } from '../commit/commit.module';
import { PullRequestModule } from '../pull-request/pull-request.module';
import { JenkinsModule } from '../jenkins/jenkins.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PullRequest, PRTaskLink, Repo]),
    CommitModule,
    PullRequestModule,
    forwardRef(() => JenkinsModule),
    ConfigModule,
  ],
  controllers: [GithubController /*GithubWebhookController*/],
  providers: [GithubService, GithubWebhookService],
  exports: [GithubService, GithubWebhookService],
})
export class GithubModule { }

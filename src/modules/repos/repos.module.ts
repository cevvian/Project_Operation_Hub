import { Module } from '@nestjs/common';
import { ReposService } from './repos.service';
import { ReposController } from './repos.controller';
import { RepoDetailsController } from './repo-details.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/database/entities/project.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { User } from 'src/database/entities/user.entity';
import { GithubModule } from '../github/github.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repo, Project, User]),
    GithubModule,
    ConfigModule,
  ],
  controllers: [ReposController, RepoDetailsController],
  providers: [ReposService],
})
export class ReposModule { }

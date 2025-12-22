import { forwardRef, Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from 'src/database/entities/build.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { User } from 'src/database/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JenkinsController } from './jenkins.controller';
import { JenkinsService } from './jenkins.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Build, Repo, User]),
    HttpModule, // Import HttpModule to make HTTP requests to Jenkins
    ConfigModule, // Import ConfigModule to use ConfigService
    forwardRef(() => GithubModule),
  ],
  controllers: [JenkinsController],
  providers: [JenkinsService],
  exports: [JenkinsService],
})
export class JenkinsModule {}


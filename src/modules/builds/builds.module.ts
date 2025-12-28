import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from 'src/database/entities/build.entity';
import { Deployment } from 'src/database/entities/deployment.entity';
import { Task } from 'src/database/entities/task.entity';
import { Commit } from 'src/database/entities/commit.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { TasksModule } from '../tasks/tasks.module';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyGuard } from '../auth/guard/api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Build, Deployment, Task, Commit, Repo]),
    TasksModule,
    ConfigModule,
  ],
  controllers: [BuildsController],
  providers: [BuildsService, ApiKeyGuard],
})
export class BuildsModule { }

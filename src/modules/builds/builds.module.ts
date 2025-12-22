import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from 'src/database/entities/build.entity';
import { Deployment } from 'src/database/entities/deployment.entity';
import { Task } from 'src/database/entities/task.entity';
import { Commit } from 'src/database/entities/commit.entity';
import { TasksModule } from '../tasks/tasks.module';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyGuard } from '../auth/guard/api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Build, Deployment, Task, Commit]),
    TasksModule, // Import TasksModule to use TasksService
    ConfigModule, // Import ConfigModule to use ConfigService in ApiKeyGuard
  ],
  controllers: [BuildsController],
  providers: [BuildsService, ApiKeyGuard], // Provide ApiKeyGuard here
})
export class BuildsModule {}



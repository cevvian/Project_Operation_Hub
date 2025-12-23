import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/database/entities/project.entity';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { ProjectMember } from 'src/database/entities/project-member.entity';

import { TasksGlobalController } from './tasks-global.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    TypeOrmModule.forFeature([Sprint]),
    TypeOrmModule.forFeature([Project]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([ProjectMember]),
  ],
  controllers: [TasksController, TasksGlobalController],
  providers: [TasksService],
  exports: [TasksService]
})
export class TasksModule { }

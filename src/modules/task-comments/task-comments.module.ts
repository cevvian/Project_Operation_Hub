import { Module } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { TaskCommentsController } from './task-comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskComment } from 'src/database/entities/task-comment.entity';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { ProjectMember } from 'src/database/entities/project-member.entity';
import { Project } from 'src/database/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    TypeOrmModule.forFeature([TaskComment]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([ProjectMember]),
    TypeOrmModule.forFeature([Project]),
  ],
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService],
})
export class TaskCommentsModule {}

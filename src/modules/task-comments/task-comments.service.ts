import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskComment } from 'src/database/entities/task-comment.entity';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { Repository } from 'typeorm';
import { ProjectMember } from 'src/database/entities/project-member.entity';
import { Project } from 'src/database/entities/project.entity';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment) private readonly commentRepo: Repository<TaskComment>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(ProjectMember) private readonly memberRepo: Repository<ProjectMember>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
  ) {}

  private async checkProjectMembership(userId: string, projectId: string): Promise<void> {
    const member = await this.memberRepo.findOne({ where: { user: { id: userId }, project: { id: projectId } } });
    if (member) return;

    const project = await this.projectRepo.findOne({ where: { id: projectId }, relations: ['owner'] });
    if (project?.owner?.id === userId) return;

    throw new AppException(ErrorCode.UNAUTHORIZED);
  }

  async create(projectId: string, dto: CreateTaskCommentDto, userId: string) {
    const task = await this.taskRepo.findOne({ where: { id: dto.taskId, project: { id: projectId } } });
    if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);

    await this.checkProjectMembership(userId, projectId);

    const newComment = this.commentRepo.create({
      content: dto.content,
      task,
      author: { id: userId } as User,
    });

    return this.commentRepo.save(newComment);
  }

  async findByTask(projectId: string, taskId: string, userId: string) {
    await this.checkProjectMembership(userId, projectId);
    const task = await this.taskRepo.findOne({ where: { id: taskId, project: { id: projectId } } });
    if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);

    return this.commentRepo.find({
      where: { task: { id: taskId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(projectId: string, commentId: string, dto: UpdateTaskCommentDto, userId: string) {
    await this.checkProjectMembership(userId, projectId);

    const comment = await this.commentRepo.findOne({ where: { id: commentId }, relations: ['author', 'task'] });
    if (!comment) throw new AppException(ErrorCode.TASK_COMMENT_NOT_FOUND);
    if (comment.task.project?.id !== projectId) throw new AppException(ErrorCode.UNAUTHORIZED);
    if (comment.author.id !== userId) throw new ForbiddenException('You cannot edit this comment');

    if (dto.content) {
      comment.content = dto.content;
    }
    return this.commentRepo.save(comment);
  }

  async remove(projectId: string, commentId: string, userId: string) {
    await this.checkProjectMembership(userId, projectId);

    const comment = await this.commentRepo.findOne({ where: { id: commentId }, relations: ['author', 'task'] });
    if (!comment) throw new AppException(ErrorCode.TASK_COMMENT_NOT_FOUND);
    if (comment.task.project?.id !== projectId) throw new AppException(ErrorCode.UNAUTHORIZED);
    if (comment.author.id !== userId) throw new ForbiddenException('You cannot delete this comment');

    await this.commentRepo.remove(comment);
    return { message: 'Comment deleted successfully' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskComment } from 'src/database/entities/task-comment.entity';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly commentRepo: Repository<TaskComment>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateTaskCommentDto,/* user: User*/) {
    const task = await this.taskRepo.findOne({ where: { id: dto.taskId } });
    if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);

    const userId = 'nggorgheoh'
    const user = await this.userRepo.findOne({
      where: {id: userId}
    })
    if(!user) throw new AppException(ErrorCode.USER_NOT_EXISTED);

    const newComment = this.commentRepo.create({
      content: dto.content,
      task,
      user,
    });

    return this.commentRepo.save(newComment);
  }

  async findByTask(taskId: string) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);

    return this.commentRepo.find({
      where: { task: { id: taskId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteAllByTask(taskId: string) {
    return this.commentRepo.delete({ task: { id: taskId } });
  }

  async countByTask(taskId: string) {
    return this.commentRepo.count({
      where: { task: { id: taskId } },
    });
  }


  async findAll(page: number, limit: number) {
    const [data, total] = await this.commentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['task', 'user'],
    });

    if (!comment) throw new AppException(ErrorCode.TASK_COMMENT_NOT_FOUND)
    return comment;
  }

  async update(id: string, dto: UpdateTaskCommentDto) {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['user'],
    })

    if (!comment) throw new AppException(ErrorCode.TASK_COMMENT_NOT_FOUND)

      // ktra user co quyen chinh sua comment khong
    // if (comment.user?.id !== user.id)
    //   throw new ForbiddenException('You cannot edit this comment');

    if(dto.content)
      comment.content = dto.content

    return this.commentRepo.save(comment)
  }

  async remove(id: string) {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) throw new AppException(ErrorCode.TASK_COMMENT_NOT_FOUND)

      // ktra quyen cua nguoi dang thuc hien xoa
    // if (comment.user?.id !== user.id)
    //   throw new ForbiddenException('You cannot delete this comment');

    const result = await this.commentRepo.delete(id);

    if (result.affected && result.affected > 0) {
      return 'Delete successfully';
    } else {
      throw new AppException(ErrorCode.DELETE_FAIL);
    }
  }
}

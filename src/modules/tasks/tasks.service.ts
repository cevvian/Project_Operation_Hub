import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/database/entities/task.entity';
import { Project } from 'src/database/entities/project.entity';
import { Sprint } from 'src/database/entities/sprint.entity';
import { User } from 'src/database/entities/user.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { canTransition, TaskStatus } from 'src/database/entities/enum/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
  ) {}

  async generateTaskKey(projectId: string): Promise<string> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new AppException(ErrorCode.PROJECT_NOT_FOUND);

    // Lấy task cuối cùng của project
    const lastTask = await this.taskRepo.findOne({
      where: { project: { id: projectId } },
      order: { created_at: 'DESC' },
    });

    const nextNumber = lastTask
      ? parseInt(lastTask.key.split('-')[1]) + 1
      : 1;

    return `${project.keyPrefix}-${nextNumber.toString().padStart(3, '0')}`;
  }

  async changeStatus(taskId: string, newStatus: TaskStatus) {
    const task = await this.findOne(taskId);

    if (!canTransition(task.status, newStatus))
        throw new AppException(ErrorCode.INVALID_TASK_STATUS_TRANSITION);
      task.status = newStatus;

    return await this.taskRepo.save(task);
  }

  async assignTask(taskId: string, userId: string) {
    const task = await this.findOne(taskId);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppException(ErrorCode.USER_NOT_EXISTED);

    task.assignee = user;

    return await this.taskRepo.save(task);
  }

  async addToSprint(taskId: string, sprintId: string) {
    const task = await this.findOne(taskId);

    const sprint = await this.sprintRepo.findOne({ where: { id: sprintId } });
    if (!sprint) throw new AppException(ErrorCode.SPRINT_NOT_FOUND);

    task.sprint = sprint;

    return await this.taskRepo.save(task);
  }
  
  async create(dto: CreateTaskDto) {
    const task = this.taskRepo.create({
      name: dto.name,
      description: dto.description,
      status: dto.status,
    });
    
    const project = await this.projectRepo.findOne({ where: { id: dto.projectId } });
    if (!project) throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    task.project = project
    task.key = await this.generateTaskKey(project.id)

    const reporter = await this.userRepo.findOne({ where: { id: dto.reporterId } });
    if (!reporter) throw new AppException(ErrorCode.USER_NOT_EXISTED);
    task.reporter = reporter

    if (dto.assigneeId) {
      const assignee = await this.userRepo.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) throw new AppException(ErrorCode.USER_NOT_EXISTED);
      task.assignee = assignee
    }

    if (dto.sprintId) {
      const sprint = await this.sprintRepo.findOne({ where: { id: dto.sprintId } });
      if (!sprint) throw new AppException(ErrorCode.SPRINT_NOT_FOUND);
      task.sprint
    }

    return await this.taskRepo.save(task);
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.taskRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      // relations: ['project', 'sprint', 'assignee', 'reporter', 'comments', 'attachments'],
      order: { created_at: 'DESC' },
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
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['project', 'sprint', 'assignee', 'reporter', 'comments', 'attachments'],
    });

    if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.findOne(id);

    if (dto.projectId && dto.projectId !== task.project.id) {
      const project = await this.projectRepo.findOne({ where: { id: dto.projectId } });
      if (!project) throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
      task.project = project;
    }

    if (dto.sprintId) {
      const sprint = await this.sprintRepo.findOne({ where: { id: dto.sprintId } });
      if (!sprint) throw new AppException(ErrorCode.SPRINT_NOT_FOUND);
      task.sprint = sprint;
    }

    if (dto.assigneeId) {
      const assignee = await this.userRepo.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) throw new AppException(ErrorCode.USER_NOT_EXISTED);
      task.assignee = assignee;
    }

    if (dto.status && dto.status !== task.status) {
      if (!canTransition(task.status, dto.status))
        throw new AppException(ErrorCode.INVALID_TASK_STATUS_TRANSITION);
      task.status = dto.status;
    }

    Object.assign(task, {
      name: dto.name ?? task.name,
      description: dto.description ?? task.description,
    });

    return await this.taskRepo.save(task);
  }

  async remove(id: string) {
    await this.findOne(id);

    const result = await this.taskRepo.delete(id);

    if (result.affected && result.affected > 0) {
      return 'Delete successfully';
    } else {
      throw new AppException(ErrorCode.DELETE_FAIL);
    }
  }
}

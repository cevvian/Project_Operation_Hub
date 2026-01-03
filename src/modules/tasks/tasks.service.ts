import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindManyOptions, IsNull, Not, Repository, LessThan } from 'typeorm';
import { Task } from 'src/database/entities/task.entity';
import { Project } from 'src/database/entities/project.entity';
import { User } from 'src/database/entities/user.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { ProjectMember } from 'src/database/entities/project-member.entity';
import { MoveTaskDto } from './dto/move-task.dto';
import { TaskStatus } from 'src/database/entities/enum/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(ProjectMember) private readonly memberRepo: Repository<ProjectMember>,
    private readonly dataSource: DataSource,
  ) { }

  private async checkProjectMembership(userId: string, projectId: string): Promise<void> {
    // First, check membership table
    const member = await this.memberRepo.findOne({ where: { user: { id: userId }, project: { id: projectId } } });
    if (member) return;

    // If not a member, allow project owner as implicit member to avoid legacy data issues
    const project = await this.projectRepo.findOne({ where: { id: projectId }, relations: ['owner'] });
    if (project?.owner?.id === userId) return;

    // Otherwise, unauthorized
    throw new AppException(ErrorCode.UNAUTHORIZED);
  }

  private async getTask(taskId: string, projectId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, project: { id: projectId } },
      relations: ['prLinks', 'prLinks.pullRequest'],
    });
    if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);
    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    await this.checkProjectMembership(userId, dto.projectId);

    const project = await this.projectRepo.findOneBy({ id: dto.projectId });
    if (!project) throw new AppException(ErrorCode.PROJECT_NOT_FOUND);

    const reporter = await this.userRepo.findOneBy({ id: userId });
    if (!reporter) throw new AppException(ErrorCode.USER_NOT_EXISTED); // Should not happen

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const lastTask = await queryRunner.manager.findOne(Task, {
        where: { project: { id: dto.projectId } },
        order: { createdAt: 'DESC' },
      });

      const nextKeyNumber = lastTask ? parseInt(lastTask.key.split('-')[1]) + 1 : 1;
      const taskKey = `${project.keyPrefix}-${nextKeyNumber}`;

      const maxOrderIndexResult = await queryRunner.manager.findOne(Task, {
        where: { sprint: dto.sprintId ? { id: dto.sprintId } : IsNull(), status: dto.status ?? TaskStatus.TODO },
        order: { orderIndex: 'DESC' },
      });
      const orderIndex = (maxOrderIndexResult?.orderIndex ?? -1) + 1;

      const task = queryRunner.manager.create(Task, {
        ...dto,
        key: taskKey,
        project,
        reporter,
        orderIndex,
        sprint: dto.sprintId ? { id: dto.sprintId } : null,
        assignee: dto.assigneeId ? { id: dto.assigneeId } : null,
        parentTask: dto.parentTaskId ? { id: dto.parentTaskId } : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      });

      const savedTask = await queryRunner.manager.save(task);
      await queryRunner.commitTransaction();
      return savedTask;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByProject(projectId: string, userId: string, options: FindManyOptions<Task> = {}) {
    await this.checkProjectMembership(userId, projectId);
    return this.taskRepo.find({
      where: { project: { id: projectId }, ...options.where },
      relations: { assignee: true, sprint: true, ...options.relations },
      order: { orderIndex: 'ASC', ...options.order },
      ...options,
    });
  }

  async findOne(taskId: string, projectId: string, userId: string) {
    await this.checkProjectMembership(userId, projectId);
    return this.getTask(taskId, projectId);
  }

  async update(taskId: string, projectId: string, userId: string, dto: UpdateTaskDto) {
    await this.checkProjectMembership(userId, projectId);
    const task = await this.getTask(taskId, projectId);

    // Prevent changing critical fields directly
    delete dto.projectId;

    // Handle assignee and reporter separately
    if (dto.assigneeId) {
      task.assignee = await this.userRepo.findOneBy({ id: dto.assigneeId });
    } else if (dto.assigneeId === null) {
      task.assignee = null;
    }

    if (dto.reporterId) {
      const newReporter = await this.userRepo.findOneBy({ id: dto.reporterId });
      if (!newReporter) {
        throw new AppException(ErrorCode.USER_NOT_EXISTED);
      }
      task.reporter = newReporter;
    }

    // Remove relation IDs from DTO to prevent conflicts with Object.assign
    delete dto.assigneeId;
    delete dto.reporterId;

    Object.assign(task, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : task.startDate,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
    });

    return this.taskRepo.save(task);
  }

  async updateStatus(taskId: string, newStatus: TaskStatus) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    // You might want to add transition validation here if needed
    // if (!canTransition(task.status, newStatus)) {
    //   throw new AppException(ErrorCode.INVALID_TASK_STATUS_TRANSITION);
    // }

    task.status = newStatus;
    return this.taskRepo.save(task);
  }

  async remove(taskId: string, projectId: string, userId: string) {
    await this.checkProjectMembership(userId, projectId);
    const task = await this.getTask(taskId, projectId);
    await this.taskRepo.remove(task);
    return { message: 'Task deleted successfully' };
  }

  async move(taskId: string, projectId: string, userId: string, dto: MoveTaskDto) {
    await this.checkProjectMembership(userId, projectId);

    return this.dataSource.transaction(async (em) => {
      const task = await em.findOne(Task, { where: { id: taskId, project: { id: projectId } }, relations: ['sprint'] });
      if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);

      const fromSprintId = task.sprint?.id ?? null;
      const fromStatus = task.status;
      const fromIndex = task.orderIndex;

      const toSprintId = dto.toSprintId === undefined ? fromSprintId : dto.toSprintId;
      const toStatus = dto.toStatus === undefined ? fromStatus : dto.toStatus;
      const toIndex = dto.toIndex;

      const sameList = fromSprintId === toSprintId && fromStatus === toStatus;

      if (sameList) {
        if (toIndex > fromIndex) {
          // Move down: shift up items between (fromIndex, toIndex]
          const qb = em.createQueryBuilder().update(Task).set({ orderIndex: () => '"orderIndex" - 1' });
          qb.where('status = :status AND "orderIndex" > :fromIndex AND "orderIndex" <= :toIndex', {
            status: fromStatus,
            fromIndex,
            toIndex,
          });
          if (fromSprintId) qb.andWhere('sprint_id = :sprintId', { sprintId: fromSprintId });
          else qb.andWhere('sprint_id IS NULL');
          await qb.execute();
        } else {
          // Move up: shift down items between [toIndex, fromIndex)
          const qb = em.createQueryBuilder().update(Task).set({ orderIndex: () => '"orderIndex" + 1' });
          qb.where('status = :status AND "orderIndex" >= :toIndex AND "orderIndex" < :fromIndex', {
            status: fromStatus,
            fromIndex,
            toIndex,
          });
          if (fromSprintId) qb.andWhere('sprint_id = :sprintId', { sprintId: fromSprintId });
          else qb.andWhere('sprint_id IS NULL');
          await qb.execute();
        }
      } else {
        // 1) Leaving old list: shift up items after fromIndex
        const decrementQb = em.createQueryBuilder().update(Task).set({ orderIndex: () => '"orderIndex" - 1' });
        decrementQb.where('status = :status AND "orderIndex" > :fromIndex', { status: fromStatus, fromIndex });
        if (fromSprintId) decrementQb.andWhere('sprint_id = :fromSprintId', { fromSprintId });
        else decrementQb.andWhere('sprint_id IS NULL');
        await decrementQb.execute();

        // 2) Entering new list: shift down items at or after toIndex
        const incrementQb = em.createQueryBuilder().update(Task).set({ orderIndex: () => '"orderIndex" + 1' });
        incrementQb.where('status = :status AND "orderIndex" >= :toIndex', { status: toStatus, toIndex });
        if (toSprintId) incrementQb.andWhere('sprint_id = :toSprintId', { toSprintId });
        else incrementQb.andWhere('sprint_id IS NULL');
        await incrementQb.execute();
      }

      // 3. Update the task itself
      task.sprint = toSprintId ? ({ id: toSprintId } as any) : null;
      task.status = toStatus;
      task.orderIndex = toIndex;
      return em.save(task);
    });
  }

  async findByUser(userId: string) {
    return this.taskRepo.find({
      where: { assignee: { id: userId } },
      relations: { project: true, sprint: true },
      order: { dueDate: 'ASC', priority: 'DESC' },
    });
  }

  async getStatsByUser(userId: string) {
    const total = await this.taskRepo.count({ where: { assignee: { id: userId } } });

    const completed = await this.taskRepo.count({
      where: { assignee: { id: userId }, status: TaskStatus.DONE }
    });

    const active = await this.taskRepo.count({
      where: [
        { assignee: { id: userId }, status: TaskStatus.TODO },
        { assignee: { id: userId }, status: TaskStatus.IN_PROGRESS },
        { assignee: { id: userId }, status: TaskStatus.REVIEW },
      ]
    });

    const overdue = await this.taskRepo.count({
      where: {
        assignee: { id: userId },
        status: Not(TaskStatus.DONE),
        dueDate: LessThan(new Date()),
      }
    });

    return { total, completed, active, overdue };
  }

  async getWeeklyActivity(userId: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get tasks updated in last 7 days where user is assignee OR reporter
    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .where('(task.assignee_id = :userId OR task.reporter_id = :userId)', { userId })
      .andWhere('task.updatedAt >= :start', { start: sevenDaysAgo })
      .andWhere('task.updatedAt <= :end', { end: today })
      .getMany();

    // Group by day
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const result: { day: string; date: string; tasks: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const count = tasks.filter(t => {
        const updated = new Date(t.updatedAt);
        return updated >= dayStart && updated <= dayEnd;
      }).length;

      result.push({
        day: dayNames[date.getDay()],
        date: date.toISOString().split('T')[0],
        tasks: count,
      });
    }

    return result;
  }
}


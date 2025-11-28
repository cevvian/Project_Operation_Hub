import { Injectable } from '@nestjs/common';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/database/entities/project.entity';
import { Sprint } from 'src/database/entities/sprint.entity';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { Task } from 'src/database/entities/task.entity';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  
  async create(createSprintDto: CreateSprintDto) {
    const project = await this.projectRepo.findOne({
      where: { id: createSprintDto.projectId },
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    const sprint = this.sprintRepo.create({
      name: createSprintDto.name,
      start_date: createSprintDto.start_date,
      end_date: createSprintDto.end_date,
      project,
    });

    return await this.sprintRepo.save(sprint);
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.sprintRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['project', 'tasks'],
      order: { start_date: 'ASC' },
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
    const sprint = await this.sprintRepo.findOne({
      where: { id },
      relations: ['project', 'tasks'],
    });

    if (!sprint) throw new AppException(ErrorCode.SPRINT_NOT_FOUND);

    return sprint;
  }

  async findByProject(projectId: string) {
    return this.sprintRepo.find({
      where: { project: { id: projectId } },
      order: { start_date: 'ASC' },
      relations: ['tasks'],
    });
  }

  async getCurrentSprint(projectId: string, date = new Date().toISOString()) {
    return this.sprintRepo.findOne({
      where: {
        project: { id: projectId },
        start_date: LessThanOrEqual(date),
        end_date: MoreThanOrEqual(date),
      },
      relations: ['tasks'],
    });
  }

  async archiveSprint(id: string) {
    const sprint = await this.findOne(id);
    sprint.archived = true;
    return this.sprintRepo.save(sprint);
  }

  async addTaskToSprint(sprintId: string, task: Task) {
    const sprint = await this.findOne(sprintId);
    sprint.tasks.push(task);
    return this.sprintRepo.save(sprint);
  }

  async update(id: string, updateSprintDto: UpdateSprintDto) {
    const sprint = await this.findOne(id);

    Object.assign(sprint, {
      name: updateSprintDto.name ?? sprint.name,
      start_date: updateSprintDto.start_date ?? sprint.start_date,
      end_date: updateSprintDto.end_date ?? sprint.end_date,
    });

    return await this.sprintRepo.save(sprint);
  }

  async remove(id: string) {
    await this.findOne(id);

    const result = await this.sprintRepo.delete(id);

    if (result.affected && result.affected > 0) {
      return 'Delete successfully';
    } else {
      throw new AppException(ErrorCode.DELETE_FAIL);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/database/entities/project.entity';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Repository } from 'typeorm';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { ProjectMember } from 'src/database/entities/project-member.entity';
import { SprintStatus } from 'src/database/entities/enum/sprint-status.enum';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint) private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember) private readonly memberRepo: Repository<ProjectMember>,
  ) {}

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

  async create(dto: CreateSprintDto, userId: string) {
    await this.checkProjectMembership(userId, dto.projectId);
    const project = await this.projectRepo.findOneBy({ id: dto.projectId });
    if (!project) throw new AppException(ErrorCode.PROJECT_NOT_FOUND);

    const maxOrder = await this.sprintRepo
      .createQueryBuilder('sprint')
      .select('MAX(sprint.orderIndex)', 'max')
      .where('sprint.projectId = :projectId', { projectId: dto.projectId })
      .getRawOne();

    const sprint = this.sprintRepo.create({
      project,
      name: dto.name,
      goal: dto.goal,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      orderIndex: (maxOrder.max || 0) + 1,
      status: SprintStatus.PLANNED,
    });

    return this.sprintRepo.save(sprint);
  }

  async findByProject(
    projectId: string,
    userId: string,
    includeTasks = false,
    filters?: { statuses?: string[]; startFrom?: string; startTo?: string; endFrom?: string; endTo?: string },
  ) {
    await this.checkProjectMembership(userId, projectId);

    const qb = this.sprintRepo
      .createQueryBuilder('sprint')
      .leftJoinAndSelect('sprint.tasks', 'tasks', includeTasks ? undefined : '1=0')
      .where('sprint.projectId = :projectId', { projectId })
      // Single ordering rule requested: earliest startDate first. Nulls last.
      .orderBy('sprint.startDate', 'ASC', 'NULLS LAST')
      .addOrderBy('sprint.orderIndex', 'ASC');

    if (filters?.statuses?.length) {
      qb.andWhere('sprint.status IN (:...statuses)', { statuses: filters.statuses });
    }
    if (filters?.startFrom) {
      qb.andWhere('sprint.startDate IS NOT NULL AND sprint.startDate >= :startFrom', { startFrom: filters.startFrom });
    }
    if (filters?.startTo) {
      qb.andWhere('sprint.startDate IS NOT NULL AND sprint.startDate <= :startTo', { startTo: filters.startTo });
    }
    if (filters?.endFrom) {
      qb.andWhere('sprint.endDate IS NOT NULL AND sprint.endDate >= :endFrom', { endFrom: filters.endFrom });
    }
    if (filters?.endTo) {
      qb.andWhere('sprint.endDate IS NOT NULL AND sprint.endDate <= :endTo', { endTo: filters.endTo });
    }

    return qb.getMany();
  }

  async findOne(sprintId: string, projectId: string, userId: string) {
    await this.checkProjectMembership(userId, projectId);
    const sprint = await this.sprintRepo.findOne({ where: { id: sprintId, project: { id: projectId } } });
    if (!sprint) throw new AppException(ErrorCode.SPRINT_NOT_FOUND);
    return sprint;
  }

  async update(sprintId: string, projectId: string, userId: string, dto: UpdateSprintDto) {
    const sprint = await this.findOne(sprintId, projectId, userId);

    Object.assign(sprint, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : sprint.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : sprint.endDate,
    });

    // Prevent changing projectId
    if (dto.projectId) delete (sprint as any).projectId;

    return this.sprintRepo.save(sprint);
  }

  async remove(sprintId: string, projectId: string, userId: string) {
    const sprint = await this.findOne(sprintId, projectId, userId);
    // TODO: Add logic to handle tasks in the sprint (e.g., move to backlog)
    await this.sprintRepo.remove(sprint);
    return { message: 'Sprint deleted successfully' };
  }

  async startSprint(sprintId: string, projectId: string, userId: string) {
    await this.checkProjectMembership(userId, projectId);

    // Ensure no other sprint is active
    const activeSprint = await this.sprintRepo.findOne({ where: { project: { id: projectId }, status: SprintStatus.ACTIVE } });
    if (activeSprint) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    const sprint = await this.findOne(sprintId, projectId, userId);
    if (sprint.status !== SprintStatus.PLANNED) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    sprint.status = SprintStatus.ACTIVE;
    return this.sprintRepo.save(sprint);
  }

  async completeSprint(sprintId: string, projectId: string, userId: string) {
    const sprint = await this.findOne(sprintId, projectId, userId);
    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    // TODO: Handle unfinished tasks (move to backlog or next sprint)

    sprint.status = SprintStatus.COMPLETED;
    return this.sprintRepo.save(sprint);
  }
}

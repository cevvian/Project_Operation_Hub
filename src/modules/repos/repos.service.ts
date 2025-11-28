import { Injectable } from '@nestjs/common';
import { CreateRepoDto } from './dto/create-repo.dto';
import { UpdateRepoDto } from './dto/update-repo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repo } from 'src/database/entities/repo.entity';
import { Repository } from 'typeorm';
import { Project } from 'src/database/entities/project.entity';
import { ErrorCode } from 'src/exceptions/error-code';
import { AppException } from 'src/exceptions/app.exception';

@Injectable()
export class ReposService {
  constructor(
    @InjectRepository(Repo)
    private readonly repoRepository: Repository<Repo>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createRepoDto: CreateRepoDto) {
    const repo = this.repoRepository.create({
      name: createRepoDto.name,
      githubUrl: createRepoDto.githubUrl
    });

    const project = await this.projectRepository.findOne({
      where: { id: createRepoDto.projectId },
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND)
    }

    repo.project = project

    return this.repoRepository.save(repo)
  }

  async findAll(page: number, limit: number) {
    const [data, total] = await this.repoRepository.findAndCount({
      relations: ['project'],
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
    const repo = await this.repoRepository.findOne({
      where: { id },
      relations: ['project', 'commits', 'pullRequests'],
    });

    if (!repo) {
      throw new AppException(ErrorCode.REPO_NOT_FOUND);
    }

    return repo;
  }

  async findByProject(projectId: string) {
    return await this.repoRepository.find({
      where: { project: { id: projectId } },
    });
  }

  async update(id: string, dto: UpdateRepoDto) {
    const repo = await this.findOne(id);

    Object.assign(repo, {
      name: dto.name || repo.name,
      githubUrl: dto.githubUrl || repo.githubUrl,
    });

    return await this.repoRepository.save(repo);
  }

  async remove(id: string) {
    await this.findOne(id);

    const result = await this.repoRepository.delete(id);

    if (result.affected && result.affected > 0) {
      return 'Delete repo successfully';
    } 

    throw new AppException(ErrorCode.DELETE_FAIL);
  }
}

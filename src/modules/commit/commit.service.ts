import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Commit } from 'src/database/entities/commit.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { Task } from 'src/database/entities/task.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateCommitDto } from './dto/create-commit.dto';
import { User } from 'src/database/entities/user.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);

  constructor(
    @InjectRepository(Commit)
    private readonly commitRepository: Repository<Commit>,
  ) {}

  // This method is special for webhook transactions
  async create(dto: CreateCommitDto, manager: EntityManager) {
    const repo = await manager.findOne(Repo, { where: { id: dto.repoId } });
    if (!repo) {
      this.logger.warn(`Repo with ID ${dto.repoId} not found. Skipping commit ${dto.hash}.`);
      return;
    }

    let author: User | null = null;
    if (dto.authorEmail) {
      author = await manager.findOne(User, { where: { email: dto.authorEmail } });
      if (!author) {
        this.logger.warn(`Author with email ${dto.authorEmail} not found for commit ${dto.hash}.`);
      }
    }

    let task: Task | null = null;
    if (dto.taskKey) {
      task = await manager.findOne(Task, { where: { key: dto.taskKey } });
      if (!task) {
        this.logger.warn(`Task with key ${dto.taskKey} not found for commit ${dto.hash}.`);
      }
    }

    const newCommit = manager.create(Commit, {
      hash: dto.hash,
      message: dto.message,
      repo,
      author,
      task,
      authorName: dto.authorName, // Make sure to save these as well
      authorEmail: dto.authorEmail,
    });

    return manager.save(newCommit);
  }

  async findAll(repoId: string, page: number, limit: number) {
    const [data, total] = await this.commitRepository.findAndCount({
      where: { repo: { id: repoId } },
      relations: ['author', 'task'],
      order: { createdAt: 'DESC' },
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
    const commit = await this.commitRepository.findOne({
      where: { id },
      relations: ['author', 'task', 'repo'],
    });

    if (!commit) {
      throw new AppException(ErrorCode.COMMIT_NOT_FOUND);
    }
    return commit;
  }

  async remove(id: string) {
    const commit = await this.findOne(id);
    const result = await this.commitRepository.delete(commit.id);

    if (result.affected === 0) {
      throw new AppException(ErrorCode.DELETE_FAIL);
    }

    return { message: 'Commit deleted successfully.' };
  }
}


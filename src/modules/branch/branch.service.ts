import { Injectable } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from 'src/database/entities/branch.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { Task } from 'src/database/entities/task.entity';
import { Repository } from 'typeorm';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { GithubService } from '../github/github.service';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    
    @InjectRepository(Repo)
    private readonly repoRepo: Repository<Repo>,

    private readonly githubService: GithubService
  ) {}

  
  async create(createBranchDto: CreateBranchDto) {
    const task = await this.taskRepo.findOne({ where: { id: createBranchDto.taskId } });
    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const repo = await this.repoRepo.findOne({ where: { id: createBranchDto.repoId } });
    if (!repo) {
      throw new AppException(ErrorCode.REPO_NOT_FOUND);
    }

    const name = `feature/${task.key}-${task.name.replace(/\s+/g, '-')}`;
    const githubBranch = await this.githubService.createBranch(repo.name, name);

    const branch = await this.branchRepo.create({
      name: name,
      task: task,
      repo: repo,
      githubUrl: githubBranch.url
    });

    return await this.branchRepo.save(branch);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.branchRepo.findAndCount({
      relations: ['task', 'repo'],
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
    const branch = await this.branchRepo.findOne({ 
      where: { id: id },
      relations: ['task', 'repo'],
    });

    if (!branch) {
      throw new AppException(ErrorCode.BRANCH_NOT_FOUND);
    }

    return branch;
  }

  async findBranchesByTask(taskId: string) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new AppException(ErrorCode.TASK_NOT_FOUND);
    }

    const branches = await this.branchRepo.find({
      where: { task: { id: taskId } },
      relations: ['repo'],
    });

    return branches;
  }

  async findBranchesByRepo(repoId: string) {
    const repo = await this.repoRepo.findOne({ where: { id: repoId } });
    if (!repo) {
      throw new AppException(ErrorCode.REPO_NOT_FOUND);
    }

    const branches = await this.branchRepo.find({
      where: { repo: { id: repoId } },
      relations: ['task'],
    });

    return branches;
  }

  // async update(id: string, updateBranchDto: UpdateBranchDto) {
  //   const branch = await this.findOne(id);

  //   if (updateBranchDto.taskId && updateBranchDto.taskId !== branch.task.id) {
  //     const task = await this.taskRepo.findOne({ where: { id: updateBranchDto.taskId } });
  //     if (!task) {
  //       throw new AppException(ErrorCode.TASK_NOT_FOUND);
  //     }
  //     branch.task = task;
  //   }

  //   if (updateBranchDto.repoId && updateBranchDto.repoId !== branch.repo.id) {
  //     const repo = await this.repoRepo.findOne({ where: { id: updateBranchDto.repoId } });
  //     if (!repo) {
  //       throw new AppException(ErrorCode.REPO_NOT_FOUND);
  //     }
  //     branch.repo = repo;
  //   }

  //   Object.assign(branch, {
  //     name: updateBranchDto.name || branch.name,
  //     githubUrl: updateBranchDto.githubUrl || branch.githubUrl,
  //   });

  //   return await this.branchRepo.save(branch);
  // }

  async remove(id: string) {
    await this.findOne(id);

    const result = await this.branchRepo.delete(id);

    if (result.affected && result.affected > 0) {
      return 'Delete successfully';
    } else {
      throw new AppException(ErrorCode.DELETE_FAIL);
    }
  }
}

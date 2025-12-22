import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateRepoDto } from './dto/create-repo.dto';
import { UpdateRepoDto } from './dto/update-repo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repo } from 'src/database/entities/repo.entity';
import { Repository } from 'typeorm';
import { Project } from 'src/database/entities/project.entity';
import { User } from 'src/database/entities/user.entity';
import { ErrorCode } from 'src/exceptions/error-code';
import { AppException } from 'src/exceptions/app.exception';
import { GithubService } from '../github/github.service';
import { GithubWebhookService } from '../github/github-webhook.service';


@Injectable()
export class ReposService {
  constructor(
    @InjectRepository(Repo)
    private readonly repoRepository: Repository<Repo>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly githubService: GithubService,
    private readonly webhookService: GithubWebhookService,
    private readonly configService: ConfigService,
  ) {}

  async create(createRepoDto: CreateRepoDto, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    const project = await this.projectRepository.findOne({
      where: { id: createRepoDto.projectId },
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    // Generate repo name based on project key and repo name
    const repoName = `${project.keyPrefix}-${createRepoDto.name}`;

    // Create repo on GitHub
    const githubRepo = await this.githubService.createRepo(
      repoName,
      createRepoDto.isPrivate,
      userId,

      createRepoDto.description,
    );

    // Create and save repo entity in DB
    const repo = this.repoRepository.create({
      project,
      createdBy: user,
      name: createRepoDto.name, // Save the short name
      fullName: githubRepo.full_name,
      githubId: githubRepo.id,
      defaultBranch: githubRepo.default_branch,
      githubUrl: githubRepo.html_url,
      owner: githubRepo.owner.login,
      isPrivate: createRepoDto.isPrivate,
      webhookSecret: createRepoDto.webhookSecret, // Save the secret
    });

    const webhookUrl = this.configService.get<string>('WEBHOOK_BASE_URL');
    if (!webhookUrl) {
      throw new AppException(ErrorCode.GITHUB_WEBHOOK_CONFIG_INVALID);
    }

    const webhook = await this.webhookService.createWehookRepo(
      repoName,
      webhookUrl,
      createRepoDto.webhookSecret, // Use the secret from DTO
      userId,
    );
    repo.webhookId = webhook.id;

    return this.repoRepository.save(repo);
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

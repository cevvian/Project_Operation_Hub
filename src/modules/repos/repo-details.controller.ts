import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { User } from '../auth/decorator/user.decorator';
import { GithubService } from '../github/github.service';
import { ReposService } from './repos.service';

@ApiTags('Repository Details')
@Controller('repos/:repoId/github')
export class RepoDetailsController {
    constructor(
        private readonly reposService: ReposService,
        private readonly githubService: GithubService,
    ) { }

    @Get('readme')
    @ApiOperation({ summary: 'Get repository README from GitHub' })
    async getReadme(
        @Param('repoId', new ParseUUIDPipe()) repoId: string,
        @User('sub') userId: string,
    ) {
        const repo = await this.reposService.findOne(repoId);
        const { token } = await this.githubService.getGitHubTokenAndUsername(userId);
        const repoName = repo.fullName.split('/')[1]; // Extract repo name from "owner/repo"
        return this.githubService.getRepoReadme(repo.owner, repoName, token);
    }

    @Get('tree')
    @ApiOperation({ summary: 'Get repository file tree from GitHub' })
    @ApiQuery({ name: 'branch', required: false, example: 'main' })
    async getTree(
        @Param('repoId', new ParseUUIDPipe()) repoId: string,
        @Query('branch') branch = 'main',
        @User('sub') userId: string,
    ) {
        const repo = await this.reposService.findOne(repoId);
        const { token } = await this.githubService.getGitHubTokenAndUsername(userId);
        const repoName = repo.fullName.split('/')[1];
        return this.githubService.getRepoTree(repo.owner, repoName, branch, token);
    }

    @Get('file')
    @ApiOperation({ summary: 'Get file content from GitHub' })
    @ApiQuery({ name: 'path', required: true, example: 'src/index.js' })
    async getFile(
        @Param('repoId', new ParseUUIDPipe()) repoId: string,
        @Query('path') path: string,
        @User('sub') userId: string,
    ) {
        const repo = await this.reposService.findOne(repoId);
        const { token } = await this.githubService.getGitHubTokenAndUsername(userId);
        const repoName = repo.fullName.split('/')[1];
        return this.githubService.getFileContent(repo.owner, repoName, path, token);
    }

    @Get('commits')
    @ApiOperation({ summary: 'Get repository commits from GitHub' })
    @ApiQuery({ name: 'branch', required: false, example: 'main' })
    @ApiQuery({ name: 'limit', required: false, example: 30 })
    async getCommits(
        @Param('repoId', new ParseUUIDPipe()) repoId: string,
        @Query('branch') branch = 'main',
        @Query('limit') limit = 30,
        @User('sub') userId: string,
    ) {
        const repo = await this.reposService.findOne(repoId);
        const { token } = await this.githubService.getGitHubTokenAndUsername(userId);
        const repoName = repo.fullName.split('/')[1];
        return this.githubService.getRepoCommits(repo.owner, repoName, branch, token, +limit);
    }

    @Get('branches')
    @ApiOperation({ summary: 'Get repository branches from GitHub' })
    async getBranches(
        @Param('repoId', new ParseUUIDPipe()) repoId: string,
        @User('sub') userId: string,
    ) {
        const repo = await this.reposService.findOne(repoId);
        const { token } = await this.githubService.getGitHubTokenAndUsername(userId);
        const repoName = repo.fullName.split('/')[1];
        return this.githubService.getRepoBranches(repo.owner, repoName, token);
    }
}

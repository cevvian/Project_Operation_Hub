import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { GithubWebhookService } from './github-webhook.service';

@Injectable()
export class GithubService {
  private readonly octokit: Octokit;
  private readonly owner = 'cevvian';
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly webhookService: GithubWebhookService
  ) {}

  async createRepo(repoName: string, description?: string) {
    const { name: owner, token } = await this.getGitHubTokenAndUsername();

    const octokit = new Octokit({ auth: token });

    const res = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: description || '',
      private: true,
    });

    return res.data;
  }


  async createBranch(repo: string, branchName: string, from = 'main') {
    const { name: owner, token } = await this.getGitHubTokenAndUsername();

    const octokit = new Octokit({ auth: token });
    
    // 1) Lấy SHA của branch gốc
    const base = await octokit.git.getRef({
      owner: this.owner,
      repo,
      ref: `heads/${from}`,
    });

    const sha = base.data.object.sha;

    // 2) Tạo branch mới
    const newRef = await this.octokit.git.createRef({
      owner: this.owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    });

    return newRef.data;
  }

  async createPullRequest(repo: string, title: string, head: string, base = 'main', body?: string) {
    const { name: owner, token } = await this.getGitHubTokenAndUsername();
    const octokit = new Octokit({ auth: token });

    const pr = await octokit.pulls.create({
      owner: this.owner,
      repo,
      title,
      head,
      base,
      body: body ?? '',
    });

    return pr.data;
  }

  async getGitHubTokenAndUsername(){
    // get userid from token
    const userId = 'wefhgoweigh'
    const user = await this.userRepo.findOne({
      where: {id: userId}
    })

    if(!user){
      throw new AppException(ErrorCode.USER_NOT_EXISTED)
    }

    return { name: user.githubName, token: user.githubToken }
  }

  async checkGithubUsernameExists(username: string, token?: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: token });

      await octokit.rest.users.getByUsername({
        username,
      });

      return true;
    } catch (err) {
      if (err.status === 404) return false;
      throw new AppException(ErrorCode.GITHUB_API_FAIL);
    }
  }
}

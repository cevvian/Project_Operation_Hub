import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Commit } from "src/database/entities/commit.entity";
import { PRStatus } from "src/database/entities/enum/pr-status.enum";
import { PRTaskLink } from "src/database/entities/pr-task-link.entity";
import { PullRequest } from "src/database/entities/pull-request.entity";
import { Task } from "src/database/entities/task.entity";
import { Repository } from "typeorm";
import { AppException } from "src/exceptions/app.exception";
import { User } from "src/database/entities/user.entity";
import { ErrorCode } from "src/exceptions/error-code";
import { Octokit } from "@octokit/rest";

@Injectable()
export class GithubWebhookService {
  private readonly octokit: Octokit;
  private readonly owner = 'cevvian';
  
  constructor(
    @InjectRepository(Commit)
    private readonly commitRepo: Repository<Commit>,

    @InjectRepository(PullRequest)
    private readonly prRepo: Repository<PullRequest>,

    @InjectRepository(PRTaskLink)
    private readonly prTaskLinkRepo: Repository<PRTaskLink>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

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

  // private async createGitHubClient(): Promise<AxiosInstance> {
  //   const {name , token} = await this.getGitHubTokenAndUsername()

  //   return axios.create({
  //     baseURL: 'https://api.github.com',
  //     timeout: 8000,
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       Accept: 'application/vnd.github+json',
  //     },
  //   });
  // }

  async createWehookRepo(repoName: string, webhookUrl: string, secret: string){
    const { name: owner, token } = await this.getGitHubTokenAndUsername();

    const octokit = new Octokit({ auth: token });
    
    const res = await octokit.repos.createWebhook({
      owner: owner,
      repo: repoName,
      name: 'web',
      events: ['push', 'pull_request'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret,
        insecure_ssl: '0', // HTTPS
      },
    });

    return res.data;
  }

  // async createWebhook( owner: string, repoName: string, webhookUrl: string,
  //   secret: string, events: string[] = ['push'], ) {
  //   const client = await this.createGitHubClient();

  //   const res = await client.post(`/repos/${owner}/${repoName}/hooks`, {
  //     name: 'web',
  //     active: true,
  //     events,
  //     config: {
  //       url: webhookUrl,
  //       content_type: 'json',
  //       secret,
  //       insecure_ssl: '0', // HTTPS
  //     },
  //   });

  //   // this.logger.log(`Webhook created for repo ${repoName}: ${res.data.id}`);
  //   return res.data;
  // }

  async handlePushEvent(payload: any) {
    for (const commit of payload.commits) {
      const match = commit.message.match(/([A-Z]+-\d+)/);
      if (!match) continue;

      // const regex = /([A-Z]+-\d+)/;
      // const match = commit.message.match(regex);
      // if (match) {
      //   const taskKey = match[1];
      //   const task = await taskRepo.findOne({ where: { key: taskKey } });
      //   if (task) {
      //     // Lưu commit với taskId
      //   }
      // }

      const taskKey = match[1];
      const task = await this.taskRepo.findOne({ where: { key: taskKey } });
      if (!task) continue;

      await this.commitRepo.save({
        hash: commit.id,
        message: commit.message,
        task,
        // author mapping nếu có
      });
    }
  }

  async handlePROpenedEvent(payload: any) {
    const pr = this.prRepo.create({
      title: payload.pull_request.title,
      description: payload.pull_request.body,
      status: PRStatus.OPEN,
      // repo mapping
    });
    const savedPR = await this.prRepo.save(pr);

    const match = payload.pull_request.title.match(/([A-Z]+-\d+)/);
    if (match) {
      const task = await this.taskRepo.findOne({ where: { key: match[1] } });
      if (task) {
        await this.prTaskLinkRepo.save({
          pullRequest: savedPR,
          task,
        });
      }
    }
  }
}

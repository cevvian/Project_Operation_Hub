import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Commit } from "src/database/entities/commit.entity";
import { PRStatus } from "src/database/entities/enum/pr-status.enum";
import { PRTaskLink } from "src/database/entities/pr-task-link.entity";
import { PullRequest } from "src/database/entities/pull-request.entity";
import { Task } from "src/database/entities/task.entity";
import { Repository } from "typeorm";

@Injectable()
export class GithubWebhookService {
  constructor(
    @InjectRepository(Commit)
    private readonly commitRepo: Repository<Commit>,

    @InjectRepository(PullRequest)
    private readonly prRepo: Repository<PullRequest>,

    @InjectRepository(PRTaskLink)
    private readonly prTaskLinkRepo: Repository<PRTaskLink>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async handlePushEvent(payload: any) {
    for (const commit of payload.commits) {
      const match = commit.message.match(/([A-Z]+-\d+)/);
      if (!match) continue;

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

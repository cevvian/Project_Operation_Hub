import { Body, Controller, Post, Headers, Res } from '@nestjs/common';
import { User } from '../auth/decorator/user.decorator';
import { GithubService } from './github.service';
import { GithubWebhookService } from './github-webhook.service'; // Import the new service
import type { Response } from 'express';
import { CreateRepoDto } from './dto/create-repo.dto'; // Import the new DTO
import { Public } from '../auth/guard/auth.guard';

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly githubWebhookService: GithubWebhookService, // Inject the service
  ) { }

  @Post('repos')
  async createRepo(@Body() createRepoDto: CreateRepoDto, @User('sub') userId: string) {
    // Default to true if isPrivate is not provided
    const isPrivate = createRepoDto.isPrivate !== undefined ? createRepoDto.isPrivate : true;
    return this.githubService.createRepo(createRepoDto.name, isPrivate, userId, createRepoDto.description);
  }

  @Post('branches')
  async createBranch(@Body() dto: { repo: string; branchName: string; from?: string }, @User('sub') userId: string) {
    return this.githubService.createBranch(dto.repo, dto.branchName, userId, dto.from);
  }

  @Post('pull-requests')
  async createPR(
    @Body()
    dto: { repo: string; title: string; head: string; base?: string; body?: string },
    @User('sub') userId: string,
  ) {
    return this.githubService.createPullRequest(
      dto.repo,
      dto.title,
      dto.head,
      userId,
      dto.base,
      dto.body,
    );
  }


  @Public()
  @Post('webhooks')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string, // Signature can be used for verification
    @Res() res: Response,
  ) {
    // 1. Verify Signature
    // Ideally, this should be in a Guard or Middleware, but for simplicity/direct control we check it here first.
    // Or we rely on GithubWebhookService to verify, but it's better to verify before processing.
    if (!await this.githubWebhookService.verifyWebhookSignature(payload, signature)) {
      console.error('Webhook signature verification failed');
      return res.status(401).send('Invalid signature');
    }

    // Respond quickly to GitHub to avoid timeouts
    res.status(202).send('Accepted');

    // Handle events in the background
    if (event === 'ping') {
      this.githubWebhookService.handlePingEvent(payload).catch((err) => {
        console.error('Error handling ping event:', err);
      });
    } else if (event === 'push') {
      this.githubWebhookService.handlePushEvent(payload).catch((err) => {
        console.error('Error handling push event:', err);
      });
    } else if (event === 'pull_request') {
      this.githubWebhookService.handlePullRequestEvent(payload).catch((err) => {
        console.error('Error handling pull_request event:', err);
      });
    }
  }
}

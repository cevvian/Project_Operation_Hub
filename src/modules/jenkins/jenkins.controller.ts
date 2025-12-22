import { Controller, Post, Req, Headers, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { JenkinsService } from './jenkins.service';

@ApiTags('Jenkins')
@Controller('jenkins')
export class JenkinsController {
  constructor(private readonly jenkinsService: JenkinsService) {}

  @Post('webhook/trigger')
  async handleGithubWebhook(
    @Headers('x-github-event') githubEvent: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    // We only care about push events
    if (githubEvent !== 'push') {
      return { message: 'Ignoring event: not a push.' };
    }

    await this.jenkinsService.handlePushEvent(payload, signature);
    return { message: 'Webhook received and processed.' };
  }
}


import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post('repos')
  async createRepo(@Body() dto: { name: string; description?: string }) {
    return this.githubService.createRepo(dto.name, dto.description);
  }

  @Post('branches')
  async createBranch(@Body() dto: { repo: string; branchName: string; from?: string }) {
    return this.githubService.createBranch(dto.repo, dto.branchName, dto.from);
  }

  @Post('pull-requests')
  async createPR(
    @Body()
    dto: { repo: string; title: string; head: string; base?: string; body?: string },
  ) {
    return this.githubService.createPullRequest(
      dto.repo,
      dto.title,
      dto.head,
      dto.base,
      dto.body,
    );
  }

  // @Post(/webhooks)
  // async handleWebhook(
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @Headers('x-hub-signature-256') signature?: string,
  // ) {
  //   const rawBody = req.body as Buffer;

  //   const computedSig =
  //     'sha256=' +
  //     crypto.createHmac('sha256', this.secret).update(rawBody).digest('hex');

  //   if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSig))) {
  //     return res.status(401).send('Invalid signature');
  //   }

  //   const event = req.headers['x-github-event'];
  //   const json = JSON.parse(rawBody.toString());

  //   console.log('🔥 Webhook event:', event, json.action);

  //   res.status(200).send('OK');
  // }
}

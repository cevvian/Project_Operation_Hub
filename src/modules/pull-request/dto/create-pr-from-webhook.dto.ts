import { PRStatus } from 'src/database/entities/enum/pr-status.enum';

export class CreatePrFromWebhookDto {
  title: string;
  description: string;
  status: PRStatus;
  repoFullName: string;
  authorGithubName: string;
  sourceBranch: string;
  targetBranch: string;
  githubId: number;
  number: number;
  url: string;
}


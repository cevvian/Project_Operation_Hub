export class CreateCommitDto {
  hash: string;
  message: string;
  repoId: string;
  authorName?: string;
  authorEmail?: string;
  taskKey?: string;
}


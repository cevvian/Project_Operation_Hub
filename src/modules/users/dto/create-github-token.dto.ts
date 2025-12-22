import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGitHubTokenDto {
  @ApiProperty({
    description: 'The personal access token from GitHub.',
    example: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}


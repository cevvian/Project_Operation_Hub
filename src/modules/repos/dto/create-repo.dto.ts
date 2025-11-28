import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateRepoDto {
  @ApiProperty({
    description: 'ID of the project this repository belongs to',
    example: '9f1b2a49-2e98-4a8c-951e-ff23c7c96f24',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Name of the repository',
    example: 'frontend-app',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'GitHub URL of the repository',
    example: 'https://github.com/example/frontend-app',
  })
  @IsUrl()
  @IsNotEmpty()
  githubUrl: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  @MinLength(1, { message: 'Repository name must not be empty' })
  @MaxLength(100, { message: 'Repository name must be at most 100 characters' })
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$|^[a-zA-Z0-9]$/, {
    message: 'Repository name can only contain letters, numbers, hyphens, underscores, and periods. Cannot start with a period or hyphen.',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'A short description of the repository',
    example: 'This is the frontend application for Project X.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the repository should be private',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate = true;

  @ApiProperty({
    description: 'Gitignore template to use',
    example: 'Node',
    required: false,
  })
  @IsString()
  @IsOptional()
  gitignoreTemplate?: string;

  @ApiProperty({
    description: 'Secret for the webhook',
    example: 'supersecretstring',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  webhookSecret: string;

  @ApiPropertyOptional({
    description: 'Tech stack for CI/CD pipeline preset',
    example: 'nodejs',
    enum: ['nodejs', 'react', 'nextjs'],
    default: 'nodejs',
  })
  @IsString()
  @IsOptional()
  @IsIn(['nodejs', 'react', 'nextjs'], {
    message: 'Tech stack must be one of: nodejs, react, nextjs',
  })
  techStack?: string = 'nodejs';
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
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
}

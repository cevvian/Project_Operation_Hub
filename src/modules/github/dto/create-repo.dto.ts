import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class GithubCreateRepoDto {
  @ApiProperty({
    description: 'The name of the repository.',
    example: 'my-awesome-project',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'A short description of the repository.',
    example: 'This is a project to manage operations.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the repository should be private.',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}


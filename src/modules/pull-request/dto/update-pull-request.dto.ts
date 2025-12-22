import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PRStatus } from 'src/database/entities/enum/pr-status.enum';

export class UpdatePullRequestDto {
  @ApiPropertyOptional({
    description: 'The new title of the pull request',
    example: 'Fix: Handle null values in user input',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'The new description of the pull request',
    example: 'This PR fixes the critical bug reported in PROJ-456.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The new status of the pull request',
    enum: PRStatus,
    example: PRStatus.CLOSED,
  })
  @IsOptional()
  @IsEnum(PRStatus)
  status?: PRStatus;
}


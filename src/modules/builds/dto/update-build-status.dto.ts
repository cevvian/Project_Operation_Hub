import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BuildStatus } from 'src/database/entities/enum/build-status.enum';

export class UpdateBuildStatusDto {
  @ApiProperty({
    description: 'The new status of the build',
    enum: BuildStatus,
    example: BuildStatus.SUCCESS,
  })
  @IsEnum(BuildStatus)
  @IsNotEmpty()
  status: BuildStatus;

  @ApiPropertyOptional({
    description: 'The build number from Jenkins',
    example: 123,
  })
  @IsNumber()
  @IsOptional()
  jenkinsBuildNumber?: number;

  @ApiPropertyOptional({
    description: 'Timestamp when the build finished',
    example: '2023-10-27T10:00:00Z',
  })
  @IsString()
  @IsOptional()
  finishedAt?: string;

  @ApiPropertyOptional({
    description: 'Console output logs from Jenkins build',
  })
  @IsString()
  @IsOptional()
  consoleOutput?: string;
}

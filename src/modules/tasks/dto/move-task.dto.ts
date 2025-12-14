import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { TaskStatus } from 'src/database/entities/enum/task-status.enum';

export class MoveTaskDto {
  @ApiPropertyOptional({ description: 'The sprint to move the task to. If null, moves to backlog.' })
  @IsOptional()
  @IsUUID()
  toSprintId?: string | null;

  @ApiPropertyOptional({ description: 'The new status column for the task.' })
  @IsOptional()
  @IsEnum(TaskStatus)
  toStatus?: TaskStatus;

  @ApiProperty({ description: 'The new zero-based index of the task in its new list (sprint/status).' })
  @IsNumber()
  @IsNotEmpty()
  toIndex: number;
}


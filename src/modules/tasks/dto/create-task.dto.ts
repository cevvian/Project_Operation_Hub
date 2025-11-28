import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from 'src/database/entities/enum/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({
    example: 'uuid-project',
    description: 'The ID of the project this task belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    example: 'uuid-sprint',
    description: 'The ID of the sprint if this task is included in a sprint',
  })
  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @ApiProperty({
    example: 'Fix login bug',
    description: 'The name/title of the task',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'The issue occurs when the user tries to log in',
    description: 'A detailed description of the task',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'uuid-user',
    description: 'The ID of the user assigned to this task',
  })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiProperty({
    example: 'uuid-user',
    description: 'The ID of the user who created/reported the task',
  })
  @IsUUID()
  @IsNotEmpty()
  reporterId: string;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.TODO,
    description: 'The initial status of the task',
  })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;
}

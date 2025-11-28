import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TaskStatus } from 'src/database/entities/enum/task-status.enum';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'The new status of the task',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

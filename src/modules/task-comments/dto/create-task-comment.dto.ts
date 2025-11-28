import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class CreateTaskCommentDto {
  @ApiProperty({
    description: 'The ID of the task to add the comment to',
    example: 'a3b1c9d0-1234-4f8b-8f4c-2f1e927cd112',
  })
  @IsUUID()
  taskId: string;

  @ApiProperty({
    description: 'The content of the comment',
    example: 'I have completed 50% of this task.',
  })
  @IsString()
  content: string;
}

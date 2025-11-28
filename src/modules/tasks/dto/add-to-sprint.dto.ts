import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddToSprintDto {
  @ApiProperty({
    description: 'The ID of the sprint to attach this task to',
    example: 'b6a1a371-7e25-4d99-a82f-d8f5b1c64c32',
  })
  @IsUUID()
  sprintId: string;
}

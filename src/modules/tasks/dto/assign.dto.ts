import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignDto {
  @ApiProperty({
    description: 'The ID of the user to assign the task to',
    example: 'd9f5b0a1-8e2f-498d-9a79-1e80db516f71',
  })
  @IsUUID()
  userId: string;
}

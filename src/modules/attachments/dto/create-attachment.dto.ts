import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateAttachmentDto {
  @ApiProperty({ description: 'ID of the task this attachment belongs to' })
  @IsUUID()
  taskId: string;
}

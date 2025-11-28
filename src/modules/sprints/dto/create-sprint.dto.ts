import { IsString, IsUUID, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSprintDto {
  @ApiProperty({
    description: 'ID của project mà sprint thuộc về',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Tên sprint',
    type: 'string',
    example: 'Sprint 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Ngày bắt đầu sprint',
    type: 'string',
    format: 'date',
    example: '2025-11-27',
  })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({
    description: 'Ngày kết thúc sprint',
    type: 'string',
    format: 'date',
    example: '2025-12-04',
  })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProjectDto {
  // @ApiProperty({
  //   description: 'ID of the user who owns this project',
  //   example: 'f1c2a4b7-1234-4c98-8ad3-b23a0ef21a99',
  // })
  // @IsUUID()
  // @IsNotEmpty()
  // ownerId: string;

  @ApiProperty({
    description: 'Name of the project',
    example: 'E-Commerce Platform',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Key prefix of the project',
    example: 'ABC',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  keyPrefix: string;

  @ApiProperty({
    description: 'Short description about the project',
    example: 'A web platform for managing online store operations.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

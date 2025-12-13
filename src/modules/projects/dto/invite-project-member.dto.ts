import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class InviteProjectMemberDto {
  @ApiProperty({
    description: 'List of emails for users not yet in the system',
    example: ['new.user@example.com'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[];

  @ApiProperty({
    description: 'List of user IDs for existing users',
    example: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    type: [String],
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}

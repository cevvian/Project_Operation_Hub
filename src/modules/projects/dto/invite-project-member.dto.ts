import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InviteSingleMemberDto {
  @ApiProperty({ description: 'User ID of the member to invite', example: 'uuid-user-123' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'Role in project', example: 'DEV' })
  @IsString()
  role?: string;
}

export class InviteProjectMemberDto {
  @ApiProperty({ description: 'Project ID to invite members to', example: 'uuid-project-123' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'List of members to invite', type: [InviteSingleMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InviteSingleMemberDto)
  members: InviteSingleMemberDto[];
}

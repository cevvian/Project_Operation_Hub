import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token sent to the user via email or notification',
    example: '8f7e6d5c-1234-4bcd-9876-abcdef123456',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

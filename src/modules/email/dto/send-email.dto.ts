import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendConfirmationMailDto {
  @ApiProperty({
    description: 'Email người nhận',
    example: 'nguyenvana@gmail.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  to: string;

  @ApiProperty({
    description: 'Tên người nhận',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Token xác thực',
    example: 'abc123xyz789',
  })
  @IsString()
  token?: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPassword123' })
    @IsNotEmpty()
    @IsString()
    oldPassword: string;

    @ApiProperty({ example: 'NewPassword123', minLength: 6 })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    newPassword: string;
}

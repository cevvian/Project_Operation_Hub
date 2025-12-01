import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
    @ApiProperty({
        example: "admin@gmail.com",
        description: "ID user"
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: "adminadmin",
        description: "Password login"
    })
    @IsString()
    @MinLength(8)
    password: string;
}
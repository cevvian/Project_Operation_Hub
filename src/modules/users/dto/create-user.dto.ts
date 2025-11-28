import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from 'src/database/entities/enum/role.enum';


export class CreateUserDto {
    @ApiProperty({
        description: 'Email address of the user. Must be unique.',
        example: 'john.doe@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Raw password provided by the user. Will be hashed before storage.',
        example: 'StrongPassword123',
        minLength: 6,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({
        description: 'Full name of the user.',
        example: 'John Doe'
    })
    @IsNotEmpty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'GitHub personal access token for syncing with GitHub services.',
        example: 'ghp_1234567890abcdef',
    })
    @IsOptional()
    @IsString()
    github_token?: string;

    @ApiPropertyOptional({
        description: 'Platform-level role of the user. Default is USER.',
        enum: Role,
        example: Role.USER,
    })
    @IsOptional()
    @IsEnum(Role)
    platform_role?: Role;
}

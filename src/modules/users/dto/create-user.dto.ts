import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { Role } from 'src/database/entities/enum/role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email address of the user. Must be unique.',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Raw password for standard registration. Not required for social logins.',
    example: 'StrongPassword123',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'Full name of the user.',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: "URL of the user's avatar.",
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'GitHub username, populated from social login.',
    example: 'john-doe-github',
  })
  @IsOptional()
  @IsString()
  githubName?: string;

  @ApiPropertyOptional({
    description: 'Google user ID, populated from social login.',
    example: '109876543210987654321',
  })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({
    description: 'Flag indicating if the user is verified. Defaults to false.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
      description: 'GitHub personal access token for syncing with GitHub services.',
      example: 'ghp_1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  github_token?: string;

  @ApiPropertyOptional({
      description: 'Invitation token if the user is signing up through a project invite link.',
      example: 'invitation-token-hex',
  })
  @IsOptional()
  @IsString()
  invitation_token?: string;

  @ApiPropertyOptional({
      description: 'Platform-level role of the user. Default is USER.',
      enum: Role,
      example: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role)
  platform_role?: Role;
}

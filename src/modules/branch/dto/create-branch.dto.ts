import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateBranchDto {
    @ApiProperty({
        description: 'ID of the task this branch belongs to.',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    taskId: string;

    @ApiProperty({
        description: 'ID of the repository this branch belongs to.',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsNotEmpty()
    @IsUUID()
    repoId: string;

    @ApiPropertyOptional({
        description: 'GitHub URL of the branch.',
        example: 'https://github.com/username/repo/tree/feature/login-page',
    })
    @IsOptional()
    @IsUrl()
    githubUrl?: string;
}
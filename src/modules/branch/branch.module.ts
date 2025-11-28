import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from 'src/database/entities/branch.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { Task } from 'src/database/entities/task.entity';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch]),
    TypeOrmModule.forFeature([Repo]),
    TypeOrmModule.forFeature([Task]),
    GithubModule
  ],
  controllers: [BranchController],
  providers: [BranchService],
})
export class BranchModule {}

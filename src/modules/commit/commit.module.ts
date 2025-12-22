import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commit } from 'src/database/entities/commit.entity';
import { Task } from 'src/database/entities/task.entity';
import { Repo } from 'src/database/entities/repo.entity';
import { CommitController } from './commit.controller';
import { CommitService } from './commit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Commit, Task, Repo])],
  controllers: [CommitController],
  providers: [CommitService],
  exports: [CommitService],
})
export class CommitModule {}



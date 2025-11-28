import { Module } from '@nestjs/common';
import { ReposService } from './repos.service';
import { ReposController } from './repos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/database/entities/project.entity';
import { Repo } from 'src/database/entities/repo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repo]),
    TypeOrmModule.forFeature([Project]),
  ],
  controllers: [ReposController],
  providers: [ReposService],
})
export class ReposModule {}

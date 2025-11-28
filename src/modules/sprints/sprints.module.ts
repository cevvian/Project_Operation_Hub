import { Module } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Project } from 'src/database/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sprint]),
    TypeOrmModule.forFeature([Project]),
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService]
})
export class SprintsModule {}

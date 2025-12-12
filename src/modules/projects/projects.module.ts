import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/database/entities/project.entity';
import { UsersModule } from '../users/users.module';
import { ProjectMember } from 'src/database/entities/project-member.entity';
import { PendingProjectInvitation } from 'src/database/entities/pending-project-invitation.entity';
import { User } from 'src/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Project]),
    TypeOrmModule.forFeature([ProjectMember]),
    TypeOrmModule.forFeature([PendingProjectInvitation]),
    UsersModule
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}

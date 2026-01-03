import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../../database/entities/user.entity';
import { Project } from '../../database/entities/project.entity';
import { Repo } from '../../database/entities/repo.entity';
import { Task } from '../../database/entities/task.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Build } from '../../database/entities/build.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Project, Repo, Task, AuditLog, Build]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }

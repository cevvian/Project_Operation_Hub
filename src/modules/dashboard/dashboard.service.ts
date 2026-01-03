import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Project } from '../../database/entities/project.entity';
import { Repo } from '../../database/entities/repo.entity';
import { Task } from '../../database/entities/task.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Build } from '../../database/entities/build.entity';

export interface DashboardStats {
    totals: {
        users: number;
        projects: number;
        repos: number;
        tasks: number;
        builds: number;
    };
    tasksByStatus: { status: string; count: number }[];
    usersByRole: { role: string; count: number }[];
    buildsByStatus: { status: string; count: number }[];
    recentProjects: {
        id: string;
        name: string;
        ownerName: string;
        createdAt: Date;
    }[];
    recentAuditLogs: {
        id: string;
        action: string;
        userEmail: string;
        severity: string;
        createdAt: Date;
    }[];
    userGrowth: { date: string; count: number }[];
    projectGrowth: { date: string; count: number }[];
}

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(Repo)
        private readonly repoRepo: Repository<Repo>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(AuditLog)
        private readonly auditLogRepo: Repository<AuditLog>,
        @InjectRepository(Build)
        private readonly buildRepo: Repository<Build>,
    ) { }

    async getStats(): Promise<DashboardStats> {
        const [
            totals,
            tasksByStatus,
            usersByRole,
            buildsByStatus,
            recentProjects,
            recentAuditLogs,
            userGrowth,
            projectGrowth,
        ] = await Promise.all([
            this.getTotals(),
            this.getTasksByStatus(),
            this.getUsersByRole(),
            this.getBuildsByStatus(),
            this.getRecentProjects(),
            this.getRecentAuditLogs(),
            this.getUserGrowth(),
            this.getProjectGrowth(),
        ]);

        return {
            totals,
            tasksByStatus,
            usersByRole,
            buildsByStatus,
            recentProjects,
            recentAuditLogs,
            userGrowth,
            projectGrowth,
        };
    }

    private async getTotals() {
        const [users, projects, repos, tasks, builds] = await Promise.all([
            this.userRepo.count(),
            this.projectRepo.count(),
            this.repoRepo.count(),
            this.taskRepo.count(),
            this.buildRepo.count(),
        ]);
        return { users, projects, repos, tasks, builds };
    }

    private async getTasksByStatus() {
        const result = await this.taskRepo
            .createQueryBuilder('task')
            .select('task.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('task.status')
            .getRawMany();
        return result.map((r) => ({ status: r.status, count: parseInt(r.count) }));
    }

    private async getUsersByRole() {
        const result = await this.userRepo
            .createQueryBuilder('user')
            .select('user.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('user.role')
            .getRawMany();
        return result.map((r) => ({ role: r.role, count: parseInt(r.count) }));
    }

    private async getBuildsByStatus() {
        const result = await this.buildRepo
            .createQueryBuilder('build')
            .select('build.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('build.status')
            .getRawMany();
        return result.map((r) => ({ status: r.status, count: parseInt(r.count) }));
    }

    private async getRecentProjects() {
        const projects = await this.projectRepo.find({
            relations: ['owner'],
            order: { created_at: 'DESC' },
            take: 5,
        });
        return projects.map((p) => ({
            id: p.id,
            name: p.name,
            ownerName: p.owner?.name || p.owner?.email || 'Unknown',
            createdAt: p.created_at,
        }));
    }

    private async getRecentAuditLogs() {
        const logs = await this.auditLogRepo.find({
            order: { createdAt: 'DESC' },
            take: 5,
        });
        return logs.map((l) => ({
            id: l.id,
            action: l.action,
            userEmail: l.userEmail || 'System',
            severity: l.severity,
            createdAt: l.createdAt,
        }));
    }

    private async getUserGrowth() {
        // Last 7 days user registrations
        const result = await this.userRepo
            .createQueryBuilder('user')
            .select("DATE(user.created_at)", 'date')
            .addSelect('COUNT(*)', 'count')
            .where("user.created_at >= NOW() - INTERVAL '30 days'")
            .groupBy("DATE(user.created_at)")
            .orderBy("DATE(user.created_at)", 'ASC')
            .getRawMany();
        return result.map((r) => ({ date: r.date, count: parseInt(r.count) }));
    }

    private async getProjectGrowth() {
        const result = await this.projectRepo
            .createQueryBuilder('project')
            .select("DATE(project.created_at)", 'date')
            .addSelect('COUNT(*)', 'count')
            .where("project.created_at >= NOW() - INTERVAL '30 days'")
            .groupBy("DATE(project.created_at)")
            .orderBy("DATE(project.created_at)", 'ASC')
            .getRawMany();
        return result.map((r) => ({ date: r.date, count: parseInt(r.count) }));
    }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserTeamRole } from './user-team-role.entity';
import { Task } from './task.entity';
import { Commit } from './commit.entity';
import { PullRequest } from './pull-request.entity';
import { TestRun } from './test-run.entity';
import { Deployment } from './deployment.entity';
import { Build } from './build.entity';
import { PlatformRole } from './enum/platform-role.enum';


@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    github_token: string;

    @Column({
        type: 'enum',
        enum: PlatformRole,
        default: PlatformRole.USER,
    })
    platform_role: PlatformRole;

    @OneToMany(() => UserTeamRole, (utr) => utr.user)
    teamRoles: UserTeamRole[];

    @OneToMany(() => Task, (task) => task.assignee)
    assignedTasks: Task[];

    @OneToMany(() => Task, (task) => task.reporter)
    reportedTasks: Task[];

    @OneToMany(() => Commit, (commit) => commit.author)
    commits: Commit[];

    @OneToMany(() => PullRequest, (pr) => pr.createdBy)
    pullRequests: PullRequest[];

    @OneToMany(() => TestRun, (run) => run.executedBy)
    testRuns: TestRun[];

    @OneToMany(() => Deployment, (dep) => dep.deployedBy)
    deployments: Deployment[];

    @OneToMany(() => Build, (b) => b.triggeredBy)
    builds: Build[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

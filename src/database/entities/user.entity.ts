import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Task } from './task.entity';
import { Commit } from './commit.entity';
import { PullRequest } from './pull-request.entity';
import { Deployment } from './deployment.entity';
import { Build } from './build.entity';
import { Role } from './enum/role.enum';
import { ProjectMember } from './project-member.entity';
import { Attachment } from './attachment.entity';
import { TaskComment } from './task-comment.entity';
import { UserStatus } from './enum/user-status.enum';


@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ name: 'github_token', nullable: true })
    githubToken: string;

    @Column({ name: 'github_name', nullable: true, unique: true })
    githubName: string;

    @Column({ name: 'google_id', nullable: true, unique: true })
    googleId: string;

    @Column({
        name: 'role',
        type: 'enum',
        enum: Role,
        default: Role.USER,
    })
    role: Role;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.UNVERIFIED
    })
    status: UserStatus;

    // @OneToMany(() => UserTeamRole, (utr) => utr.user)
    // teamRoles: UserTeamRole[];
    @OneToMany(() => ProjectMember, (pm) => pm.user)
    projectMemberships: ProjectMember[];

    @OneToMany(() => Task, (task) => task.assignee)
    assignedTasks: Task[];

    @OneToMany(() => Task, (task) => task.reporter)
    reportedTasks: Task[];

    @OneToMany(() => TaskComment, (comment) => comment.author)
    authoredComments: TaskComment[];

    @OneToMany(() => Commit, (commit) => commit.author)
    commits: Commit[];

    @OneToMany(() => PullRequest, (pr) => pr.createdBy)
    pullRequests: PullRequest[];

    @OneToMany(() => Deployment, (dep) => dep.deployedBy)
    deployments: Deployment[];

    @OneToMany(() => Build, (b) => b.triggeredBy)
    builds: Build[];

    @OneToMany(() => Attachment, (att) => att.uploadedBy)
    attachments: Attachment[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

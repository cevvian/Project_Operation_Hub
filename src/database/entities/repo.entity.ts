import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, JoinColumn, } from 'typeorm';
import { Project } from './project.entity';
import { Commit } from './commit.entity';
import { PullRequest } from './pull-request.entity';
import { Branch } from './branch.entity';
import { WebhookStatus } from './enum/webhook-status.enum';
import { User } from './user.entity';


@Entity('repos')
export class Repo {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @ManyToOne(() => User, { nullable: false })
  createdBy: User;

  @ManyToOne(() => Project, (project) => project.repos, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  name: string;

  @Column()
  githubUrl: string;

  @Column({ nullable: true })
  webhookId?: number;

  @Column({ nullable: true })
  webhookSecret?: string;

  // Chủ repository (vd: "anhthudev")
  @Column()
  owner: string;

  // full name = "{owner}/{name}" (vd: "anhthudev/frontend")
  @Column()
  fullName: string;

  // default branch (vd: 'main', 'master')
  @Column({ default: 'main' })
  defaultBranch: string;

  // Repo ID trên GitHub (rất hữu ích)
  @Column({ nullable: true })
  githubId: number;

  @Column({ default: true })
  isPrivate: boolean;

  // Token dùng riêng repo (nếu mỗi repo dùng PAT khác nhau)
  @Column({ nullable: true })
  patTokenEncrypted: string;

  @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.PENDING,
  })
  webhookStatus: WebhookStatus;

  @Column({ type: 'int', default: 0 })
  webhookRetryCount: number;


  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Commit, (commit) => commit.repo)
  commits: Commit[];

  @OneToMany(() => PullRequest, (pr) => pr.repo)
  pullRequests: PullRequest[];

  @OneToMany(() => Branch, (br) => br.repo)
  branches: Branch[];
}

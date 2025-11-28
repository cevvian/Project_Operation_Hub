import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, } from 'typeorm';
import { Project } from './project.entity';
import { Commit } from './commit.entity';
import { PullRequest } from './pull-request.entity';
import { Branch } from './branch.entity';


@Entity('repos')
export class Repo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  // Token dùng riêng repo (nếu mỗi repo dùng PAT khác nhau)
  @Column({ nullable: true })
  patTokenEncrypted: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Commit, (commit) => commit.repo)
  commits: Commit[];

  @OneToMany(() => PullRequest, (pr) => pr.repo)
  pullRequests: PullRequest[];

  @OneToMany(() => Branch, (br) => br.repo)
  branches: Branch[];
}

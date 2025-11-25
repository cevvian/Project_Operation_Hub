// repo.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Commit } from './commit.entity';
import { PullRequest } from './pull-request.entity';


@Entity('repos')
export class Repo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.repos, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  name: string;

  @Column()
  githubUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Commit, (commit) => commit.repo)
  commits: Commit[];

  @OneToMany(() => PullRequest, (pr) => pr.repo)
  pullRequests: PullRequest[];
}

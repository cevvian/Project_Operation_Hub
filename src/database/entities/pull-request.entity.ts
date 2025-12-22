import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Repo } from './repo.entity';
import { User } from './user.entity';
import { PRStatus } from './enum/pr-status.enum';
import { PRTaskLink } from './pr-task-link.entity';


@Entity('pull_requests')
export class PullRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Repo, (repo) => repo.pullRequests, { onDelete: 'CASCADE' })
  repo: Repo;

  @Column({ type: 'bigint', unique: true })
  githubId: number;

  @Column()
  number: number;

  @Column()
  url: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.pullRequests, { nullable: true, onDelete: 'SET NULL' })
  createdBy: User | null;

  @Column({ type: 'enum', enum: PRStatus, default: PRStatus.OPEN })
  status: PRStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PRTaskLink, (link) => link.pullRequest, { cascade: true })
  taskLinks: PRTaskLink[];
}

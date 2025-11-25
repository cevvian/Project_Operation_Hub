import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, } from 'typeorm';
import { Repo } from './repo.entity';
import { User } from './user.entity';
import { PRStatus } from './enum/pr-status.enum';
import { PRTaskLink } from './pr-task-link.entity';


@Entity('pull_requests')
export class PullRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Repo, (repo) => repo.pullRequests, {
    onDelete: 'CASCADE',
  })
  repo: Repo;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.pullRequests)
  createdBy: User;

  @Column({ type: 'enum', enum: PRStatus, default: PRStatus.OPEN })
  status: PRStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PRTaskLink, (link) => link.pullRequest, {
    cascade: true,
  })
  taskLinks: PRTaskLink[];
}

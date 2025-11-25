// commit.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Repo } from './repo.entity';
import { User } from './user.entity';


@Entity('commits')
export class Commit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Repo, (repo) => repo.commits, { onDelete: 'CASCADE' })
  repo: Repo;

  @Column()
  hash: string;

  @ManyToOne(() => User, (user) => user.commits, { onDelete: 'SET NULL' })
  author: User;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}

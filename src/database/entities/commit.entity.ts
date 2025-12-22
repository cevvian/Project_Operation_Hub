import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn,
} from 'typeorm';
import { Repo } from './repo.entity';
import { User } from './user.entity';
import { Task } from './task.entity';


@Entity('commits')
export class Commit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Repo, (repo) => repo.commits, { onDelete: 'CASCADE' })
  repo: Repo;

  @Column()
  hash: string;

  @ManyToOne(() => User, (user) => user.commits, { nullable: true, onDelete: 'SET NULL' })
  author: User | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  task: Task | null;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}

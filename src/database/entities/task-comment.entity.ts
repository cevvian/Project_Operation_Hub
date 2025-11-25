import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';


@Entity('task_comments')
export class TaskComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
  task: Task;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  user: User;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}

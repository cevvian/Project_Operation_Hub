// attachment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, (task) => task.attachments, { onDelete: 'CASCADE' })
  task: Task;

  @Column()
  filename: string;

  @Column()
  url: string;

//   @ManyToOne(() => User, (user) => user.attachments, {
//     onDelete: 'SET NULL',
//   })
//   uploadedBy: User;
  @ManyToOne(() => User)
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}

// task.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sprint } from './sprint.entity';
import { Project } from './project.entity';
import { User } from './user.entity';
import { TaskComment } from './task-comment.entity';
import { Attachment } from './attachment.entity';
import { PRTaskLink } from './pr-task-link.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sprint, (s) => s.tasks)
  sprint: Sprint;

  @ManyToOne(() => Project)
  project: Project;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, (u) => u.assignedTasks, { nullable: true })
  assignee: User;

  @ManyToOne(() => User, (u) => u.reportedTasks)
  reporter: User;

  @Column({ type: 'enum', enum: TaskStatus })
  status: TaskStatus;

  @OneToMany(() => TaskComment, (c) => c.task)
  comments: TaskComment[];

  @OneToMany(() => Attachment, (a) => a.task)
  attachments: Attachment[];

  @OneToMany(() => PRTaskLink, (pr) => pr.task)
  prLinks: PRTaskLink[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

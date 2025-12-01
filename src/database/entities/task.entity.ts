import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, UpdateDateColumn, } from 'typeorm';
import { Sprint } from './sprint.entity';
import { Project } from './project.entity';
import { User } from './user.entity';
import { TaskComment } from './task-comment.entity';
import { Attachment } from './attachment.entity';
import { PRTaskLink } from './pr-task-link.entity';
import { TaskStatus } from './enum/task-status.enum';
import { Branch } from './branch.entity';
import { Commit } from './commit.entity';
import { TaskPriority } from './enum/task-priority.enum';


@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sprint, (s) => s.tasks)
  sprint: Sprint;

  @ManyToOne(() => Project)
  project: Project;

  @Column()
  name: string;

  @Column({ unique: true })
  key: string; // ví dụ: PROJ-123 

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, (u) => u.assignedTasks, { nullable: true })
  assignee: User;

  @ManyToOne(() => User, (u) => u.reportedTasks)
  reporter: User;

  @Column({ type: 'enum', enum: TaskStatus })
  status: TaskStatus;

  @Column({ name: 'priority', enum: TaskPriority  })
  priority: TaskPriority;

  @OneToMany(() => TaskComment, (c) => c.task)
  comments: TaskComment[];

  @OneToMany(() => Attachment, (a) => a.task)
  attachments: Attachment[];

  @OneToMany(() => PRTaskLink, (pr) => pr.task)
  prLinks: PRTaskLink[];

  @OneToMany(() => Branch, (br) => br.task)
  branches: Branch[];

  @OneToMany(() => Commit, (c) => c.task)
  commits: Commit[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

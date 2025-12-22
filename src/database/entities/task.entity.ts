import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  JoinColumn
} from 'typeorm';
import { Sprint } from './sprint.entity';
import { Project } from './project.entity';
import { User } from './user.entity';
import { TaskComment } from './task-comment.entity';
import { TaskStatus } from './enum/task-status.enum';
import { TaskPriority } from './enum/task-priority.enum';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: 'Project-specific key, e.g., PROJ-123' })
  key: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'integer', nullable: true, comment: 'Estimate of effort' })
  storyPoints: number;

  @Column({ type: 'integer', comment: 'Used for ordering tasks in a list/column' })
  orderIndex: number;

  @Column({ type: 'timestamp', name: 'start_date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamp', name: 'due_date', nullable: true })
  dueDate: Date | null;

  // --- Relations ---

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: false })
  project: Project;

  @ManyToOne(() => Sprint, (s) => s.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint | null; // A task can be in the backlog (null sprint)

  @ManyToOne(() => User, (u) => u.assignedTasks, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @ManyToOne(() => User, (u) => u.reportedTasks, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => Task, (task) => task.subTasks, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask: Task | null;

  @OneToMany(() => Task, (task) => task.parentTask)
  subTasks: Task[];

  @ManyToMany(() => Task, (task) => task.blocking)
  @JoinTable({
    name: 'task_dependencies',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'dependency_id', referencedColumnName: 'id' },
  })
  dependencies: Task[];

  @ManyToMany(() => Task, (task) => task.dependencies)
  blocking: Task[];

  @OneToMany(() => TaskComment, (c) => c.task)
  comments: TaskComment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

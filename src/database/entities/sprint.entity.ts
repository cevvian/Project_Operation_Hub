import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { SprintStatus } from './enum/sprint-status.enum';

@Entity({ name: 'sprints' })
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (p) => p.sprints, { onDelete: 'CASCADE', nullable: false })
  project: Project;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  goal?: string;

  @Column({ type: 'enum', enum: SprintStatus, default: SprintStatus.PLANNED })
  status: SprintStatus;

  @Column({ type: 'integer', comment: 'Used for ordering sprints in the UI' })
  orderIndex: number;

  @Column({ type: 'timestamp', name: 'start_date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamp', name: 'end_date', nullable: true })
  endDate: Date | null;

  @OneToMany(() => Task, (t) => t.sprint)
  tasks: Task[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

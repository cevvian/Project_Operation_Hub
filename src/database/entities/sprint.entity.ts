import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, } from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';


@Entity({ name: 'sprints' })
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (p) => p.sprints, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  name: string;

  @Column({ name: 'archived', default: false })
  archived: boolean;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @OneToMany(() => Task, (t) => t.sprint)
  tasks: Task[];
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, } from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { BuildStatus } from './enum/build-status.enum';

@Entity('builds')
export class Build {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.builds, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  triggeredBy: User;

  @Column({
    type: 'enum',
    enum: BuildStatus,
    default: BuildStatus.RUNNING,
  })
  status: BuildStatus;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;
}

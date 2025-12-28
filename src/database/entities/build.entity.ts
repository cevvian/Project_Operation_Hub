import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { BuildStatus } from './enum/build-status.enum';
import { Repo } from './repo.entity';
import { Deployment } from './deployment.entity';

@Entity('builds')
export class Build {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Repo, { onDelete: 'CASCADE' })
  repo: Repo;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  triggeredBy: User | null;

  @Column({ type: 'enum', enum: BuildStatus, default: BuildStatus.PENDING })
  status: BuildStatus;

  @Column()
  commitHash: string;

  @Column({ nullable: true })
  jenkinsJobName: string;

  @Column({ type: 'int', nullable: true })
  jenkinsBuildNumber: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;

  @Column({ type: 'text', nullable: true })
  consoleOutput: string | null;

  @OneToOne(() => Deployment, (deployment) => deployment.build)
  deployment: Deployment;
}

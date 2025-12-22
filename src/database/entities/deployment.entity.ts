import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';

import { Environment } from './environment.entity';
import { User } from './user.entity';
import { DeploymentStatus } from './enum/deploy-status.enum';
import { Build } from './build.entity';


@Entity('deployments')
export class Deployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Environment, (env) => env.deployments, {
    onDelete: 'CASCADE',
  })
  environment: Environment;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  deployedBy: User | null;

  @OneToOne(() => Build, (build) => build.deployment)
  @JoinColumn()
  build: Build;

  @Column({ type: 'enum', enum: DeploymentStatus })
  status: DeploymentStatus;

  @CreateDateColumn()
  deployedAt: Date;
}

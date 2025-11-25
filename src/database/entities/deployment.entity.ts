// deployment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';

import { Environment } from './environment.entity';
import { User } from './user.entity';
import { DeploymentStatus } from './enum/deploy-status.enum';


@Entity('deployments')
export class Deployment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Environment, (env) => env.deployments, {
    onDelete: 'CASCADE',
  })
  environment: Environment;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  deployedBy: User;

  @Column({ type: 'enum', enum: DeploymentStatus })
  status: DeploymentStatus;

  @CreateDateColumn()
  deployedAt: Date;
}

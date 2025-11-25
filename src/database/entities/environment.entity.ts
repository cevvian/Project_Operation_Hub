// environment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Project } from './project.entity';
import { Deployment } from './deployment.entity';

@Entity('environments')
export class Environment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.environments, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  name: string;

  @OneToMany(() => Deployment, (deploy) => deploy.environment)
  deployments: Deployment[];
}

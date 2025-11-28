import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, } from 'typeorm';
import { Project } from './project.entity';
import { Deployment } from './deployment.entity';

@Entity('environments')
export class Environment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.environments, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  name: string;

  @OneToMany(() => Deployment, (deploy) => deploy.environment)
  deployments: Deployment[];
}

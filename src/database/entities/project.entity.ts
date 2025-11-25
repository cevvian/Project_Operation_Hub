import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { Sprint } from './sprint.entity';
import { Repo } from './repo.entity';
import { TestCase } from './test-case.entity';
import { Environment } from './environment.entity';
import { Build } from './build.entity';


@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, (t) => t.projects)
  team: Team;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Sprint, (s) => s.project)
  sprints: Sprint[];

  @OneToMany(() => Repo, (r) => r.project)
  repos: Repo[];

  @OneToMany(() => TestCase, (tc) => tc.project)
  testCases: TestCase[];

  @OneToMany(() => Environment, (env) => env.project)
  environments: Environment[];

  @OneToMany(() => Build, (b) => b.project)
  builds: Build[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

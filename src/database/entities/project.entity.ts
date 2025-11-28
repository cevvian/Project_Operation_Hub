import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, UpdateDateColumn, } from 'typeorm';
import { Sprint } from './sprint.entity';
import { Repo } from './repo.entity';
import { TestCase } from './test-case.entity';
import { Environment } from './environment.entity';
import { Build } from './build.entity';
import { User } from './user.entity';
import { ProjectMember } from './project-member.entity';


@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @ManyToOne(() => Team, (t) => t.projects)
  // team: Team;
  @ManyToOne(() => User, { nullable: false })
  owner: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'key_prefix', length: 4 })
  keyPrefix: string;

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

  @OneToMany(() => ProjectMember, (pm) => pm.project)
  members: ProjectMember[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

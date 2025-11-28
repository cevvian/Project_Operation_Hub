import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, } from 'typeorm';
import { Project } from './project.entity';
import { TestRun } from './test-run.entity';

@Entity('test_cases')
export class TestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.testCases, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @OneToMany(() => TestRun, (run) => run.testCase)
  runs: TestRun[];
}
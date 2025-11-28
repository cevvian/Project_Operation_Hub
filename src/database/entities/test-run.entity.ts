import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, } from 'typeorm';
import { TestCase } from './test-case.entity';
import { User } from './user.entity';
import { TestStatus } from './enum/test-status.enum';

@Entity('test_runs')
export class TestRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TestCase, (tc) => tc.runs, { onDelete: 'CASCADE' })
  testCase: TestCase;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  executedBy: User;

  @Column({
    type: 'enum',
    enum: TestStatus,
    default: TestStatus.PASS,
  })
  status: TestStatus;

  @CreateDateColumn()
  executedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['createdAt'])
@Index(['severity'])
@Index(['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'text', nullable: true })
  actionDetail: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ type: 'varchar', length: 20, default: 'INFO' })
  severity: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  targetType: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 20, default: 'automatic' })
  logType: string;

  @CreateDateColumn()
  createdAt: Date;
}

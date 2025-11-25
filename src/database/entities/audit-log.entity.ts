// audit-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';


@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  user: User;

  @Column()
  action: string;

  @Column()
  targetType: string;

  @Column()
  targetId: number;

  @CreateDateColumn()
  createdAt: Date;
}

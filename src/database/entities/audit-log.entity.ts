import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, } from 'typeorm';
import { User } from './user.entity';


@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

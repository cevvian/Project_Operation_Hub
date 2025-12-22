import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'INFO',
  })
  type: 'INFO' | 'WARNING' | 'CRITICAL';

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { nullable: true })
  sender: User;

  @CreateDateColumn()
  createdAt: Date;
}


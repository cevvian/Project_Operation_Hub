import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';


@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

//   @ManyToOne(() => User, (user) => user.notifications, {
//     onDelete: 'CASCADE',
//   })
//   user: User;
  @ManyToOne(() => User)
  uploadedBy: User;

  @Column()
  type: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}

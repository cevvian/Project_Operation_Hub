import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Notification } from './notification.entity';

@Entity('user_notifications')
export class UserNotification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Notification, { onDelete: 'CASCADE' })
    notification: Notification;

    @Column({ default: false })
    isRead: boolean;

    @Column({ type: 'timestamp', nullable: true })
    readAt: Date;

    @CreateDateColumn()
    receivedAt: Date;
}

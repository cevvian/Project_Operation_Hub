import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { UserNotification } from '../../database/entities/user-notification.entity';

export interface CreateBroadcastDto {
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'CRITICAL';
    senderId?: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
        @InjectRepository(UserNotification)
        private userNotificationRepo: Repository<UserNotification>,
    ) { }

    /**
     * Create a broadcast notification (not yet sent to users)
     */
    async createBroadcast(dto: CreateBroadcastDto): Promise<Notification> {
        const notification = this.notificationRepo.create({
            title: dto.title,
            message: dto.message,
            type: dto.type,
            metadata: dto.metadata,
            sender: dto.senderId ? { id: dto.senderId } as any : null,
        });

        return await this.notificationRepo.save(notification, { reload: true });
    }

    /**
     * Send notification to specific users (creates UserNotification records)
     * Used for offline users or targeted notifications
     */
    async sendToUsers(notificationId: string, userIds: string[]): Promise<void> {
        const userNotifications = userIds.map(userId =>
            this.userNotificationRepo.create({
                notification: { id: notificationId } as any,
                user: { id: userId } as any,
                isRead: false,
            })
        );

        await this.userNotificationRepo.save(userNotifications);
    }

    /**
     * Get unread notifications for a user
     */
    async getUnreadForUser(userId: string): Promise<UserNotification[]> {
        return await this.userNotificationRepo.find({
            where: {
                user: { id: userId },
                isRead: false,
            },
            relations: ['notification', 'notification.sender'],
            order: { receivedAt: 'DESC' },
        });
    }

    /**
     * Get all notifications for a user (with pagination)
     */
    async getAllForUser(
        userId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ data: UserNotification[]; total: number }> {
        const [data, total] = await this.userNotificationRepo.findAndCount({
            where: { user: { id: userId } },
            relations: ['notification', 'notification.sender'],
            order: { receivedAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return { data, total };
    }

    /**
     * Mark a specific notification as read
     */
    async markAsRead(userId: string, notificationId: string): Promise<void> {
        const userNotification = await this.userNotificationRepo.findOne({
            where: {
                user: { id: userId },
                notification: { id: notificationId },
            },
        });

        if (!userNotification) {
            throw new NotFoundException('Notification not found');
        }

        userNotification.isRead = true;
        userNotification.readAt = new Date();

        await this.userNotificationRepo.save(userNotification);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        await this.userNotificationRepo.update(
            { user: { id: userId }, isRead: false },
            { isRead: true, readAt: new Date() },
        );
    }

    /**
     * Delete old read notifications (cleanup job)
     */
    async deleteOldReadNotifications(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.userNotificationRepo
            .createQueryBuilder()
            .delete()
            .where('isRead = :isRead', { isRead: true })
            .andWhere('readAt < :cutoffDate', { cutoffDate })
            .execute();

        return result.affected || 0;
    }
}

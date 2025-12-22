import { Controller, Get, Patch, Param, Query, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// TODO: Add JWT authentication guard when WebSocket auth is properly configured

@Controller('notifications')
// @UseGuards(JwtAuthGuard) // TODO: Uncomment when guard is available
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /**
     * GET /notifications/unread
     * Get all unread notifications for the authenticated user
     * TODO: Add proper JWT guard - currently returns empty for unauthenticated requests
     */
    @Get('unread')
    async getUnread(@Req() req) {
        // Temporary: Handle missing auth
        if (!req.user || !req.user.sub) {
            return { data: [], count: 0 };
        }

        const userId = req.user.sub;
        const unreadNotifications = await this.notificationsService.getUnreadForUser(userId);

        return {
            data: unreadNotifications.map(un => ({
                id: un.notification.id,
                title: un.notification.title,
                message: un.notification.message,
                type: un.notification.type,
                metadata: un.notification.metadata,
                receivedAt: un.receivedAt,
                sender: un.notification.sender ? {
                    id: un.notification.sender.id,
                    email: un.notification.sender.email,
                } : null,
            })),
            count: unreadNotifications.length,
        };
    }

    /**
     * GET /notifications/all?page=1&limit=20
     * Get all notifications with pagination
     * TODO: Add proper JWT guard
     */
    @Get('all')
    async getAll(@Req() req, @Query('page') page = 1, @Query('limit') limit = 20) {
        // Temporary: Handle missing auth
        if (!req.user || !req.user.sub) {
            return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        }

        const userId = req.user.sub;
        const { data, total } = await this.notificationsService.getAllForUser(
            userId,
            Number(page),
            Number(limit),
        );

        return {
            data: data.map(un => ({
                id: un.notification.id,
                title: un.notification.title,
                message: un.notification.message,
                type: un.notification.type,
                metadata: un.notification.metadata,
                isRead: un.isRead,
                readAt: un.readAt,
                receivedAt: un.receivedAt,
            })),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }

    /**
     * PATCH /notifications/:id/read
     * Mark a specific notification as read
     */
    @Patch(':id/read')
    async markAsRead(@Req() req, @Param('id') id: string) {
        if (!req.user || !req.user.sub) {
            return { message: 'Unauthenticated' };
        }

        const userId = req.user.sub;
        await this.notificationsService.markAsRead(userId, id);
        return { message: 'Notification marked as read' };
    }

    /**
     * PATCH /notifications/read-all
     * Mark all notifications as read
     */
    @Patch('read-all')
    async markAllAsRead(@Req() req) {
        if (!req.user || !req.user.sub) {
            return { message: 'Unauthenticated' };
        }

        const userId = req.user.sub;
        await this.notificationsService.markAllAsRead(userId);
        return { message: 'All notifications marked as read' };
    }
}

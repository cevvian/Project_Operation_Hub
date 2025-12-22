import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { UsersService } from '../../modules/users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with exact frontend URL
  },
  namespace: 'events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);
  // FIX: Support multiple devices per user
  private onlineUsers = new Map<string, Set<string>>(); // userId → Set<socketId>

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) { }

  handleConnection(client: Socket) {
    try {
      // Extract userId from JWT token
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      const userId = this.extractUserIdFromToken(token);

      if (userId) {
        // FIX: Support multiple devices - add to Set instead of overwriting
        if (!this.onlineUsers.has(userId)) {
          this.onlineUsers.set(userId, new Set());
        }
        this.onlineUsers.get(userId)!.add(client.id);
        client.data.userId = userId; // Store for easy access

        const deviceCount = this.onlineUsers.get(userId)!.size;
        this.logger.log(`User ${userId} online (${client.id}) - Total devices: ${deviceCount}`);
      } else {
        this.logger.warn(`Client ${client.id} connected without valid user ID`);
      }
    } catch (error) {
      this.logger.error(`Connection error for ${client.id}:`, error);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      // FIX: Remove only this socket from the Set
      const socketSet = this.onlineUsers.get(userId);
      if (socketSet) {
        socketSet.delete(client.id);
        const remainingDevices = socketSet.size;

        // If no more devices, remove user from map
        if (remainingDevices === 0) {
          this.onlineUsers.delete(userId);
          this.logger.log(`User ${userId} fully offline (${client.id})`);
        } else {
          this.logger.log(`User ${userId} device offline (${client.id}) - Remaining: ${remainingDevices}`);
        }
      }
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.join(`project-${projectId}`);
    this.logger.log(`Client ${client.id} joined room: project-${projectId}`);
    return { event: 'joined', data: `Joined project-${projectId}` };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.leave(`project-${projectId}`);
    this.logger.log(`Client ${client.id} left room: project-${projectId}`);
  }

  @SubscribeMessage('admin:broadcast')
  async handleBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { title: string; message: string; type: 'INFO' | 'WARNING' | 'CRITICAL'; target?: string },
  ) {
    try {
      const senderId = client.data.userId;
      this.logger.log(`Admin Broadcast from ${client.id}: ${payload.title}`);

      // 1. Create notification in database
      const notification = await this.notificationsService.createBroadcast({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        senderId,
        metadata: { target: payload.target || 'ALL_USERS' },
      });

      // 2. Get target user IDs
      const targetUserIds = await this.getTargetUsers(payload.target || 'ALL_USERS');

      // 3. FIX: Save to DB for ALL users (online + offline)
      // This ensures everyone has a record in user_notifications table
      await this.notificationsService.sendToUsers(notification.id, targetUserIds);
      this.logger.log(`Saved notification to DB for ${targetUserIds.length} users`);

      // 4. Send realtime to online users (all devices)
      let totalDevicesNotified = 0;
      const onlineUserIds: string[] = [];

      for (const userId of targetUserIds) {
        const socketIds = this.onlineUsers.get(userId);
        if (socketIds && socketIds.size > 0) {
          onlineUserIds.push(userId);

          // FIX: Send to ALL devices of this user
          socketIds.forEach(socketId => {
            this.server.to(socketId).emit('notification:broadcast', {
              id: notification.id,
              title: payload.title,
              message: payload.message,
              type: payload.type,
              receivedAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
            });
            totalDevicesNotified++;
          });
        }
      }

      const offlineUserIds = targetUserIds.filter(id => !onlineUserIds.includes(id));

      this.logger.log(
        `Broadcast complete: ${onlineUserIds.length} users online (${totalDevicesNotified} devices), ${offlineUserIds.length} offline`,
      );

      return {
        success: true,
        totalUsers: targetUserIds.length,
        onlineUsers: onlineUserIds.length,
        onlineDevices: totalDevicesNotified,
        offlineUsers: offlineUserIds.length,
      };
    } catch (error) {
      this.logger.error('Broadcast error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract user ID from JWT token (basic implementation)
   */
  private extractUserIdFromToken(token: string): string | null {
    try {
      if (!token) return null;

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');

      // Decode JWT payload (base64)
      const payload = JSON.parse(
        Buffer.from(cleanToken.split('.')[1], 'base64').toString()
      );

      return payload.sub || payload.userId || null;
    } catch (error) {
      this.logger.warn('Failed to decode token:', error.message);
      return null;
    }
  }

  /**
   * Get target user IDs based on broadcast target
   */
  private async getTargetUsers(target: string): Promise<string[]> {
    switch (target) {
      case 'ALL_USERS':
        return await this.usersService.getAllUserIds();
      case 'ADMINS':
        return await this.usersService.getAdminUserIds();
      default:
        return [];
    }
  }
}


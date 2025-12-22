import { Module } from '@nestjs/common';
import { EventsGateway } from './events/events.gateway';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [NotificationsModule, UsersModule],
  providers: [EventsGateway],
})
export class EventsModule { }

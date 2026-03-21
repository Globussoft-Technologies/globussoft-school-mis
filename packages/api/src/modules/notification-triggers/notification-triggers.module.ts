import { Module } from '@nestjs/common';
import { NotificationTriggersService } from './notification-triggers.service';
import { NotificationTriggersController } from './notification-triggers.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [NotificationTriggersController],
  providers: [NotificationTriggersService],
  exports: [NotificationTriggersService],
})
export class NotificationTriggersModule {}

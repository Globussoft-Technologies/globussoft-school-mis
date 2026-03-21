import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, BulkCreateNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Post('bulk')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  createBulk(@Body() dto: BulkCreateNotificationDto) {
    return this.notificationsService.createBulk(dto);
  }

  @Get()
  getUserNotifications(
    @CurrentUser('sub') userId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      userId,
      { type, status, channel },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get('stats')
  getStats(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getNotificationStats(userId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  updateStatus(
    @Param('id') notificationId: string,
    @Body() body: { status: string; sentAt?: string },
  ) {
    return this.notificationsService.updateStatus(
      notificationId,
      body.status,
      body.sentAt ? new Date(body.sentAt) : undefined,
    );
  }

  @Delete(':id')
  deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.notificationsService.deleteNotification(notificationId, userId);
  }
}

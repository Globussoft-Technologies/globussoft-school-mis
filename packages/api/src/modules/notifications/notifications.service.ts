import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto, BulkCreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        channel: dto.channel,
        status: 'PENDING',
        metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
      },
    });
  }

  async createBulk(dto: BulkCreateNotificationDto) {
    const data = dto.userIds.map((userId) => ({
      userId,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      channel: dto.channel,
      status: 'PENDING' as const,
      metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
    }));

    await this.prisma.notification.createMany({ data });

    return { created: data.length, message: 'Bulk notifications queued successfully' };
  }

  async getUserNotifications(
    userId: string,
    filters: { type?: string; status?: string; channel?: string },
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: {
          userId,
          ...(filters.type && { type: filters.type }),
          ...(filters.status && { status: filters.status }),
          ...(filters.channel && { channel: filters.channel }),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          ...(filters.type && { type: filters.type }),
          ...(filters.status && { status: filters.status }),
          ...(filters.channel && { channel: filters.channel }),
        },
      }),
    ]);

    return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: { not: 'READ' } },
      data: { status: 'READ', readAt: new Date() },
    });

    return { updated: result.count, message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, status: { not: 'READ' } },
    });

    return { count };
  }

  async updateStatus(notificationId: string, status: string, sentAt?: Date) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status,
        ...(sentAt && { sentAt }),
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({ where: { id: notificationId } });
  }

  async getNotificationStats(userId: string) {
    const [total, unread, byType] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, status: { not: 'READ' } } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        orderBy: { type: 'asc' },
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      unread,
      byType: byType.map((b) => ({ type: b.type, count: (b._count as any)?._all ?? 0 })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    studentId: string,
    type: string,
    title: string,
    description?: string,
    metadata?: any,
  ) {
    return this.prisma.activityLog.create({
      data: {
        studentId,
        type,
        title,
        description,
        metadata,
        date: new Date(),
      },
    });
  }

  async getStudentTimeline(
    studentId: string,
    type?: string,
    limit = 50,
    offset = 0,
  ) {
    const where: any = { studentId };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async getRecentActivity(studentId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.prisma.activityLog.findMany({
      where: {
        studentId,
        date: { gte: since },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getActivityStats(studentId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: { studentId },
      select: { type: true },
    });
    const stats: Record<string, number> = {};
    for (const log of logs) {
      stats[log.type] = (stats[log.type] || 0) + 1;
    }
    return { studentId, total: logs.length, byType: stats };
  }
}

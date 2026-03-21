import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogMessageDto, UpdateMessageStatusDto } from './dto/log-message.dto';

@Injectable()
export class MessageLogService {
  constructor(private prisma: PrismaService) {}

  async logMessage(dto: LogMessageDto) {
    return this.prisma.messageLog.create({
      data: {
        type: dto.type,
        recipient: dto.recipient,
        recipientName: dto.recipientName,
        subject: dto.subject,
        content: dto.content,
        provider: dto.provider,
        metadata: dto.metadata as any,
        status: 'QUEUED',
      },
    });
  }

  async updateStatus(id: string, dto: UpdateMessageStatusDto) {
    const log = await this.prisma.messageLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Message log not found');

    const data: Record<string, unknown> = { status: dto.status };
    if (dto.providerRef) data.providerRef = dto.providerRef;
    if (dto.failReason) data.failReason = dto.failReason;
    if (dto.status === 'SENT') data.sentAt = new Date();
    if (dto.status === 'DELIVERED') data.deliveredAt = new Date();

    return this.prisma.messageLog.update({ where: { id }, data });
  }

  async getAll(filters: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { type, status, startDate, endDate } = filters;
    return this.prisma.messageLog.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.messageLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Message log not found');
    return log;
  }

  async getStats() {
    const [total, sent, delivered, failed, queued] = await Promise.all([
      this.prisma.messageLog.count(),
      this.prisma.messageLog.count({ where: { status: 'SENT' } }),
      this.prisma.messageLog.count({ where: { status: 'DELIVERED' } }),
      this.prisma.messageLog.count({ where: { status: 'FAILED' } }),
      this.prisma.messageLog.count({ where: { status: 'QUEUED' } }),
    ]);

    const byType = await this.prisma.messageLog.groupBy({
      by: ['type'],
      _count: { type: true },
    });

    return {
      total,
      sent,
      delivered,
      failed,
      queued,
      bounced: total - sent - delivered - failed - queued,
      byType: byType.map((b) => ({ type: b.type, count: b._count.type })),
    };
  }

  async retry(id: string) {
    const log = await this.prisma.messageLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Message log not found');

    return this.prisma.messageLog.update({
      where: { id },
      data: {
        status: 'QUEUED',
        failReason: null,
        sentAt: null,
        deliveredAt: null,
      },
    });
  }
}

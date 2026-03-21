import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'APPROVE'
  | 'REJECT';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record a single audit event.
   */
  async log(
    userId: string,
    action: AuditAction | string,
    entity: string,
    entityId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }

  /**
   * Paginated list of logs with optional filters.
   */
  async getLogs(
    filters: {
      userId?: string;
      entity?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page = 1,
    limit = 20,
  ) {
    const where: Record<string, unknown> = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entity) where.entity = filters.entity;
    if (filters.action) where.action = filters.action;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Full history for a specific record.
   */
  async getEntityHistory(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Recent activity for a specific user.
   */
  async getUserActivity(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

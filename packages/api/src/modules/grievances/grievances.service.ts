import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GrievancesService {
  constructor(private prisma: PrismaService) {}

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.grievance.count({
      where: { ticketNumber: { startsWith: `GRV-${year}-` } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `GRV-${year}-${seq}`;
  }

  async submit(data: {
    submittedBy: string;
    category: string;
    subject: string;
    description: string;
    priority?: string;
    schoolId: string;
  }) {
    const ticketNumber = await this.generateTicketNumber();
    return this.prisma.grievance.create({
      data: {
        ticketNumber,
        submittedBy: data.submittedBy,
        category: data.category,
        subject: data.subject,
        description: data.description,
        priority: data.priority ?? 'MEDIUM',
        status: 'OPEN',
        schoolId: data.schoolId,
      },
    });
  }

  async findAll(filters: {
    schoolId: string;
    status?: string;
    category?: string;
    priority?: string;
    assignedTo?: string;
  }) {
    const { schoolId, status, category, priority, assignedTo } = filters;
    return this.prisma.grievance.findMany({
      where: {
        schoolId,
        ...(status && { status }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(assignedTo && { assignedTo }),
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async assign(id: string, assignedTo: string) {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return this.prisma.grievance.update({
      where: { id },
      data: {
        assignedTo,
        status: grievance.status === 'OPEN' ? 'IN_PROGRESS' : grievance.status,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    const data: Record<string, unknown> = { status };
    if (status === 'CLOSED') data.closedAt = new Date();
    return this.prisma.grievance.update({ where: { id }, data });
  }

  async resolve(id: string, resolution: string) {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return this.prisma.grievance.update({
      where: { id },
      data: {
        resolution,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
  }

  async close(id: string) {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return this.prisma.grievance.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  async reopen(id: string) {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    if (!['RESOLVED', 'CLOSED'].includes(grievance.status)) {
      throw new BadRequestException('Only RESOLVED or CLOSED grievances can be reopened');
    }
    return this.prisma.grievance.update({
      where: { id },
      data: { status: 'REOPENED', resolvedAt: null, closedAt: null },
    });
  }

  async getStats(schoolId: string) {
    const all = await this.prisma.grievance.findMany({ where: { schoolId } });

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const g of all) {
      byStatus[g.status] = (byStatus[g.status] ?? 0) + 1;
      byCategory[g.category] = (byCategory[g.category] ?? 0) + 1;
      byPriority[g.priority] = (byPriority[g.priority] ?? 0) + 1;
    }

    return {
      total: all.length,
      open: byStatus['OPEN'] ?? 0,
      inProgress: byStatus['IN_PROGRESS'] ?? 0,
      resolved: byStatus['RESOLVED'] ?? 0,
      closed: byStatus['CLOSED'] ?? 0,
      reopened: byStatus['REOPENED'] ?? 0,
      byStatus,
      byCategory,
      byPriority,
    };
  }
}

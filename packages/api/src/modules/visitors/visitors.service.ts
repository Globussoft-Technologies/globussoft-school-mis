import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VisitorsService {
  constructor(private prisma: PrismaService) {}

  async checkIn(data: {
    visitorName: string;
    phone: string;
    purpose: string;
    visitingWhom?: string;
    department?: string;
    badgeNumber?: string;
    idProof?: string;
    remarks?: string;
    schoolId: string;
    loggedBy: string;
  }) {
    return this.prisma.visitorLog.create({ data });
  }

  async checkOut(id: string) {
    const log = await this.prisma.visitorLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Visitor log not found');

    return this.prisma.visitorLog.update({
      where: { id },
      data: { checkOut: new Date() },
    });
  }

  async findAll(params: { date?: string; purpose?: string; schoolId?: string }) {
    const { date, purpose, schoolId } = params;
    let dateFilter = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      dateFilter = { checkIn: { gte: start, lte: end } };
    }

    return this.prisma.visitorLog.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        ...(purpose ? { purpose } : {}),
        ...dateFilter,
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getTodaysVisitors(schoolId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.visitorLog.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        checkIn: { gte: start, lte: end },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getActiveVisitors(schoolId?: string) {
    return this.prisma.visitorLog.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        checkOut: null,
      },
      orderBy: { checkIn: 'desc' },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  // ─── Health Records ───────────────────────────────────────────────

  async upsertHealthRecord(data: {
    studentId: string;
    bloodGroup?: string;
    height?: number;
    weight?: number;
    allergies?: any[];
    conditions?: any[];
    medications?: any[];
    emergencyContact?: string;
    emergencyPhone?: string;
    lastCheckupDate?: string;
    doctorName?: string;
    doctorPhone?: string;
    notes?: string;
    updatedBy?: string;
  }) {
    const { studentId, lastCheckupDate, ...rest } = data;
    return this.prisma.healthRecord.upsert({
      where: { studentId },
      create: {
        studentId,
        ...rest,
        ...(lastCheckupDate ? { lastCheckupDate: new Date(lastCheckupDate) } : {}),
      },
      update: {
        ...rest,
        ...(lastCheckupDate ? { lastCheckupDate: new Date(lastCheckupDate) } : {}),
      },
    });
  }

  async getHealthRecord(studentId: string) {
    const record = await this.prisma.healthRecord.findUnique({
      where: { studentId },
    });
    return record;
  }

  async getStudentsWithAllergies() {
    const records = await this.prisma.healthRecord.findMany({
      where: {
        NOT: { allergies: { equals: [] } },
      },
    });
    // Filter out records where allergies JSON is empty array
    return records.filter((r) => {
      const allergies = r.allergies as any[];
      return Array.isArray(allergies) && allergies.length > 0;
    });
  }

  // ─── Health Incidents ─────────────────────────────────────────────

  async logIncident(data: {
    studentId: string;
    date: string;
    type: string;
    description: string;
    actionTaken?: string;
    parentNotified?: boolean;
    sentHome?: boolean;
    reportedBy: string;
  }) {
    const { date, ...rest } = data;
    return this.prisma.healthIncident.create({
      data: {
        ...rest,
        date: new Date(date),
      },
    });
  }

  async getIncidents(params: { studentId?: string; date?: string; type?: string }) {
    const { studentId, date, type } = params;
    let dateFilter = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      dateFilter = { date: { gte: start, lte: end } };
    }

    return this.prisma.healthIncident.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(type ? { type } : {}),
        ...dateFilter,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

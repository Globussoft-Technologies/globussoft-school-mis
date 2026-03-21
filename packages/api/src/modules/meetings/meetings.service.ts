import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    meetingDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    type: string;
    attendees?: any[];
    agenda?: any[];
    actionItems?: any[];
    summary?: string;
    recordedBy: string;
    schoolId: string;
  }) {
    return this.prisma.meetingMinutes.create({
      data: {
        ...data,
        meetingDate: new Date(data.meetingDate),
        attendees: data.attendees || [],
        agenda: data.agenda || [],
        actionItems: data.actionItems || [],
      },
    });
  }

  async findAll(filters: { type?: string; status?: string; schoolId?: string }) {
    const { type, status, schoolId } = filters;
    return this.prisma.meetingMinutes.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(schoolId ? { schoolId } : {}),
      },
      orderBy: { meetingDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const meeting = await this.prisma.meetingMinutes.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async update(id: string, data: Partial<{
    title: string;
    meetingDate: string;
    startTime: string;
    endTime: string;
    location: string;
    type: string;
    attendees: any[];
    agenda: any[];
    actionItems: any[];
    summary: string;
    status: string;
  }>) {
    const updateData: any = { ...data };
    if (data.meetingDate) updateData.meetingDate = new Date(data.meetingDate);
    return this.prisma.meetingMinutes.update({ where: { id }, data: updateData });
  }

  async circulate(id: string) {
    const meeting = await this.findOne(id);
    if (meeting.status === 'APPROVED') throw new NotFoundException('Already approved');
    return this.prisma.meetingMinutes.update({
      where: { id },
      data: { status: 'CIRCULATED' },
    });
  }

  async approve(id: string) {
    await this.findOne(id);
    return this.prisma.meetingMinutes.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async getUpcoming(schoolId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.meetingMinutes.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        meetingDate: { gte: today },
      },
      orderBy: { meetingDate: 'asc' },
    });
  }

  async getByType(type: string, schoolId?: string) {
    return this.prisma.meetingMinutes.findMany({
      where: {
        type,
        ...(schoolId ? { schoolId } : {}),
      },
      orderBy: { meetingDate: 'desc' },
    });
  }
}

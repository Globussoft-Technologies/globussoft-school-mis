import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LiveClassesService {
  constructor(private prisma: PrismaService) {}

  async schedule(dto: {
    title: string;
    description?: string;
    classId: string;
    subjectId?: string;
    teacherId: string;
    scheduledAt: string;
    duration: number;
    meetingUrl?: string;
    maxParticipants?: number;
    notes?: string;
    schoolId: string;
  }) {
    return this.prisma.liveClass.create({
      data: {
        ...dto,
        scheduledAt: new Date(dto.scheduledAt),
        status: 'SCHEDULED',
      },
    });
  }

  async findAll(filters: { schoolId?: string; classId?: string; teacherId?: string; status?: string }) {
    return this.prisma.liveClass.findMany({
      where: {
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.teacherId && { teacherId: filters.teacherId }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        _count: { select: { attendees: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findById(id: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id },
      include: {
        attendees: true,
        _count: { select: { attendees: true } },
      },
    });
    if (!liveClass) throw new NotFoundException('Live class not found');
    return liveClass;
  }

  async start(id: string) {
    const lc = await this.prisma.liveClass.findUnique({ where: { id } });
    if (!lc) throw new NotFoundException('Live class not found');
    if (lc.status !== 'SCHEDULED') throw new BadRequestException('Class is not in SCHEDULED state');
    return this.prisma.liveClass.update({
      where: { id },
      data: { status: 'LIVE' },
    });
  }

  async end(id: string, recordingUrl?: string) {
    const lc = await this.prisma.liveClass.findUnique({ where: { id } });
    if (!lc) throw new NotFoundException('Live class not found');
    if (lc.status !== 'LIVE') throw new BadRequestException('Class is not LIVE');

    // Calculate actual attendance
    const attendees = await this.prisma.liveClassAttendance.count({
      where: { liveClassId: id },
    });

    return this.prisma.liveClass.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        attendeeCount: attendees,
        ...(recordingUrl && { recordingUrl }),
      },
    });
  }

  async cancel(id: string) {
    const lc = await this.prisma.liveClass.findUnique({ where: { id } });
    if (!lc) throw new NotFoundException('Live class not found');
    if (lc.status === 'COMPLETED') throw new BadRequestException('Cannot cancel a completed class');
    return this.prisma.liveClass.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async recordAttendance(liveClassId: string, studentId: string) {
    const lc = await this.prisma.liveClass.findUnique({ where: { id: liveClassId } });
    if (!lc) throw new NotFoundException('Live class not found');

    const existing = await this.prisma.liveClassAttendance.findUnique({
      where: { liveClassId_studentId: { liveClassId, studentId } },
    });

    if (existing) {
      // Mark as left
      const duration = existing.joinedAt
        ? Math.round((Date.now() - existing.joinedAt.getTime()) / 60000)
        : 0;
      return this.prisma.liveClassAttendance.update({
        where: { liveClassId_studentId: { liveClassId, studentId } },
        data: { leftAt: new Date(), duration },
      });
    }

    return this.prisma.liveClassAttendance.create({
      data: { liveClassId, studentId, joinedAt: new Date() },
    });
  }

  async getUpcoming(schoolId: string) {
    return this.prisma.liveClass.findMany({
      where: {
        schoolId,
        status: { in: ['SCHEDULED', 'LIVE'] },
        scheduledAt: { gte: new Date() },
      },
      include: { _count: { select: { attendees: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getByClass(classId: string) {
    return this.prisma.liveClass.findMany({
      where: { classId },
      include: { _count: { select: { attendees: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getRecordings(schoolId: string) {
    return this.prisma.liveClass.findMany({
      where: {
        schoolId,
        status: 'COMPLETED',
        recordingUrl: { not: null },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }
}

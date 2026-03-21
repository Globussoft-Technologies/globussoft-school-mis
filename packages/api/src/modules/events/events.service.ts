import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string;
    type: string;
    startDate: string;
    endDate?: string;
    venue?: string;
    organizer?: string;
    budget?: number;
    maxParticipants?: number;
    schoolId: string;
    createdBy: string;
  }) {
    return this.prisma.schoolEvent.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        venue: data.venue,
        organizer: data.organizer,
        budget: data.budget,
        maxParticipants: data.maxParticipants,
        schoolId: data.schoolId,
        createdBy: data.createdBy,
        status: 'PLANNED',
      },
      include: { registrations: true },
    });
  }

  async findAll(schoolId: string, type?: string, status?: string) {
    return this.prisma.schoolEvent.findMany({
      where: {
        schoolId,
        ...(type && { type }),
        ...(status && { status }),
      },
      include: { registrations: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.schoolEvent.findUnique({
      where: { id },
      include: { registrations: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      venue?: string;
      organizer?: string;
      budget?: number;
      maxParticipants?: number;
    },
  ) {
    await this.findOne(id);
    const updateData: Record<string, unknown> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    return this.prisma.schoolEvent.update({
      where: { id },
      data: updateData,
      include: { registrations: true },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    const validStatuses = ['PLANNED', 'APPROVED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    return this.prisma.schoolEvent.update({
      where: { id },
      data: { status },
      include: { registrations: true },
    });
  }

  async registerParticipant(
    eventId: string,
    userId: string,
    role: string = 'PARTICIPANT',
  ) {
    const event = await this.findOne(eventId);

    if (event.status === 'CANCELLED') {
      throw new BadRequestException('Cannot register for a cancelled event');
    }

    if (event.maxParticipants) {
      const activeCount = event.registrations.filter(
        (r) => r.status !== 'CANCELLED',
      ).length;
      if (activeCount >= event.maxParticipants) {
        throw new BadRequestException('Event has reached maximum participant capacity');
      }
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
      if (existing.status === 'CANCELLED') {
        // Re-register
        return this.prisma.eventRegistration.update({
          where: { id: existing.id },
          data: { status: 'REGISTERED', role },
        });
      }
      throw new ConflictException('User is already registered for this event');
    }

    return this.prisma.eventRegistration.create({
      data: { eventId, userId, role, status: 'REGISTERED' },
    });
  }

  async cancelRegistration(eventId: string, userId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    return this.prisma.eventRegistration.update({
      where: { id: reg.id },
      data: { status: 'CANCELLED' },
    });
  }

  async markAttended(eventId: string, userId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    return this.prisma.eventRegistration.update({
      where: { id: reg.id },
      data: { status: 'ATTENDED' },
    });
  }

  async getEventParticipants(eventId: string) {
    await this.findOne(eventId);
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getUpcomingEvents(schoolId: string, limit: number = 10) {
    const now = new Date();
    return this.prisma.schoolEvent.findMany({
      where: {
        schoolId,
        startDate: { gte: now },
        status: { in: ['PLANNED', 'APPROVED'] },
      },
      include: { registrations: true },
      orderBy: { startDate: 'asc' },
      take: limit,
    });
  }

  async getEventStats(schoolId: string) {
    const events = await this.prisma.schoolEvent.findMany({
      where: { schoolId },
      include: { registrations: true },
    });

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalParticipants = 0;

    for (const e of events) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
      byType[e.type] = (byType[e.type] ?? 0) + 1;
      totalParticipants += e.registrations.filter((r) => r.status !== 'CANCELLED').length;
    }

    return {
      total: events.length,
      upcoming: byStatus['PLANNED'] ?? 0 + (byStatus['APPROVED'] ?? 0),
      ongoing: byStatus['ONGOING'] ?? 0,
      completed: byStatus['COMPLETED'] ?? 0,
      cancelled: byStatus['CANCELLED'] ?? 0,
      totalParticipants,
      byStatus,
      byType,
    };
  }
}

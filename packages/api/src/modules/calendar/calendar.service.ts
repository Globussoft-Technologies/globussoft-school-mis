import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEventDto, createdBy: string) {
    return this.prisma.calendarEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isRecurring: dto.isRecurring ?? false,
        schoolId: dto.schoolId,
        createdBy,
        isPublic: dto.isPublic ?? true,
      },
    });
  }

  async findAll(filters: { month?: string; year?: string; type?: string; schoolId?: string }) {
    const where: Record<string, unknown> = {};

    if (filters.type) {
      where['type'] = filters.type;
    }
    if (filters.schoolId) {
      where['schoolId'] = filters.schoolId;
    }

    if (filters.month && filters.year) {
      const month = parseInt(filters.month, 10);
      const year = parseInt(filters.year, 10);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      where['OR'] = [
        {
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        {
          endDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      ];
    }

    return this.prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Calendar event ${id} not found`);
    }
    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  async getUpcoming(schoolId?: string) {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    return this.prisma.calendarEvent.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        startDate: {
          gte: today,
          lte: thirtyDaysLater,
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}

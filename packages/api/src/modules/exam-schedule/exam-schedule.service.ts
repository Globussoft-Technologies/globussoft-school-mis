import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamScheduleDto, CreateExamScheduleEntryDto } from './dto/create-exam-schedule.dto';
import { UpdateExamScheduleDto } from './dto/update-exam-schedule.dto';

@Injectable()
export class ExamScheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * List exam schedules with optional filters.
   */
  async findAll(filters: { classId?: string; type?: string; status?: string }) {
    return this.prisma.examSchedule.findMany({
      where: {
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        _count: { select: { entries: true } },
      },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single exam schedule by id, including all entries.
   */
  async findOne(id: string) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Exam schedule with id ${id} not found`);
    }

    return schedule;
  }

  /**
   * Create a new exam schedule, optionally with entries.
   */
  async create(dto: CreateExamScheduleDto) {
    const { entries, ...scheduleData } = dto;

    const schedule = await this.prisma.examSchedule.create({
      data: {
        name: scheduleData.name,
        type: scheduleData.type,
        classId: scheduleData.classId,
        academicSessionId: scheduleData.academicSessionId,
        startDate: new Date(scheduleData.startDate),
        endDate: new Date(scheduleData.endDate),
        status: scheduleData.status ?? 'UPCOMING',
        entries: entries && entries.length > 0
          ? {
              create: entries.map((entry) => ({
                subjectId: entry.subjectId,
                date: new Date(entry.date),
                startTime: entry.startTime,
                endTime: entry.endTime,
                room: entry.room,
                invigilatorId: entry.invigilatorId,
              })),
            }
          : undefined,
      },
      include: {
        entries: {
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    return schedule;
  }

  /**
   * Update schedule metadata (name, type, dates, status).
   */
  async update(id: string, dto: UpdateExamScheduleDto) {
    await this.findOne(id);

    return this.prisma.examSchedule.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        entries: {
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
  }

  /**
   * Delete an exam schedule (cascades to entries).
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.examSchedule.delete({ where: { id } });
  }

  /**
   * Add a single entry to an existing schedule.
   */
  async addEntry(scheduleId: string, dto: CreateExamScheduleEntryDto) {
    await this.findOne(scheduleId);

    return this.prisma.examScheduleEntry.create({
      data: {
        scheduleId,
        subjectId: dto.subjectId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
        invigilatorId: dto.invigilatorId,
      },
    });
  }

  /**
   * Remove an entry from a schedule.
   */
  async removeEntry(scheduleId: string, entryId: string) {
    const entry = await this.prisma.examScheduleEntry.findFirst({
      where: { id: entryId, scheduleId },
    });

    if (!entry) {
      throw new NotFoundException(`Entry ${entryId} not found in schedule ${scheduleId}`);
    }

    return this.prisma.examScheduleEntry.delete({ where: { id: entryId } });
  }
}

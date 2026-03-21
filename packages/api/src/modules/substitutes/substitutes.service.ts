import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubstituteDto } from './dto/create-substitute.dto';

@Injectable()
export class SubstitutesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubstituteDto, assignedBy: string) {
    return this.prisma.substituteAssignment.create({
      data: {
        originalTeacherId: dto.originalTeacherId,
        substituteTeacherId: dto.substituteTeacherId,
        date: new Date(dto.date),
        timetableSlotId: dto.timetableSlotId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        reason: dto.reason,
        assignedBy,
        status: 'ASSIGNED',
      },
    });
  }

  async findAll(filters: { date?: string; teacherId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.date) {
      where['date'] = new Date(filters.date);
    }
    if (filters.teacherId) {
      where['OR'] = [
        { originalTeacherId: filters.teacherId },
        { substituteTeacherId: filters.teacherId },
      ];
    }
    return this.prisma.substituteAssignment.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updateStatus(id: string, status: string) {
    const assignment = await this.prisma.substituteAssignment.findUnique({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Substitute assignment ${id} not found`);
    }
    return this.prisma.substituteAssignment.update({
      where: { id },
      data: { status },
    });
  }

  async accept(id: string) {
    return this.updateStatus(id, 'ACCEPTED');
  }

  async complete(id: string) {
    return this.updateStatus(id, 'COMPLETED');
  }

  async cancel(id: string) {
    return this.updateStatus(id, 'CANCELLED');
  }

  /**
   * Find teachers who are free during a given time period on a given date.
   * A teacher is considered "busy" if they have a substitute assignment on that date
   * that overlaps (simple check: same date).
   * For a proper implementation this would cross-reference TimetableSlots.
   */
  async getSuggestedSubstitutes(date: string, startTime: string, endTime: string) {
    // Get all teachers (users with SUBJECT_TEACHER or CLASS_TEACHER role)
    const teachers = await this.prisma.user.findMany({
      where: {
        role: { in: ['SUBJECT_TEACHER', 'CLASS_TEACHER', 'ACADEMIC_COORDINATOR'] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    // Get all substitute assignments for that date (busy teachers)
    const busyAssignments = await this.prisma.substituteAssignment.findMany({
      where: {
        date: new Date(date),
        status: { in: ['ASSIGNED', 'ACCEPTED'] },
      },
      select: { substituteTeacherId: true },
    });

    const busyTeacherIds = new Set(busyAssignments.map((a) => a.substituteTeacherId));

    // Return teachers not already assigned as substitutes on that date
    const freeTeachers = teachers.filter((t) => !busyTeacherIds.has(t.id));

    return {
      date,
      startTime,
      endTime,
      suggestedSubstitutes: freeTeachers,
    };
  }
}

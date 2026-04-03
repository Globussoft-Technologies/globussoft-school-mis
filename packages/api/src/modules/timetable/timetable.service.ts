import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async findByClassSection(classId: string, sectionId: string) {
    return this.prisma.timetable.findFirst({
      where: {
        classId,
        sectionId,
        effectiveTo: null,
      },
      include: {
        slots: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
  }

  async findById(id: string) {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        slots: {
          include: { subject: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    if (!timetable) throw new NotFoundException('Timetable not found');
    return timetable;
  }

  async updateSlot(
    slotId: string,
    data: {
      subjectId?: string | null;
      teacherId?: string | null;
      room?: string | null;
      type?: string;
    },
  ) {
    const slot = await this.prisma.timetableSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException('Timetable slot not found');

    return this.prisma.timetableSlot.update({
      where: { id: slotId },
      data: {
        subjectId: data.subjectId !== undefined ? data.subjectId : undefined,
        teacherId: data.teacherId !== undefined ? data.teacherId : undefined,
        room: data.room !== undefined ? data.room : undefined,
        type: data.type ?? undefined,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async deleteTimetable(id: string) {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id },
    });
    if (!timetable) throw new NotFoundException('Timetable not found');

    // Slots are cascade-deleted via the relation onDelete: Cascade
    await this.prisma.timetable.delete({ where: { id } });
    return { deleted: true, id };
  }

  async getTeacherSubjects(classId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: { classId },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return subjects;
  }

  async saveTeacherSubjects(
    assignments: { subjectId: string; teacherId: string }[],
  ) {
    // Upsert each assignment
    const results = [];
    for (const a of assignments) {
      const result = await this.prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: a.teacherId,
            subjectId: a.subjectId,
          },
        },
        update: {},
        create: { teacherId: a.teacherId, subjectId: a.subjectId },
      });
      results.push(result);
    }
    return results;
  }
}

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
          include: { subject: { select: { id: true, name: true, code: true } } },
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
}

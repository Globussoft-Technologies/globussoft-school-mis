import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiaryService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    studentId?: string;
    classId?: string;
    sectionId?: string;
    date: string;
    type: string;
    subject?: string;
    content: string;
    createdBy: string;
    isPublished?: boolean;
  }) {
    return this.prisma.diaryEntry.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        sectionId: data.sectionId,
        date: new Date(data.date),
        type: data.type,
        subject: data.subject,
        content: data.content,
        createdBy: data.createdBy,
        isPublished: data.isPublished ?? true,
      },
    });
  }

  async getByClassAndDate(classId: string, date: string, sectionId?: string) {
    const where: Record<string, unknown> = {
      classId,
      date: new Date(date),
      isPublished: true,
    };
    if (sectionId) where.sectionId = sectionId;

    return this.prisma.diaryEntry.findMany({
      where,
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getByStudent(studentId: string, date?: string) {
    const where: Record<string, unknown> = { studentId };
    if (date) where.date = new Date(date);

    return this.prisma.diaryEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { type: 'asc' }],
    });
  }

  async getByDate(date: string, classId?: string, sectionId?: string) {
    const where: Record<string, unknown> = {
      date: new Date(date),
      isPublished: true,
    };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;

    return this.prisma.diaryEntry.findMany({
      where,
      orderBy: [{ classId: 'asc' }, { type: 'asc' }],
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.diaryEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Diary entry not found');
    return entry;
  }

  async update(
    id: string,
    data: {
      type?: string;
      subject?: string;
      content?: string;
      isPublished?: boolean;
    },
  ) {
    await this.findOne(id);
    return this.prisma.diaryEntry.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.diaryEntry.delete({ where: { id } });
  }
}

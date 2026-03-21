import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SyllabusService {
  constructor(private prisma: PrismaService) {}

  async findAll(classId?: string, academicSessionId?: string) {
    return this.prisma.syllabus.findMany({
      where: {
        ...(classId && { classId }),
        ...(academicSessionId && { academicSessionId }),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, grade: true } },
        chapters: {
          include: { topics: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findById(id: string) {
    const syllabus = await this.prisma.syllabus.findUnique({
      where: { id },
      include: {
        subject: true,
        class: true,
        chapters: {
          include: { topics: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!syllabus) throw new NotFoundException('Syllabus not found');
    return syllabus;
  }

  async create(data: { subjectId: string; classId: string; academicSessionId: string; chapters?: { title: string; estimatedHours?: number; topics?: { title: string; estimatedMinutes?: number }[] }[] }) {
    const syllabus = await this.prisma.syllabus.create({
      data: { subjectId: data.subjectId, classId: data.classId, academicSessionId: data.academicSessionId },
    });

    if (data.chapters) {
      for (const [ci, ch] of data.chapters.entries()) {
        const chapter = await this.prisma.chapter.create({
          data: { syllabusId: syllabus.id, title: ch.title, orderIndex: ci + 1, estimatedHours: ch.estimatedHours || 0 },
        });
        if (ch.topics) {
          for (const [ti, topic] of ch.topics.entries()) {
            await this.prisma.topic.create({
              data: { chapterId: chapter.id, title: topic.title, orderIndex: ti + 1, estimatedMinutes: topic.estimatedMinutes || 45 },
            });
          }
        }
      }
    }

    return this.findById(syllabus.id);
  }

  async addChapter(syllabusId: string, data: { title: string; estimatedHours?: number }) {
    const syllabus = await this.prisma.syllabus.findUnique({ where: { id: syllabusId }, include: { chapters: true } });
    if (!syllabus) throw new NotFoundException('Syllabus not found');
    const orderIndex = (syllabus.chapters?.length || 0) + 1;
    return this.prisma.chapter.create({
      data: { syllabusId, title: data.title, orderIndex, estimatedHours: data.estimatedHours || 0 },
      include: { topics: true },
    });
  }

  async updateChapter(chapterId: string, data: { title?: string; estimatedHours?: number }) {
    return this.prisma.chapter.update({ where: { id: chapterId }, data });
  }

  async deleteChapter(chapterId: string) {
    await this.prisma.topic.deleteMany({ where: { chapterId } });
    return this.prisma.chapter.delete({ where: { id: chapterId } });
  }

  async addTopic(chapterId: string, data: { title: string; estimatedMinutes?: number }) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId }, include: { topics: true } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    const orderIndex = (chapter.topics?.length || 0) + 1;
    return this.prisma.topic.create({
      data: { chapterId, title: data.title, orderIndex, estimatedMinutes: data.estimatedMinutes || 45 },
    });
  }

  async updateTopic(topicId: string, data: { title?: string; estimatedMinutes?: number }) {
    return this.prisma.topic.update({ where: { id: topicId }, data });
  }

  async deleteTopic(topicId: string) {
    return this.prisma.topic.delete({ where: { id: topicId } });
  }

  async deleteSyllabus(id: string) {
    const syllabus = await this.prisma.syllabus.findUnique({ where: { id }, include: { chapters: { include: { topics: true } } } });
    if (!syllabus) throw new NotFoundException('Syllabus not found');
    for (const ch of syllabus.chapters) {
      await this.prisma.topic.deleteMany({ where: { chapterId: ch.id } });
    }
    await this.prisma.chapter.deleteMany({ where: { syllabusId: id } });
    return this.prisma.syllabus.delete({ where: { id } });
  }
}

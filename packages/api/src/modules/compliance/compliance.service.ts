import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordDeliveryDto } from './dto/record-delivery.dto';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  async recordDelivery(dto: RecordDeliveryDto, teacherId: string) {
    // Update lesson plan status to DELIVERED
    await this.prisma.lessonPlan.update({
      where: { id: dto.lessonPlanId },
      data: { status: 'DELIVERED' },
    });

    return this.prisma.lessonDelivery.create({
      data: { ...dto, teacherId },
      include: { lessonPlan: { include: { topic: true, chapter: true } } },
    });
  }

  async getDeliveries(filters: { teacherId?: string; startDate?: string; endDate?: string }) {
    return this.prisma.lessonDelivery.findMany({
      where: {
        ...(filters.teacherId && { teacherId: filters.teacherId }),
        ...(filters.startDate && filters.endDate && {
          deliveredAt: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        }),
      },
      include: {
        lessonPlan: { include: { topic: { select: { title: true } }, chapter: { select: { title: true } } } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async getComplianceReport(classId: string, academicSessionId: string) {
    const syllabi = await this.prisma.syllabus.findMany({
      where: { classId, academicSessionId },
      include: {
        subject: { select: { name: true } },
        chapters: {
          include: {
            topics: true,
            lessonPlans: {
              include: { deliveries: true },
            },
          },
        },
      },
    });

    return syllabi.map((s) => {
      const totalTopics = s.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
      const deliveredTopics = s.chapters.reduce(
        (sum, ch) => sum + ch.lessonPlans.filter((lp) => lp.status === 'DELIVERED').length,
        0,
      );
      return {
        subjectName: s.subject.name,
        totalTopics,
        deliveredTopics,
        completionPercent: totalTopics > 0 ? Math.round((deliveredTopics / totalTopics) * 100) : 0,
        chapters: s.chapters.map((ch) => ({
          title: ch.title,
          totalTopics: ch.topics.length,
          delivered: ch.lessonPlans.filter((lp) => lp.status === 'DELIVERED').length,
        })),
      };
    });
  }
}

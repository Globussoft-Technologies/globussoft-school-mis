import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: string;
    fromUserId: string;
    toUserId?: string;
    subjectId?: string;
    classId?: string;
    rating: number;
    comment?: string;
    isAnonymous?: boolean;
    academicSessionId?: string;
  }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.feedback.create({
      data: {
        type: data.type,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        subjectId: data.subjectId,
        classId: data.classId,
        rating: data.rating,
        comment: data.comment,
        isAnonymous: data.isAnonymous ?? false,
        academicSessionId: data.academicSessionId,
      },
    });
  }

  async findAll(filters: {
    type?: string;
    toUserId?: string;
    classId?: string;
    fromUserId?: string;
    academicSessionId?: string;
  }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.toUserId) where.toUserId = filters.toUserId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.fromUserId) where.fromUserId = filters.fromUserId;
    if (filters.academicSessionId) where.academicSessionId = filters.academicSessionId;

    return this.prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeacherRatings(teacherId: string) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: { toUserId: teacherId, type: 'TEACHER_FEEDBACK' },
    });

    const count = feedbacks.length;
    const avgRating =
      count > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / count
        : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const f of feedbacks) {
      distribution[f.rating] = (distribution[f.rating] || 0) + 1;
    }

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return {
      teacher,
      count,
      avgRating: Math.round(avgRating * 100) / 100,
      distribution,
      feedbacks: feedbacks.map((f) => ({
        ...f,
        fromUserId: f.isAnonymous ? null : f.fromUserId,
      })),
    };
  }

  async getSubjectFeedback(subjectId: string) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: { subjectId, type: 'COURSE_FEEDBACK' },
      orderBy: { createdAt: 'desc' },
    });

    const count = feedbacks.length;
    const avgRating =
      count > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / count
        : 0;

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, code: true },
    });

    return {
      subject,
      count,
      avgRating: Math.round(avgRating * 100) / 100,
      feedbacks: feedbacks.map((f) => ({
        ...f,
        fromUserId: f.isAnonymous ? null : f.fromUserId,
      })),
    };
  }

  async getFeedbackSummary(academicSessionId?: string) {
    const where: any = {};
    if (academicSessionId) where.academicSessionId = academicSessionId;

    const all = await this.prisma.feedback.findMany({ where });

    const byType: Record<string, { count: number; avgRating: number }> = {};
    for (const f of all) {
      if (!byType[f.type]) byType[f.type] = { count: 0, avgRating: 0 };
      byType[f.type].count += 1;
      byType[f.type].avgRating += f.rating;
    }

    for (const type in byType) {
      byType[type].avgRating =
        Math.round((byType[type].avgRating / byType[type].count) * 100) / 100;
    }

    const overallAvg =
      all.length > 0
        ? Math.round((all.reduce((s, f) => s + f.rating, 0) / all.length) * 100) / 100
        : 0;

    return {
      total: all.length,
      overallAvgRating: overallAvg,
      byType,
    };
  }
}

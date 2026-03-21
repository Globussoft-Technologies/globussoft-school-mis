import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RubricsService {
  constructor(private prisma: PrismaService) {}

  async createRubric(dto: {
    title: string;
    description?: string;
    subjectId?: string;
    type?: string;
    maxScore?: number;
    createdBy: string;
    schoolId: string;
    criteria?: {
      title: string;
      description?: string;
      maxPoints: number;
      orderIndex: number;
      levels?: {
        title: string;
        description?: string;
        points: number;
        orderIndex: number;
      }[];
    }[];
  }) {
    const { criteria, ...rubricData } = dto;
    return this.prisma.rubric.create({
      data: {
        ...rubricData,
        criteria: criteria && criteria.length > 0
          ? {
              create: criteria.map(({ levels, ...criterion }) => ({
                ...criterion,
                levels: levels && levels.length > 0
                  ? { create: levels }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        criteria: {
          include: { levels: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async getRubrics(filters: { schoolId?: string; subjectId?: string }) {
    return this.prisma.rubric.findMany({
      where: {
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
      },
      include: {
        criteria: {
          include: { levels: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { criteria: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRubricById(id: string) {
    const rubric = await this.prisma.rubric.findUnique({
      where: { id },
      include: {
        criteria: {
          include: { levels: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!rubric) throw new NotFoundException('Rubric not found');
    return rubric;
  }

  async assessWithRubric(rubricId: string, dto: {
    studentId: string;
    assessmentId?: string;
    assignmentId?: string;
    scores: { criterionId: string; levelId: string; points: number; comment?: string }[];
    feedback?: string;
    assessedBy: string;
  }) {
    const totalScore = dto.scores.reduce((sum, s) => sum + s.points, 0);
    return this.prisma.rubricAssessment.create({
      data: {
        rubricId,
        studentId: dto.studentId,
        assessmentId: dto.assessmentId,
        assignmentId: dto.assignmentId,
        scores: dto.scores,
        totalScore,
        feedback: dto.feedback,
        assessedBy: dto.assessedBy,
      },
    });
  }

  async getRubricResults(rubricId: string) {
    const assessments = await this.prisma.rubricAssessment.findMany({
      where: { rubricId },
      orderBy: { createdAt: 'desc' },
    });

    const rubric = await this.getRubricById(rubricId);

    const avgScore = assessments.length > 0
      ? assessments.reduce((s, a) => s + (a.totalScore || 0), 0) / assessments.length
      : 0;

    return {
      rubric,
      assessments,
      summary: {
        total: assessments.length,
        averageScore: Math.round(avgScore * 100) / 100,
        maxScore: rubric.maxScore,
      },
    };
  }

  async getStudentRubricAssessments(studentId: string) {
    return this.prisma.rubricAssessment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LearningPathsService {
  constructor(private prisma: PrismaService) {}

  async createPath(dto: {
    title: string;
    description?: string;
    subjectId?: string;
    classId?: string;
    difficulty?: string;
    estimatedHours?: number;
    schoolId: string;
    createdBy: string;
    steps?: {
      title: string;
      type: string;
      resourceId?: string;
      resourceUrl?: string;
      description?: string;
      orderIndex: number;
      isOptional?: boolean;
      estimatedMinutes?: number;
    }[];
  }) {
    const { steps, ...pathData } = dto;
    const path = await this.prisma.learningPath.create({
      data: {
        ...pathData,
        steps: steps && steps.length > 0
          ? { create: steps }
          : undefined,
      },
      include: { steps: { orderBy: { orderIndex: 'asc' } } },
    });
    return path;
  }

  async getPaths(filters: { schoolId?: string; classId?: string; subjectId?: string; isPublished?: string }) {
    return this.prisma.learningPath.findMany({
      where: {
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.isPublished !== undefined && { isPublished: filters.isPublished === 'true' }),
      },
      include: {
        steps: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { enrollments: true, steps: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPathDetail(id: string, studentId?: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!path) throw new NotFoundException('Learning path not found');

    let enrollment = null;
    if (studentId) {
      enrollment = await this.prisma.learningPathEnrollment.findUnique({
        where: { pathId_studentId: { pathId: id, studentId } },
      });
    }

    return { ...path, enrollment };
  }

  async enroll(pathId: string, studentId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: { steps: true },
    });
    if (!path) throw new NotFoundException('Learning path not found');

    const existing = await this.prisma.learningPathEnrollment.findUnique({
      where: { pathId_studentId: { pathId, studentId } },
    });
    if (existing) throw new BadRequestException('Already enrolled in this path');

    return this.prisma.learningPathEnrollment.create({
      data: {
        pathId,
        studentId,
        totalSteps: path.steps.length,
        currentStep: 0,
        completedSteps: 0,
        status: 'ENROLLED',
      },
    });
  }

  async advanceStep(pathId: string, studentId: string) {
    const enrollment = await this.prisma.learningPathEnrollment.findUnique({
      where: { pathId_studentId: { pathId, studentId } },
    });
    if (!enrollment) throw new NotFoundException('Not enrolled in this path');
    if (enrollment.status === 'COMPLETED') throw new BadRequestException('Path already completed');

    const newStep = enrollment.currentStep + 1;
    const newCompleted = enrollment.completedSteps + 1;
    const isComplete = newCompleted >= enrollment.totalSteps;

    return this.prisma.learningPathEnrollment.update({
      where: { pathId_studentId: { pathId, studentId } },
      data: {
        currentStep: newStep,
        completedSteps: newCompleted,
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        lastAccessedAt: new Date(),
        ...(isComplete && { completedAt: new Date() }),
      },
    });
  }

  async completeStep(pathId: string, studentId: string, stepIndex: number) {
    const enrollment = await this.prisma.learningPathEnrollment.findUnique({
      where: { pathId_studentId: { pathId, studentId } },
    });
    if (!enrollment) throw new NotFoundException('Not enrolled in this path');

    const isComplete = stepIndex + 1 >= enrollment.totalSteps;
    return this.prisma.learningPathEnrollment.update({
      where: { pathId_studentId: { pathId, studentId } },
      data: {
        currentStep: stepIndex + 1,
        completedSteps: stepIndex + 1,
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        lastAccessedAt: new Date(),
        ...(isComplete && { completedAt: new Date() }),
      },
    });
  }

  async getStudentPaths(studentId: string) {
    return this.prisma.learningPathEnrollment.findMany({
      where: { studentId },
      include: {
        path: {
          include: {
            steps: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getRecommendedPaths(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const enrolledPathIds = await this.prisma.learningPathEnrollment.findMany({
      where: { studentId },
      select: { pathId: true },
    });
    const enrolledIds = enrolledPathIds.map((e) => e.pathId);

    return this.prisma.learningPath.findMany({
      where: {
        classId: student.classId,
        isPublished: true,
        id: { notIn: enrolledIds },
      },
      include: {
        steps: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { enrollments: true } },
      },
      take: 6,
    });
  }

  async publishPath(id: string, isPublished: boolean) {
    return this.prisma.learningPath.update({
      where: { id },
      data: { isPublished },
    });
  }
}

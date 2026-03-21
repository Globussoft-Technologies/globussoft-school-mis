import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateGraceMarkDto {
  studentId: string;
  subjectId: string;
  assessmentId?: string;
  marks: number;
  reason: string;
  approvedBy: string;
  term?: string;
}

@Injectable()
export class GraceMarksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGraceMarkDto) {
    return this.prisma.graceMark.create({ data: dto });
  }

  async findAll(filters: { studentId?: string; subjectId?: string }) {
    return this.prisma.graceMark.findMany({
      where: {
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentGraceMarks(studentId: string) {
    return this.prisma.graceMark.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculateAdjustedScore(studentId: string, subjectId: string) {
    // Get all grades for this student/subject
    const grades = await this.prisma.grade.findMany({
      where: { studentId, subjectId },
      include: { assessment: { select: { title: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Get all grace marks for this student/subject
    const graceMarks = await this.prisma.graceMark.findMany({
      where: { studentId, subjectId },
    });

    const totalGrace = graceMarks.reduce((sum, g) => sum + g.marks, 0);

    const adjustedGrades = grades.map((g) => ({
      ...g,
      adjustedMarks: g.marksObtained + totalGrace,
      adjustedPercentage: ((g.marksObtained + totalGrace) / g.maxMarks) * 100,
    }));

    return {
      studentId,
      subjectId,
      totalGraceMarks: totalGrace,
      graceEntries: graceMarks,
      grades: adjustedGrades,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';

@Injectable()
export class GradingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGradeDto, gradedBy: string) {
    const percentage = (dto.marksObtained / dto.maxMarks) * 100;
    const gradeLabel = this.calculateGrade(percentage);

    return this.prisma.grade.create({
      data: {
        ...dto,
        percentage,
        gradeLabel,
        gradedBy,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        subject: { select: { name: true } },
      },
    });
  }

  async bulkCreate(grades: CreateGradeDto[], gradedBy: string) {
    const results = [];
    for (const dto of grades) {
      const result = await this.create(dto, gradedBy);
      results.push(result);
    }
    return results;
  }

  async getStudentGrades(studentId: string, subjectId?: string) {
    return this.prisma.grade.findMany({
      where: {
        studentId,
        ...(subjectId && { subjectId }),
      },
      include: {
        subject: { select: { name: true, code: true } },
        assessment: { select: { title: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClassGrades(classId: string, subjectId: string, assessmentId?: string) {
    return this.prisma.grade.findMany({
      where: {
        subjectId,
        student: { classId },
        ...(assessmentId && { assessmentId }),
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { percentage: 'desc' },
    });
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E';
  }
}

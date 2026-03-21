import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const REMEDIAL_THRESHOLD = 40; // percent

@Injectable()
export class RemedialService {
  constructor(private prisma: PrismaService) {}

  async checkAndEnroll(assessmentId: string) {
    // Find all grades for this assessment where percentage < 40%
    const grades = await this.prisma.grade.findMany({
      where: { assessmentId },
      include: {
        student: { select: { id: true } },
        subject: { select: { id: true } },
      },
    });

    const enrolled: string[] = [];
    for (const grade of grades) {
      const percentage = (grade.marksObtained / grade.maxMarks) * 100;
      if (percentage < REMEDIAL_THRESHOLD) {
        // Check if already enrolled for this assessment
        const existing = await this.prisma.remedialEnrollment.findFirst({
          where: { studentId: grade.studentId, assessmentId },
        });
        if (!existing) {
          await this.prisma.remedialEnrollment.create({
            data: {
              studentId: grade.studentId,
              subjectId: grade.subjectId,
              assessmentId,
              originalScore: grade.marksObtained,
              maxMarks: grade.maxMarks,
              status: 'ENROLLED',
            },
          });
          enrolled.push(grade.studentId);
        }
      }
    }

    return {
      assessmentId,
      totalChecked: grades.length,
      enrolled: enrolled.length,
      enrolledStudents: enrolled,
    };
  }

  async getEnrollments(filters: {
    studentId?: string;
    subjectId?: string;
    status?: string;
  }) {
    return this.prisma.remedialEnrollment.findMany({
      where: {
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.status && { status: filters.status }),
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async recordRemedialScore(
    enrollmentId: string,
    score: number,
    maxMarks: number,
    remarks?: string,
  ) {
    const enrollment = await this.prisma.remedialEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) {
      throw new NotFoundException(`RemedialEnrollment ${enrollmentId} not found`);
    }
    return this.prisma.remedialEnrollment.update({
      where: { id: enrollmentId },
      data: {
        remedialScore: score,
        remedialMaxMarks: maxMarks,
        status: 'COMPLETED',
        completedAt: new Date(),
        remarks,
      },
    });
  }

  async getStudentRemedials(studentId: string) {
    const enrollments = await this.prisma.remedialEnrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => {
      const originalPct = (e.originalScore / e.maxMarks) * 100;
      const remedialPct =
        e.remedialScore != null && e.remedialMaxMarks != null
          ? (e.remedialScore / e.remedialMaxMarks) * 100
          : null;
      const improvementDelta =
        remedialPct != null ? +(remedialPct - originalPct).toFixed(2) : null;
      return { ...e, originalPercentage: +originalPct.toFixed(2), remedialPercentage: remedialPct != null ? +remedialPct.toFixed(2) : null, improvementDelta };
    });
  }

  async getSubjectRemedials(subjectId: string) {
    const enrollments = await this.prisma.remedialEnrollment.findMany({
      where: { subjectId },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => {
      const originalPct = (e.originalScore / e.maxMarks) * 100;
      const remedialPct =
        e.remedialScore != null && e.remedialMaxMarks != null
          ? (e.remedialScore / e.remedialMaxMarks) * 100
          : null;
      const improvementDelta =
        remedialPct != null ? +(remedialPct - originalPct).toFixed(2) : null;
      return { ...e, originalPercentage: +originalPct.toFixed(2), remedialPercentage: remedialPct != null ? +remedialPct.toFixed(2) : null, improvementDelta };
    });
  }
}

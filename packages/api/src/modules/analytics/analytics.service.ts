import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStudentPerformance(studentId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true, code: true } },
        assessment: { select: { title: true, type: true, tier: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by subject
    const bySubject = new Map<string, { grades: typeof grades; total: number; obtained: number }>();
    for (const g of grades) {
      const key = g.subject.name;
      const entry = bySubject.get(key) || { grades: [], total: 0, obtained: 0 };
      entry.grades.push(g);
      entry.total += g.maxMarks;
      entry.obtained += g.marksObtained;
      bySubject.set(key, entry);
    }

    const subjectPerformance = Array.from(bySubject.entries()).map(([subject, data]) => ({
      subject,
      percentage: data.total > 0 ? Math.round((data.obtained / data.total) * 100 * 10) / 10 : 0,
      totalAssessments: data.grades.length,
      trend: data.grades.map((g) => ({
        date: g.createdAt,
        percentage: g.percentage,
        type: g.assessment?.type || g.type,
      })),
    }));

    // Attendance correlation
    const attendance = await this.prisma.attendance.findMany({
      where: { studentId },
    });
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => ['PRESENT', 'LATE'].includes(a.status)).length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      studentId,
      subjectPerformance,
      overallPercentage: grades.length > 0
        ? Math.round(grades.reduce((s, g) => s + (g.percentage || 0), 0) / grades.length * 10) / 10
        : 0,
      attendancePercent,
      totalAssessments: grades.length,
    };
  }

  async getClassAnalytics(classId: string, subjectId?: string) {
    const students = await this.prisma.student.findMany({
      where: { classId, isActive: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
        grades: {
          where: subjectId ? { subjectId } : undefined,
          include: { subject: { select: { name: true } } },
        },
      },
    });

    const studentStats = students.map((s) => {
      const totalMarks = s.grades.reduce((sum, g) => sum + g.maxMarks, 0);
      const obtained = s.grades.reduce((sum, g) => sum + g.marksObtained, 0);
      return {
        studentId: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        percentage: totalMarks > 0 ? Math.round((obtained / totalMarks) * 100 * 10) / 10 : 0,
        assessmentCount: s.grades.length,
      };
    });

    studentStats.sort((a, b) => b.percentage - a.percentage);

    const percentages = studentStats.map((s) => s.percentage).filter((p) => p > 0);
    const avg = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
    const stdDev = percentages.length > 0
      ? Math.sqrt(percentages.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / percentages.length)
      : 0;

    return {
      classId,
      totalStudents: students.length,
      classAverage: Math.round(avg * 10) / 10,
      standardDeviation: Math.round(stdDev * 10) / 10,
      highest: percentages[0] || 0,
      lowest: percentages[percentages.length - 1] || 0,
      gradeDistribution: this.getGradeDistribution(percentages),
      students: studentStats,
    };
  }

  async getWeakStudents(classId: string, threshold: number = 60) {
    const analytics = await this.getClassAnalytics(classId);
    return {
      classId,
      threshold,
      atRiskStudents: analytics.students.filter((s) => s.percentage > 0 && s.percentage < threshold),
      count: analytics.students.filter((s) => s.percentage > 0 && s.percentage < threshold).length,
    };
  }

  async getComplianceVsPerformance(schoolId: string) {
    const teachers = await this.prisma.user.findMany({
      where: { schoolId, role: { in: ['CLASS_TEACHER', 'SUBJECT_TEACHER'] } },
      select: { id: true, firstName: true, lastName: true },
    });

    const results = [];
    for (const teacher of teachers) {
      const totalPlans = await this.prisma.lessonPlan.count({ where: { teacherId: teacher.id } });
      const delivered = await this.prisma.lessonPlan.count({
        where: { teacherId: teacher.id, status: 'DELIVERED' },
      });
      const complianceScore = totalPlans > 0 ? Math.round((delivered / totalPlans) * 100) : 0;

      results.push({
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        complianceScore,
        totalPlans,
        delivered,
      });
    }

    return results;
  }

  private getGradeDistribution(percentages: number[]) {
    return {
      A1: percentages.filter((p) => p >= 91).length,
      A2: percentages.filter((p) => p >= 81 && p < 91).length,
      B1: percentages.filter((p) => p >= 71 && p < 81).length,
      B2: percentages.filter((p) => p >= 61 && p < 71).length,
      C1: percentages.filter((p) => p >= 51 && p < 61).length,
      C2: percentages.filter((p) => p >= 41 && p < 51).length,
      D: percentages.filter((p) => p >= 33 && p < 41).length,
      E: percentages.filter((p) => p < 33).length,
    };
  }
}

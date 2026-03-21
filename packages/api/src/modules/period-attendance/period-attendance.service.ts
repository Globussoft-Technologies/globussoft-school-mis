import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface MarkRecord {
  studentId: string;
  date: string;
  period: number;
  subjectId?: string;
  status: string;
  remarks?: string;
}

@Injectable()
export class PeriodAttendanceService {
  constructor(private prisma: PrismaService) {}

  async markPeriodAttendance(records: MarkRecord[], teacherId: string) {
    const operations = records.map((r) =>
      this.prisma.periodAttendance.upsert({
        where: {
          studentId_date_period: {
            studentId: r.studentId,
            date: new Date(r.date),
            period: r.period,
          },
        },
        update: {
          status: r.status,
          teacherId,
          subjectId: r.subjectId ?? null,
          remarks: r.remarks ?? null,
        },
        create: {
          studentId: r.studentId,
          date: new Date(r.date),
          period: r.period,
          subjectId: r.subjectId ?? null,
          teacherId,
          status: r.status,
          remarks: r.remarks ?? null,
        },
      }),
    );
    return this.prisma.$transaction(operations);
  }

  async getPeriodAttendance(classId: string, sectionId: string, date: string, period?: number) {
    // Get student IDs for the class/section
    const students = await this.prisma.student.findMany({
      where: { classId, sectionId, isActive: true },
      select: { id: true, admissionNo: true, rollNo: true, user: { select: { firstName: true, lastName: true } } },
    });
    const studentIds = students.map((s) => s.id);

    const records = await this.prisma.periodAttendance.findMany({
      where: {
        date: new Date(date),
        studentId: { in: studentIds },
        ...(period !== undefined && { period }),
      },
      orderBy: [{ period: 'asc' }],
    });

    // Merge student info with attendance
    return records.map((r) => {
      const student = students.find((s) => s.id === r.studentId);
      return {
        ...r,
        studentName: student ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown',
        rollNo: student?.rollNo,
        admissionNo: student?.admissionNo,
      };
    });
  }

  async getStudentPeriodAttendance(studentId: string, date: string) {
    return this.prisma.periodAttendance.findMany({
      where: { studentId, date: new Date(date) },
      orderBy: { period: 'asc' },
    });
  }

  async getAbsentStudents(date: string, period?: number) {
    const records = await this.prisma.periodAttendance.findMany({
      where: {
        date: new Date(date),
        status: 'ABSENT',
        ...(period !== undefined && { period }),
      },
      orderBy: [{ period: 'asc' }],
    });

    // Get student details
    const studentIds = [...new Set(records.map((r) => r.studentId))];
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
    });

    const studentMap = new Map(students.map((s) => [s.id, s]));
    return records.map((r) => {
      const s = studentMap.get(r.studentId);
      return {
        ...r,
        studentName: s ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown',
        className: s?.class.name,
        sectionName: s?.section.name,
        phone: s?.user.phone,
      };
    });
  }

  async getPeriodSummary(classId: string, sectionId: string, startDate: string, endDate: string) {
    const students = await this.prisma.student.findMany({
      where: { classId, sectionId, isActive: true },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    });
    const studentIds = students.map((s) => s.id);

    const records = await this.prisma.periodAttendance.findMany({
      where: {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
        studentId: { in: studentIds },
      },
    });

    // Group by period
    const periodMap: Record<number, { total: number; present: number; absent: number; late: number }> = {};
    for (const r of records) {
      if (!periodMap[r.period]) periodMap[r.period] = { total: 0, present: 0, absent: 0, late: 0 };
      periodMap[r.period].total++;
      if (r.status === 'PRESENT') periodMap[r.period].present++;
      else if (r.status === 'ABSENT') periodMap[r.period].absent++;
      else if (r.status === 'LATE') periodMap[r.period].late++;
    }

    // Group by student
    const studentNameMap = new Map(students.map((s) => [s.id, `${s.user.firstName} ${s.user.lastName}`]));
    const studentSummary: Record<string, { studentId: string; name: string; presentCount: number; totalCount: number }> = {};
    for (const r of records) {
      if (!studentSummary[r.studentId]) {
        studentSummary[r.studentId] = { studentId: r.studentId, name: studentNameMap.get(r.studentId) || '', presentCount: 0, totalCount: 0 };
      }
      studentSummary[r.studentId].totalCount++;
      if (r.status === 'PRESENT' || r.status === 'LATE') studentSummary[r.studentId].presentCount++;
    }

    return {
      periodSummary: Object.entries(periodMap).map(([period, stats]) => ({
        period: Number(period), ...stats,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      })),
      studentSummary: Object.values(studentSummary),
    };
  }
}

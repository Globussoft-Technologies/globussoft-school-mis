import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PerformanceReportService {
  constructor(private prisma: PrismaService) {}

  async generateReport(studentId: string, academicSessionId?: string) {
    // 1. Fetch student profile
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
        academicSession: { select: { id: true, name: true } },
        guardians: { select: { name: true, relation: true, phone: true }, take: 1 },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const sessionId = academicSessionId ?? student.academicSessionId;

    // 2. Fetch grades grouped by subject
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by subject and compute subject-wise performance
    const subjectMap: Record<string, {
      subjectId: string;
      subjectName: string;
      subjectCode: string;
      totalObtained: number;
      totalMax: number;
      grades: Array<{ type: string; obtained: number; max: number; label?: string }>;
    }> = {};

    for (const grade of grades) {
      const sid = grade.subjectId;
      if (!subjectMap[sid]) {
        subjectMap[sid] = {
          subjectId: sid,
          subjectName: grade.subject.name,
          subjectCode: grade.subject.code,
          totalObtained: 0,
          totalMax: 0,
          grades: [],
        };
      }
      subjectMap[sid].totalObtained += grade.marksObtained;
      subjectMap[sid].totalMax += grade.maxMarks;
      subjectMap[sid].grades.push({
        type: grade.type,
        obtained: grade.marksObtained,
        max: grade.maxMarks,
        label: grade.gradeLabel ?? undefined,
      });
    }

    const subjectPerformance = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage: s.totalMax > 0 ? Math.round((s.totalObtained / s.totalMax) * 10000) / 100 : 0,
      gradeLabel: this.computeGradeLabel(s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0),
    }));

    // 3. Overall percentage
    const totalObtained = subjectPerformance.reduce((sum, s) => sum + s.totalObtained, 0);
    const totalMax = subjectPerformance.reduce((sum, s) => sum + s.totalMax, 0);
    const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;
    const overallGrade = this.computeGradeLabel(overallPercentage);

    // 4. Fetch attendance summary
    const attendances = await this.prisma.attendance.findMany({
      where: { studentId },
      select: { status: true, date: true },
    });
    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
    const absentDays = attendances.filter((a) => a.status === 'ABSENT').length;
    const lateDays = attendances.filter((a) => a.status === 'LATE').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 10000) / 100 : 0;

    // 5. Fetch hobby participation
    const hobbyEnrollments = await this.prisma.hobbyEnrollment.findMany({
      where: { studentId, academicSessionId: sessionId },
      include: { hobby: { select: { name: true, category: true } } },
    });

    // 6. Discipline record — count incidents
    const incidentCount = await this.prisma.incident.count({ where: { studentId } });
    const incidents = await this.prisma.incident.findMany({
      where: { studentId },
      select: { type: true, severity: true, status: true, date: true },
      orderBy: { date: 'desc' },
      take: 5,
    });

    // 7. Fetch report cards
    const reportCards = await this.prisma.reportCard.findMany({
      where: { studentId, academicSessionId: sessionId },
      include: { subjectResults: true },
      orderBy: { createdAt: 'desc' },
    });

    // 8. Rank in class
    const classStudents = await this.prisma.student.findMany({
      where: {
        classId: student.classId,
        sectionId: student.sectionId,
        academicSessionId: sessionId,
        isActive: true,
      },
      select: { id: true },
    });

    const classRankings: Array<{ studentId: string; total: number; max: number }> = [];
    for (const cs of classStudents) {
      const cGrades = await this.prisma.grade.findMany({
        where: { studentId: cs.id },
        select: { marksObtained: true, maxMarks: true },
      });
      const cTotal = cGrades.reduce((s, g) => s + g.marksObtained, 0);
      const cMax = cGrades.reduce((s, g) => s + g.maxMarks, 0);
      classRankings.push({ studentId: cs.id, total: cTotal, max: cMax });
    }

    classRankings.sort((a, b) => {
      const pctA = a.max > 0 ? a.total / a.max : 0;
      const pctB = b.max > 0 ? b.total / b.max : 0;
      return pctB - pctA;
    });

    const rank = classRankings.findIndex((r) => r.studentId === studentId) + 1;

    // 9. Strengths & Weaknesses
    const strengths = subjectPerformance.filter((s) => s.percentage >= 80).map((s) => s.subjectName);
    const weaknesses = subjectPerformance.filter((s) => s.percentage < 50).map((s) => s.subjectName);

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        name: `${student.user.firstName} ${student.user.lastName}`,
        class: student.class.name,
        grade: student.class.grade,
        section: student.section.name,
        rollNo: student.rollNo,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        guardian: student.guardians[0] ?? null,
        academicSession: student.academicSession.name,
      },
      performance: {
        subjectPerformance,
        totalObtained,
        totalMax,
        overallPercentage,
        overallGrade,
        rank,
        totalStudentsInClass: classStudents.length,
        strengths,
        weaknesses,
      },
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage,
      },
      hobbies: hobbyEnrollments.map((he) => ({
        name: he.hobby.name,
        category: he.hobby.category,
        level: he.level,
        status: he.status,
      })),
      discipline: {
        incidentCount,
        recentIncidents: incidents,
      },
      reportCards: reportCards.map((rc) => ({
        id: rc.id,
        term: rc.term,
        overallPercentage: rc.overallPercentage,
        overallGrade: rc.overallGrade,
        rank: rc.rank,
        status: rc.status,
        teacherRemarks: rc.teacherRemarks,
        principalRemarks: rc.principalRemarks,
        subjectResults: rc.subjectResults,
      })),
    };
  }

  async generateClassReport(classId: string, academicSessionId?: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, grade: true, schoolId: true },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const students = await this.prisma.student.findMany({
      where: {
        classId,
        ...(academicSessionId ? { academicSessionId } : {}),
        isActive: true,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        section: { select: { name: true } },
        grades: { select: { marksObtained: true, maxMarks: true, subjectId: true } },
        attendances: { select: { status: true } },
      },
      orderBy: { rollNo: 'asc' },
    });

    const studentSummaries = students.map((s) => {
      const totalObtained = s.grades.reduce((sum, g) => sum + g.marksObtained, 0);
      const totalMax = s.grades.reduce((sum, g) => sum + g.maxMarks, 0);
      const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;

      const totalDays = s.attendances.length;
      const presentDays = s.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 10000) / 100 : 0;

      return {
        studentId: s.id,
        admissionNo: s.admissionNo,
        name: `${s.user.firstName} ${s.user.lastName}`,
        section: s.section.name,
        rollNo: s.rollNo,
        totalObtained,
        totalMax,
        percentage,
        gradeLabel: this.computeGradeLabel(percentage),
        attendancePercentage,
      };
    });

    // Sort by percentage descending and assign rank
    studentSummaries.sort((a, b) => b.percentage - a.percentage);
    const ranked = studentSummaries.map((s, i) => ({ ...s, rank: i + 1 }));

    const avgPercentage =
      ranked.length > 0
        ? Math.round((ranked.reduce((sum, s) => sum + s.percentage, 0) / ranked.length) * 100) / 100
        : 0;

    const topPerformers = ranked.slice(0, 3);
    const bottomPerformers = [...ranked].reverse().slice(0, 3);

    return {
      class: cls,
      totalStudents: ranked.length,
      averagePercentage: avgPercentage,
      topPerformers,
      bottomPerformers,
      students: ranked,
    };
  }

  private computeGradeLabel(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }
}

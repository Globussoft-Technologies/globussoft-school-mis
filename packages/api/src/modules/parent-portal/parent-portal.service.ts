import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParentPortalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find the student(s) linked to a parent user via the Guardian table.
   */
  private async getStudentsForParent(parentUserId: string) {
    const guardians = await this.prisma.guardian.findMany({
      where: { userId: parentUserId },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            class: { select: { id: true, name: true, grade: true } },
            section: { select: { id: true, name: true } },
            academicSession: { select: { id: true, name: true, status: true } },
          },
        },
      },
    });

    if (!guardians.length) {
      throw new NotFoundException('No ward found for this parent account');
    }

    return guardians.map((g) => g.student);
  }

  /**
   * Verify that a student belongs to the requesting parent user.
   */
  async verifyStudentAccess(parentUserId: string, studentId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { userId: parentUserId, studentId },
    });
    if (!guardian) {
      throw new ForbiddenException('Access denied: this student is not linked to your account');
    }
    return guardian;
  }

  /**
   * Full overview of all wards linked to the parent.
   */
  async getWardOverview(parentUserId: string) {
    const students = await this.getStudentsForParent(parentUserId);

    const overviews = await Promise.all(
      students.map(async (student) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const today = new Date();

        // Attendance summary (last 30 days)
        const attendanceRecords = await this.prisma.attendance.findMany({
          where: {
            studentId: student.id,
            date: { gte: thirtyDaysAgo, lte: today },
          },
        });
        const present = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
        const absent = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
        const late = attendanceRecords.filter((r) => r.status === 'LATE').length;
        const halfDay = attendanceRecords.filter((r) => r.status === 'HALF_DAY').length;
        const total = attendanceRecords.length;
        const attendancePercentage =
          total > 0
            ? Math.round(((present + late + halfDay * 0.5) / total) * 100)
            : 0;

        // Recent grades (last 5)
        const recentGrades = await this.prisma.grade.findMany({
          where: { studentId: student.id },
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        // Fee status
        const pendingPayments = await this.prisma.payment.findMany({
          where: {
            studentId: student.id,
            status: { in: ['PENDING', 'PARTIAL'] },
          },
          include: {
            feeHead: { select: { id: true, name: true } },
          },
        });
        const totalDue = pendingPayments.reduce(
          (sum, p) => sum + (p.amount - p.paidAmount - p.discount),
          0,
        );

        // Recent notifications (last 10 for parent user)
        const recentNotifications = await this.prisma.notification.findMany({
          where: { userId: parentUserId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        // Upcoming assessments (scheduled after today)
        const upcomingAssessments = await this.prisma.assessment.findMany({
          where: {
            classId: student.classId,
            isPublished: true,
            scheduledDate: { gte: today },
          },
          include: {
            subject: { select: { id: true, name: true } },
          },
          orderBy: { scheduledDate: 'asc' },
          take: 5,
        });

        // Bus assignment
        const busAssignment = await this.prisma.busAssignment.findUnique({
          where: { studentId: student.id },
          include: {
            route: {
              include: {
                vehicle: { select: { number: true, driverName: true, driverPhone: true } },
              },
            },
            stop: { select: { name: true, estimatedArrival: true } },
          },
        });

        // Hobby enrollments
        const hobbyEnrollments = await this.prisma.hobbyEnrollment.findMany({
          where: { studentId: student.id, status: 'ENROLLED' },
          include: {
            hobby: { select: { id: true, name: true, category: true } },
          },
        });

        return {
          profile: {
            id: student.id,
            admissionNo: student.admissionNo,
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            email: student.user.email,
            phone: student.user.phone,
            rollNo: student.rollNo,
            class: student.class,
            section: student.section,
            academicSession: student.academicSession,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            bloodGroup: student.bloodGroup,
          },
          attendanceSummary: {
            period: '30 days',
            totalDays: total,
            present,
            absent,
            late,
            halfDay,
            percentage: attendancePercentage,
          },
          recentGrades,
          feeStatus: {
            pendingCount: pendingPayments.length,
            totalDue: Math.round(totalDue * 100) / 100,
            pendingPayments,
          },
          recentNotifications,
          upcomingAssessments,
          busAssignment,
          hobbyEnrollments,
        };
      }),
    );

    return overviews;
  }

  /**
   * Detailed attendance records for a ward within a date range.
   */
  async getWardAttendance(
    parentUserId: string,
    studentId: string,
    startDate: string,
    endDate: string,
  ) {
    await this.verifyStudentAccess(parentUserId, studentId);

    const start = new Date(startDate);
    const end = new Date(endDate);

    const records = await this.prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'desc' },
    });

    const summary = {
      totalDays: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
    };
    const percentage =
      summary.totalDays > 0
        ? Math.round(
            ((summary.present + summary.late + summary.halfDay * 0.5) / summary.totalDays) * 100,
          )
        : 0;

    return {
      studentId,
      startDate,
      endDate,
      summary: { ...summary, percentage },
      records,
    };
  }

  /**
   * All grades for a ward grouped by subject.
   */
  async getWardGrades(parentUserId: string, studentId: string) {
    await this.verifyStudentAccess(parentUserId, studentId);

    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
            scheduledDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { studentId, grades };
  }

  /**
   * All payments and pending fees for a ward.
   */
  async getWardFees(parentUserId: string, studentId: string) {
    await this.verifyStudentAccess(parentUserId, studentId);

    const payments = await this.prisma.payment.findMany({
      where: { studentId },
      include: {
        feeHead: { select: { id: true, name: true, frequency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const defaulterRecords = await this.prisma.defaulterRecord.findMany({
      where: { studentId, status: 'ACTIVE' },
      include: {
        feeHead: { select: { id: true, name: true } },
      },
    });

    const totalPaid = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const totalPending = payments
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + (p.amount - p.discount), 0);

    return {
      studentId,
      summary: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100,
        pendingCount: payments.filter((p) => p.status === 'PENDING').length,
        defaulterCount: defaulterRecords.length,
      },
      payments,
      defaulterRecords,
    };
  }

  /**
   * Report cards for a ward.
   */
  async getWardReportCards(parentUserId: string, studentId: string) {
    await this.verifyStudentAccess(parentUserId, studentId);

    const reportCards = await this.prisma.reportCard.findMany({
      where: { studentId },
      include: {
        subjectResults: true,
        academicSession: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ academicSession: { startDate: 'desc' } }, { term: 'asc' }],
    });

    return { studentId, reportCards };
  }
}

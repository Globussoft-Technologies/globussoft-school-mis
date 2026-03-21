import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ─── Report Card ─────────────────────────────────────────────

  async generateReportCardData(studentId: string, term?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
        academicSession: {
          select: {
            id: true,
            name: true,
            school: {
              select: { id: true, name: true, address: true, phone: true, email: true, logoUrl: true },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Fetch report card for the term
    const reportCardWhere: Record<string, unknown> = { studentId };
    if (term) reportCardWhere.term = term;

    const reportCard = await this.prisma.reportCard.findFirst({
      where: reportCardWhere,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch grades / subject results
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attendance summary
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { studentId },
      select: { status: true },
    });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const attendancePct =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      generatedAt: new Date().toISOString(),
      reportType: 'REPORT_CARD',
      school: student.academicSession.school,
      academicSession: {
        id: student.academicSession.id,
        name: student.academicSession.name,
      },
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        class: student.class?.name,
        section: student.section?.name,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
      },
      term: term ?? reportCard?.term ?? 'ANNUAL',
      subjectResults: grades.map((g) => ({
        subject: g.subject?.name ?? 'Unknown',
        subjectCode: g.subject?.code ?? '',
        marksObtained: g.marksObtained,
        maxMarks: g.maxMarks,
        percentage: g.percentage ?? Math.round((g.marksObtained / g.maxMarks) * 100),
        grade: g.gradeLabel ?? '',
        remarks: g.remarks ?? '',
      })),
      attendanceSummary: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage: attendancePct,
      },
      overallPercentage: reportCard?.overallPercentage ?? null,
      overallGrade: reportCard?.overallGrade ?? null,
      rank: reportCard?.rank ?? null,
      teacherRemarks: reportCard?.teacherRemarks ?? '',
      principalRemarks: reportCard?.principalRemarks ?? '',
    };
  }

  // ─── Fee Receipt ─────────────────────────────────────────────

  async generateFeeReceipt(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true } },
            section: { select: { name: true } },
            academicSession: {
              select: {
                name: true,
                school: {
                  select: {
                    name: true,
                    address: true,
                    phone: true,
                    email: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
        feeHead: { select: { id: true, name: true } },
        receiver: { select: { firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    return {
      generatedAt: new Date().toISOString(),
      reportType: 'FEE_RECEIPT',
      school: payment.student.academicSession.school,
      academicSession: payment.student.academicSession.name,
      student: {
        id: payment.student.id,
        admissionNo: payment.student.admissionNo,
        firstName: payment.student.user.firstName,
        lastName: payment.student.user.lastName,
        class: payment.student.class?.name,
        section: payment.student.section?.name,
      },
      receipt: {
        receiptNo: payment.receiptNo,
        date: payment.paidAt ?? payment.createdAt,
        feeHead: payment.feeHead.name,
        amount: payment.amount,
        discount: payment.discount,
        paidAmount: payment.paidAmount,
        netPayable: payment.amount - payment.discount,
        method: payment.method,
        transactionId: payment.transactionId ?? '',
        status: payment.status,
        receivedBy: payment.receiver
          ? `${payment.receiver.firstName} ${payment.receiver.lastName}`
          : '',
      },
    };
  }

  // ─── Attendance Report ───────────────────────────────────────

  async generateAttendanceReport(
    classId: string,
    sectionId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        grade: true,
        school: {
          select: { name: true, address: true, phone: true, logoUrl: true },
        },
      },
    });
    if (!classRecord) throw new NotFoundException('Class not found');

    const students = await this.prisma.student.findMany({
      where: {
        classId,
        isActive: true,
        ...(sectionId && { sectionId }),
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        section: { select: { name: true } },
        attendances: {
          where: {
            ...(startDate && { date: { gte: new Date(startDate) } }),
            ...(endDate && { date: { lte: new Date(endDate) } }),
          },
          select: { date: true, status: true },
        },
      },
      orderBy: { rollNo: 'asc' },
    });

    const reportData = students.map((s) => {
      const total = s.attendances.length;
      const present = s.attendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE',
      ).length;
      const absent = s.attendances.filter((a) => a.status === 'ABSENT').length;
      return {
        studentId: s.id,
        admissionNo: s.admissionNo,
        name: `${s.user.firstName} ${s.user.lastName}`,
        rollNo: s.rollNo,
        section: s.section?.name ?? '',
        totalDays: total,
        presentDays: present,
        absentDays: absent,
        attendancePercentage: total > 0 ? Math.round((present / total) * 100) : 0,
        records: s.attendances,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      reportType: 'ATTENDANCE_REPORT',
      school: classRecord.school,
      class: { id: classRecord.id, name: classRecord.name, grade: classRecord.grade },
      sectionId: sectionId ?? null,
      period: { startDate: startDate ?? null, endDate: endDate ?? null },
      students: reportData,
      summary: {
        totalStudents: reportData.length,
        averageAttendance:
          reportData.length > 0
            ? Math.round(
                reportData.reduce((sum, s) => sum + s.attendancePercentage, 0) /
                  reportData.length,
              )
            : 0,
      },
    };
  }

  // ─── Student Profile ─────────────────────────────────────────

  async generateStudentProfile(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
        guardians: true,
        academicSession: {
          select: {
            id: true,
            name: true,
            school: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                email: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Recent attendance summary
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { studentId },
      select: { status: true, date: true },
      orderBy: { date: 'desc' },
      take: 30,
    });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;

    // Recent payments
    const recentPayments = await this.prisma.payment.findMany({
      where: { studentId },
      select: {
        receiptNo: true,
        amount: true,
        paidAmount: true,
        status: true,
        paidAt: true,
        feeHead: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      generatedAt: new Date().toISOString(),
      reportType: 'STUDENT_PROFILE',
      school: student.academicSession.school,
      academicSession: {
        id: student.academicSession.id,
        name: student.academicSession.name,
      },
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        phone: student.user.phone,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        class: student.class?.name,
        section: student.section?.name,
        rollNo: student.rollNo,
        address: {
          line1: student.addressLine1,
          city: student.city,
          state: student.state,
          pincode: student.pincode,
          country: student.country,
        },
        isActive: student.isActive,
        joinedAt: student.createdAt,
      },
      guardians: student.guardians.map((g) => ({
        name: g.name,
        relation: g.relation,
        phone: g.phone,
        email: g.email,
        occupation: g.occupation,
      })),
      attendanceSummary: {
        recentDays: totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage:
          totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      },
      recentPayments,
    };
  }
}

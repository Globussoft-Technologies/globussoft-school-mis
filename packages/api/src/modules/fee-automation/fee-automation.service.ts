import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeeAutomationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Scan all fee heads with past due dates.
   * For each student enrolled in the fee head's class, if they have no PAID/PARTIAL payment
   * and no existing ACTIVE defaulter record, create one.
   */
  async checkAndCreateDefaulters(): Promise<{ created: number; skipped: number }> {
    const now = new Date();
    let created = 0;
    let skipped = 0;

    // Find all fee heads with dueDay set (indicates a due date concept)
    const feeHeads = await this.prisma.feeHead.findMany({
      where: { dueDay: { not: null } },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    for (const feeHead of feeHeads) {
      // Determine due date: use current month's dueDay
      const dueDate = new Date(now.getFullYear(), now.getMonth(), feeHead.dueDay!);
      if (dueDate > now) {
        // Not yet due this month
        skipped++;
        continue;
      }

      // Get all active students in this class
      const students = await this.prisma.student.findMany({
        where: { classId: feeHead.classId, isActive: true },
        select: { id: true },
      });

      for (const student of students) {
        // Check if student already has a PAID or PARTIAL payment for this fee head
        const payment = await this.prisma.payment.findFirst({
          where: {
            studentId: student.id,
            feeHeadId: feeHead.id,
            status: { in: ['PAID', 'PARTIAL'] },
          },
        });

        if (payment) {
          skipped++;
          continue;
        }

        // Check if active defaulter record already exists
        const existing = await this.prisma.defaulterRecord.findFirst({
          where: {
            studentId: student.id,
            feeHeadId: feeHead.id,
            status: 'ACTIVE',
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await this.prisma.defaulterRecord.create({
          data: {
            studentId: student.id,
            feeHeadId: feeHead.id,
            amountDue: feeHead.amount,
            dueDate,
            status: 'ACTIVE',
          },
        });
        created++;
      }
    }

    return { created, skipped };
  }

  /**
   * For all ACTIVE defaulters, increment callAttempts and create a notification record.
   */
  async generateReminders(): Promise<{ remindersGenerated: number }> {
    const activeDefaulters = await this.prisma.defaulterRecord.findMany({
      where: { status: 'ACTIVE' },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            guardians: { select: { name: true, phone: true }, take: 1 },
          },
        },
        feeHead: { select: { name: true, amount: true } },
      },
    });

    let remindersGenerated = 0;

    for (const defaulter of activeDefaulters) {
      await this.prisma.defaulterRecord.update({
        where: { id: defaulter.id },
        data: {
          callAttempts: { increment: 1 },
          lastCallAt: new Date(),
        },
      });

      // Create notification for the student's user
      await this.prisma.notification.create({
        data: {
          userId: defaulter.student.userId,
          title: 'Fee Payment Reminder',
          message: `Dear ${defaulter.student.user.firstName}, your payment of ₹${defaulter.feeHead.amount} for "${defaulter.feeHead.name}" is overdue. Please pay immediately to avoid further action.`,
          type: 'FEE_DUE',
          channel: 'PUSH',
        },
      });

      remindersGenerated++;
    }

    return { remindersGenerated };
  }

  /**
   * Aggregate summary analytics for defaulters.
   */
  async getDefaulterSummary() {
    const activeDefaulters = await this.prisma.defaulterRecord.findMany({
      where: { status: 'ACTIVE' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { id: true, name: true, grade: true } },
            section: { select: { name: true } },
          },
        },
        feeHead: { select: { name: true, amount: true } },
      },
    });

    const now = new Date();
    const totalOutstanding = activeDefaulters.reduce((sum, d) => sum + d.amountDue, 0);

    // Class-wise breakdown
    const classMap: Record<string, { className: string; count: number; total: number }> = {};
    for (const d of activeDefaulters) {
      const key = d.student.class?.id ?? 'unknown';
      if (!classMap[key]) {
        classMap[key] = {
          className: d.student.class ? `${d.student.class.grade} - ${d.student.class.name}` : 'Unknown',
          count: 0,
          total: 0,
        };
      }
      classMap[key].count++;
      classMap[key].total += d.amountDue;
    }

    const classBreakdown = Object.values(classMap).sort((a, b) => b.total - a.total);

    // Top defaulters by amount
    const topDefaulters = activeDefaulters
      .map((d) => ({
        id: d.id,
        studentName: `${d.student.user.firstName} ${d.student.user.lastName}`,
        admissionNo: d.student.admissionNo,
        className: d.student.class ? `${d.student.class.grade} - ${d.student.class.name}` : '',
        sectionName: d.student.section?.name ?? '',
        feeHeadName: d.feeHead.name,
        amountDue: d.amountDue,
        daysOverdue: Math.floor((now.getTime() - d.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        callAttempts: d.callAttempts,
        lastCallAt: d.lastCallAt,
        status: d.status,
      }))
      .sort((a, b) => b.amountDue - a.amountDue)
      .slice(0, 10);

    // Count by days overdue buckets
    const overdue30 = activeDefaulters.filter((d) => {
      const days = Math.floor((now.getTime() - d.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    }).length;

    const overdue60 = activeDefaulters.filter((d) => {
      const days = Math.floor((now.getTime() - d.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 60;
    }).length;

    const overdue90 = activeDefaulters.filter((d) => {
      const days = Math.floor((now.getTime() - d.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 90;
    }).length;

    // Reminders sent today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const remindersToday = await this.prisma.notification.count({
      where: {
        type: 'FEE_DUE',
        createdAt: { gte: todayStart },
      },
    });

    return {
      totalOutstanding,
      totalDefaulters: activeDefaulters.length,
      remindersToday,
      overdue30,
      overdue60,
      overdue90,
      classBreakdown,
      topDefaulters,
    };
  }

  /**
   * Send reminder to a specific defaulter by ID.
   */
  async sendReminder(defaulterId: string) {
    const defaulter = await this.prisma.defaulterRecord.findUnique({
      where: { id: defaulterId },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        feeHead: { select: { name: true, amount: true } },
      },
    });

    if (!defaulter) {
      throw new NotFoundException('Defaulter record not found');
    }

    await this.prisma.defaulterRecord.update({
      where: { id: defaulterId },
      data: {
        callAttempts: { increment: 1 },
        lastCallAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: defaulter.student.userId,
        title: 'Fee Payment Reminder',
        message: `Dear ${defaulter.student.user.firstName}, your payment of ₹${defaulter.feeHead.amount} for "${defaulter.feeHead.name}" is overdue. Please pay immediately.`,
        type: 'FEE_DUE',
        channel: 'PUSH',
      },
    });

    return {
      success: true,
      message: `Reminder sent to ${defaulter.student.user.firstName} ${defaulter.student.user.lastName}`,
    };
  }
}

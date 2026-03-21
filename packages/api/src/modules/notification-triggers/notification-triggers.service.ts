import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationTriggersService {
  private readonly logger = new Logger(NotificationTriggersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  /**
   * Resolves the parent/guardian userId and email for a student.
   * Returns null values if no guardian with a linked userId or email is found.
   */
  private async resolveParentContact(studentId: string) {
    const guardians = await this.prisma.guardian.findMany({
      where: { studentId },
    });

    if (!guardians.length) return { userId: null, email: null, name: null };

    // Prefer guardian with a linked userId (parent portal account)
    const primary = guardians.find((g) => g.userId) ?? guardians[0];

    return {
      userId: primary.userId ?? null,
      email: primary.email ?? null,
      name: primary.name,
    };
  }

  async triggerAbsentNotification(studentId: string, date: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const studentName = `${student.user.firstName} ${student.user.lastName}`;
    const parent = await this.resolveParentContact(studentId);

    // Create in-app notification
    let notification = null;
    if (parent.userId) {
      notification = await this.notificationsService.create({
        userId: parent.userId,
        title: 'Attendance Alert',
        message: `${studentName} was marked ABSENT on ${date}.`,
        type: 'ATTENDANCE',
        channel: 'PUSH',
        metadata: { studentId, date, status: 'ABSENT' },
      });
    }

    // Send email
    if (parent.email) {
      await this.emailService.sendAttendanceAlert(parent.email, studentName, date, 'ABSENT');
    }

    this.logger.log(`Absent notification triggered for student ${studentId} on ${date}`);

    return {
      studentId,
      studentName,
      date,
      notificationCreated: !!notification,
      emailSent: !!parent.email,
      notification,
    };
  }

  async triggerFeeReminder(studentId: string, feeHeadId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const feeHead = await this.prisma.feeHead.findUnique({
      where: { id: feeHeadId },
    });

    if (!feeHead) throw new NotFoundException(`FeeHead ${feeHeadId} not found`);

    const studentName = `${student.user.firstName} ${student.user.lastName}`;
    const parent = await this.resolveParentContact(studentId);

    const dueDate = feeHead.dueDay
      ? `Day ${feeHead.dueDay} of current month`
      : 'Please check with school office';

    let notification = null;
    if (parent.userId) {
      notification = await this.notificationsService.create({
        userId: parent.userId,
        title: 'Fee Payment Reminder',
        message: `Fee "${feeHead.name}" of ₹${feeHead.amount} is due for ${studentName}.`,
        type: 'FEE_DUE',
        channel: 'PUSH',
        metadata: { studentId, feeHeadId, amount: feeHead.amount, dueDate },
      });
    }

    if (parent.email) {
      await this.emailService.sendFeeReminder(
        parent.email,
        studentName,
        feeHead.amount,
        dueDate,
      );
    }

    this.logger.log(`Fee reminder triggered for student ${studentId}, feeHead ${feeHeadId}`);

    return {
      studentId,
      studentName,
      feeHeadId,
      feeHeadName: feeHead.name,
      amount: feeHead.amount,
      notificationCreated: !!notification,
      emailSent: !!parent.email,
      notification,
    };
  }

  async triggerTestResult(studentId: string, assessmentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const submission = await this.prisma.assessmentSubmission.findFirst({
      where: { studentId, assessmentId },
      include: {
        assessment: {
          include: { subject: { select: { name: true } } },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(
        `No submission found for student ${studentId} and assessment ${assessmentId}`,
      );
    }

    const studentName = `${student.user.firstName} ${student.user.lastName}`;
    const subjectName = submission.assessment.subject.name;
    const marks = submission.totalMarks ?? 0;
    const totalMarks = submission.assessment.totalMarks;
    const percentage = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;

    // Derive grade from percentage
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const parent = await this.resolveParentContact(studentId);

    let notification = null;
    if (parent.userId) {
      notification = await this.notificationsService.create({
        userId: parent.userId,
        title: 'Test Result Available',
        message: `${studentName} scored ${marks}/${totalMarks} (${grade}) in ${subjectName} — ${submission.assessment.title}.`,
        type: 'TEST_RESULT',
        channel: 'PUSH',
        metadata: { studentId, assessmentId, marks, totalMarks, grade, subject: subjectName },
      });
    }

    if (parent.email) {
      await this.emailService.sendTestResult(
        parent.email,
        studentName,
        subjectName,
        marks,
        grade,
      );
    }

    this.logger.log(`Test result notification triggered for student ${studentId}, assessment ${assessmentId}`);

    return {
      studentId,
      studentName,
      assessmentId,
      subject: subjectName,
      marks,
      totalMarks,
      grade,
      notificationCreated: !!notification,
      emailSent: !!parent.email,
      notification,
    };
  }

  async triggerIncidentAlert(incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!incident) throw new NotFoundException(`Incident ${incidentId} not found`);

    const studentName = `${incident.student.user.firstName} ${incident.student.user.lastName}`;
    const parent = await this.resolveParentContact(incident.studentId);

    let notification = null;
    if (parent.userId) {
      notification = await this.notificationsService.create({
        userId: parent.userId,
        title: 'Disciplinary Incident Alert',
        message: `A ${incident.severity} ${incident.type} incident involving ${studentName} was reported on ${incident.date.toISOString().split('T')[0]}.`,
        type: 'GENERAL',
        channel: 'PUSH',
        metadata: {
          incidentId,
          studentId: incident.studentId,
          type: incident.type,
          severity: incident.severity,
          date: incident.date,
        },
      });
    }

    if (parent.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Disciplinary Incident Notification</h2>
          <p>Dear Parent/Guardian,</p>
          <p>We wish to inform you about an incident involving your ward <strong>${studentName}</strong>.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr><td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Date</strong></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${incident.date.toISOString().split('T')[0]}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Type</strong></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${incident.type}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Severity</strong></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${incident.severity}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Location</strong></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${incident.location ?? 'School premises'}</td></tr>
          </table>
          <p>We request you to please contact the school office to discuss this matter further.</p>
          <hr/>
          <p style="font-size: 12px; color: #888;">This is an automated message from MIS-ILSMS.</p>
        </div>
      `;
      await this.emailService.sendEmail(
        parent.email,
        `Incident Alert: ${studentName}`,
        html,
      );
    }

    this.logger.log(`Incident alert triggered for incident ${incidentId}`);

    return {
      incidentId,
      studentId: incident.studentId,
      studentName,
      incidentType: incident.type,
      severity: incident.severity,
      notificationCreated: !!notification,
      emailSent: !!parent.email,
      notification,
    };
  }

  async triggerBusAlert(studentId: string, message: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const studentName = `${student.user.firstName} ${student.user.lastName}`;
    const parent = await this.resolveParentContact(studentId);

    let notification = null;
    if (parent.userId) {
      notification = await this.notificationsService.create({
        userId: parent.userId,
        title: 'Bus Alert',
        message: `Bus update for ${studentName}: ${message}`,
        type: 'BUS',
        channel: 'PUSH',
        metadata: { studentId, message },
      });
    }

    if (parent.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5bc0de;">Bus Alert</h2>
          <p>Dear Parent/Guardian,</p>
          <p>This is an update regarding the school bus for <strong>${studentName}</strong>:</p>
          <blockquote style="background: #f9f9f9; border-left: 4px solid #5bc0de; padding: 12px; margin: 16px 0;">
            ${message}
          </blockquote>
          <hr/>
          <p style="font-size: 12px; color: #888;">This is an automated message from MIS-ILSMS.</p>
        </div>
      `;
      await this.emailService.sendEmail(parent.email, `Bus Alert: ${studentName}`, html);
    }

    this.logger.log(`Bus alert triggered for student ${studentId}`);

    return {
      studentId,
      studentName,
      message,
      notificationCreated: !!notification,
      emailSent: !!parent.email,
      notification,
    };
  }

  async triggerAllTestResultsForAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { subject: { select: { name: true } } },
    });

    if (!assessment) throw new NotFoundException(`Assessment ${assessmentId} not found`);

    const submissions = await this.prisma.assessmentSubmission.findMany({
      where: { assessmentId, status: 'GRADED' },
    });

    this.logger.log(
      `Found ${submissions.length} graded submissions for assessment ${assessmentId}. Processing...`,
    );

    const results: Array<{
      studentId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const submission of submissions) {
      try {
        await this.triggerTestResult(submission.studentId, assessmentId);
        results.push({ studentId: submission.studentId, success: true });
      } catch (err) {
        this.logger.warn(
          `Failed to notify for student ${submission.studentId}: ${err.message}`,
        );
        results.push({ studentId: submission.studentId, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      assessmentId,
      assessmentTitle: assessment.title,
      subject: assessment.subject.name,
      totalSubmissions: submissions.length,
      successCount,
      failureCount,
      results,
    };
  }

  async triggerBulkAbsentNotifications(date: string) {
    const targetDate = new Date(date);

    const absentRecords = await this.prisma.attendance.findMany({
      where: {
        date: targetDate,
        status: 'ABSENT',
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    this.logger.log(
      `Found ${absentRecords.length} absent students on ${date}. Processing notifications...`,
    );

    const results: Array<{
      studentId: string;
      studentName: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const record of absentRecords) {
      const studentName = `${record.student.user.firstName} ${record.student.user.lastName}`;
      try {
        await this.triggerAbsentNotification(record.studentId, date);
        results.push({ studentId: record.studentId, studentName, success: true });
      } catch (err) {
        this.logger.warn(
          `Failed to notify for student ${record.studentId}: ${err.message}`,
        );
        results.push({ studentId: record.studentId, studentName, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    this.logger.log(
      `Bulk absent notifications complete: ${successCount} sent, ${failureCount} failed.`,
    );

    return {
      date,
      totalAbsent: absentRecords.length,
      successCount,
      failureCount,
      results,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly emailEnabled: boolean;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.emailEnabled = this.config.get<string>('EMAIL_ENABLED', 'false') === 'true';
    this.from = this.config.get<string>('SMTP_FROM', 'noreply@medicaps.edu.in');

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.config.get<string>('SMTP_PORT', '587'), 10),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER', ''),
        pass: this.config.get<string>('SMTP_PASS', ''),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.emailEnabled) {
      this.logger.log(
        `[EMAIL DISABLED] To: ${to} | Subject: ${subject}\n${html.replace(/<[^>]+>/g, ' ')}`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      throw err;
    }
  }

  async sendAttendanceAlert(
    parentEmail: string,
    studentName: string,
    date: string,
    status: string,
  ): Promise<void> {
    const subject = `Attendance Alert: ${studentName} marked ${status}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d9534f;">Attendance Notification</h2>
        <p>Dear Parent/Guardian,</p>
        <p>This is to inform you that your ward <strong>${studentName}</strong> has been marked
           <strong style="color: #d9534f;">${status}</strong> on <strong>${date}</strong>.</p>
        <p>If you believe this is an error or have already communicated with the school, please disregard this message.</p>
        <p>For any queries, please contact the school office.</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">This is an automated message from MIS-ILSMS. Please do not reply to this email.</p>
      </div>
    `;
    await this.sendEmail(parentEmail, subject, html);
  }

  async sendFeeReminder(
    parentEmail: string,
    studentName: string,
    amount: number,
    dueDate: string,
  ): Promise<void> {
    const subject = `Fee Reminder: Payment Due for ${studentName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f0ad4e;">Fee Payment Reminder</h2>
        <p>Dear Parent/Guardian,</p>
        <p>This is a friendly reminder that a fee payment is due for <strong>${studentName}</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Student Name</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${studentName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Amount Due</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">₹${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Due Date</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${dueDate}</td>
          </tr>
        </table>
        <p>Please ensure timely payment to avoid late fees. You can pay at the school office or through the parent portal.</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">This is an automated message from MIS-ILSMS.</p>
      </div>
    `;
    await this.sendEmail(parentEmail, subject, html);
  }

  async sendTestResult(
    parentEmail: string,
    studentName: string,
    subject: string,
    marks: number,
    grade: string,
  ): Promise<void> {
    const emailSubject = `Test Result: ${studentName} — ${subject}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5bc0de;">Test Result Notification</h2>
        <p>Dear Parent/Guardian,</p>
        <p>The test results for <strong>${studentName}</strong> are now available.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Subject</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${subject}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Marks Obtained</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${marks}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Grade</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${grade}</strong></td>
          </tr>
        </table>
        <p>For detailed feedback or to discuss your child's performance, please contact the respective subject teacher.</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">This is an automated message from MIS-ILSMS.</p>
      </div>
    `;
    await this.sendEmail(parentEmail, emailSubject, html);
  }

  async sendAdmissionConfirmation(
    parentEmail: string,
    studentName: string,
    admissionNo: string,
  ): Promise<void> {
    const subject = `Admission Confirmed: ${studentName} — ${admissionNo}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5cb85c;">Admission Confirmation</h2>
        <p>Dear Parent/Guardian,</p>
        <p>We are pleased to confirm that the admission of <strong>${studentName}</strong> has been successfully processed.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Student Name</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${studentName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Admission Number</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${admissionNo}</strong></td>
          </tr>
        </table>
        <p>Please keep your admission number handy for all future correspondence with the school.</p>
        <p>Welcome to our school family! We look forward to a wonderful academic journey.</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">This is an automated message from MIS-ILSMS.</p>
      </div>
    `;
    await this.sendEmail(parentEmail, subject, html);
  }

  async sendLeaveApproval(
    email: string,
    studentName: string,
    status: string,
    dates: string[],
  ): Promise<void> {
    const isApproved = status.toUpperCase() === 'APPROVED';
    const color = isApproved ? '#5cb85c' : '#d9534f';
    const subject = `Leave ${status}: ${studentName}`;
    const datesStr = dates.join(', ');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${color};">Leave Application ${status}</h2>
        <p>Dear Parent/Guardian,</p>
        <p>The leave application for <strong>${studentName}</strong> has been
           <strong style="color: ${color};">${status}</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Student Name</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${studentName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Leave Date(s)</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${datesStr}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"><strong>Status</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong style="color: ${color};">${status}</strong></td>
          </tr>
        </table>
        ${isApproved ? '<p>The leave has been approved. Please ensure the student completes any pending assignments upon return.</p>' : '<p>If you have questions regarding this decision, please contact the school office.</p>'}
        <hr/>
        <p style="font-size: 12px; color: #888;">This is an automated message from MIS-ILSMS.</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
  }

  getAvailableTemplates() {
    return [
      {
        name: 'attendance-alert',
        description: 'Notifies parents when a student is marked absent or late',
        params: ['parentEmail', 'studentName', 'date', 'status'],
      },
      {
        name: 'fee-reminder',
        description: 'Reminds parents of pending fee payments',
        params: ['parentEmail', 'studentName', 'amount', 'dueDate'],
      },
      {
        name: 'test-result',
        description: 'Shares test/assessment results with parents',
        params: ['parentEmail', 'studentName', 'subject', 'marks', 'grade'],
      },
      {
        name: 'admission-confirmation',
        description: 'Confirms successful admission of a student',
        params: ['parentEmail', 'studentName', 'admissionNo'],
      },
      {
        name: 'leave-approval',
        description: 'Notifies parents of leave application approval or rejection',
        params: ['email', 'studentName', 'status', 'dates'],
      },
    ];
  }
}

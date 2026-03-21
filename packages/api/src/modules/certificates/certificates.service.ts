import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  private async generateSerialNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CERT-${year}-`;

    // Count existing certificates this year to determine the sequence number
    const count = await this.prisma.certificate.count({
      where: { serialNumber: { startsWith: prefix } },
    });

    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  async generate(data: {
    studentId: string;
    type: string;
    title: string;
    description?: string;
    issuedBy: string;
    issuedDate?: Date;
    templateData?: any;
    status?: string;
  }) {
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
      include: { user: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const serialNumber = await this.generateSerialNumber();

    return this.prisma.certificate.create({
      data: {
        studentId: data.studentId,
        type: data.type,
        title: data.title,
        description: data.description,
        issuedDate: data.issuedDate ?? new Date(),
        issuedBy: data.issuedBy,
        serialNumber,
        templateData: data.templateData,
        status: data.status ?? 'ISSUED',
      },
    });
  }

  async generateMeritCertificates(
    classId: string,
    academicSessionId: string,
    topN: number,
    issuedBy: string,
  ) {
    // Get report cards for the class/session, ordered by percentage descending
    const reportCards = await this.prisma.reportCard.findMany({
      where: { classId, academicSessionId },
      orderBy: { overallPercentage: 'desc' },
      take: topN,
      include: { student: { include: { user: true } } },
    });

    if (reportCards.length === 0) {
      throw new BadRequestException(
        'No report cards found for this class and session',
      );
    }

    const certificates = [];
    for (let i = 0; i < reportCards.length; i++) {
      const rc = reportCards[i];
      const rank = i + 1;
      const cert = await this.generate({
        studentId: rc.studentId,
        type: 'MERIT',
        title: `Merit Certificate - Rank ${rank}`,
        description: `Awarded for achieving ${rc.overallPercentage?.toFixed(2) ?? 'N/A'}% marks and securing Rank ${rank} in the class.`,
        issuedBy,
        templateData: {
          rank,
          percentage: rc.overallPercentage,
          academicSessionId,
          classId,
        },
      });
      certificates.push(cert);
    }

    return { generated: certificates.length, certificates };
  }

  async generateAttendanceCertificates(
    classId: string,
    minPercentage: number,
    issuedBy: string,
  ) {
    // Get students in this class
    const students = await this.prisma.student.findMany({
      where: { classId, isActive: true },
      include: { user: true },
    });

    if (students.length === 0) {
      throw new BadRequestException('No active students found in this class');
    }

    const certificates = [];

    for (const student of students) {
      const totalDays = await this.prisma.attendance.count({
        where: { studentId: student.id },
      });

      if (totalDays === 0) continue;

      const presentDays = await this.prisma.attendance.count({
        where: {
          studentId: student.id,
          status: { in: ['PRESENT', 'LATE'] },
        },
      });

      const percentage = (presentDays / totalDays) * 100;

      if (percentage >= minPercentage) {
        const cert = await this.generate({
          studentId: student.id,
          type: 'ATTENDANCE',
          title: 'Certificate of Attendance',
          description: `Awarded for maintaining ${percentage.toFixed(2)}% attendance, meeting the minimum requirement of ${minPercentage}%.`,
          issuedBy,
          templateData: {
            attendancePercentage: percentage.toFixed(2),
            presentDays,
            totalDays,
            minPercentage,
            classId,
          },
        });
        certificates.push(cert);
      }
    }

    return { generated: certificates.length, certificates };
  }

  async findAll(filters: {
    studentId?: string;
    type?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    return this.prisma.certificate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async revoke(id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    if (cert.status === 'REVOKED') {
      throw new BadRequestException('Certificate is already revoked');
    }

    return this.prisma.certificate.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }

  async getCertificateData(id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');

    const student = await this.prisma.student.findUnique({
      where: { id: cert.studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        class: { select: { name: true, grade: true } },
        section: { select: { name: true } },
      },
    });

    return {
      certificate: cert,
      student: student
        ? {
            id: student.id,
            admissionNo: student.admissionNo,
            name: `${student.user.firstName} ${student.user.lastName}`,
            class: student.class.name,
            section: student.section.name,
            email: student.user.email,
          }
        : null,
      printData: {
        schoolName: 'Medicaps International School',
        studentName: student
          ? `${student.user.firstName} ${student.user.lastName}`
          : 'Unknown',
        certificateType: cert.type,
        title: cert.title,
        description: cert.description,
        serialNumber: cert.serialNumber,
        issuedDate: cert.issuedDate,
        issuedBy: cert.issuedBy,
        status: cert.status,
        templateData: cert.templateData,
      },
    };
  }
}

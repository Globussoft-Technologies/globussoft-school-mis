import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ProcessApplicationDto } from './dto/process-application.dto';

@Injectable()
export class AdmissionService {
  constructor(private prisma: PrismaService) {}

  // ─── Enquiry ─────────────────────────────────────────────────

  async createEnquiry(dto: CreateEnquiryDto) {
    return this.prisma.admissionEnquiry.create({ data: dto });
  }

  async findAllEnquiries(academicSessionId?: string) {
    return this.prisma.admissionEnquiry.findMany({
      where: academicSessionId ? { academicSessionId } : undefined,
      include: { applications: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findEnquiryById(id: string) {
    const enquiry = await this.prisma.admissionEnquiry.findUnique({
      where: { id },
      include: { applications: { include: { documents: true } } },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return enquiry;
  }

  async updateEnquiryStatus(id: string, status: string) {
    return this.prisma.admissionEnquiry.update({
      where: { id },
      data: { status },
    });
  }

  // ─── Application ─────────────────────────────────────────────

  private async generateFormNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `APP-${year}-`;
    // Count existing applications this year to get next sequence
    const count = await this.prisma.admissionApplication.count({
      where: { formNumber: { startsWith: prefix } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  async createApplication(dto: CreateApplicationDto) {
    const enquiry = await this.prisma.admissionEnquiry.findUnique({
      where: { id: dto.enquiryId },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    const formNumber = await this.generateFormNumber();

    const application = await this.prisma.admissionApplication.create({
      data: {
        enquiryId: dto.enquiryId,
        formNumber,
        studentFirstName: dto.studentFirstName,
        studentLastName: dto.studentLastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        classAppliedFor: enquiry.classAppliedFor,
        previousSchool: dto.previousSchool,
        addressLine1: dto.addressLine1,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        status: 'APPLICATION',
        academicSessionId: enquiry.academicSessionId,
      },
      include: { enquiry: true },
    });

    // Update enquiry status to APPLICATION
    await this.prisma.admissionEnquiry.update({
      where: { id: dto.enquiryId },
      data: { status: 'APPLICATION' },
    });

    return application;
  }

  async processApplication(id: string, dto: ProcessApplicationDto) {
    const application = await this.prisma.admissionApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');

    if (application.status === 'ENROLLED') {
      throw new BadRequestException('Cannot change status of an enrolled application');
    }

    return this.prisma.admissionApplication.update({
      where: { id },
      data: { status: dto.status },
      include: { enquiry: true, documents: true },
    });
  }

  async enrollStudent(applicationId: string) {
    const application = await this.prisma.admissionApplication.findUnique({
      where: { id: applicationId },
      include: { enquiry: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'Application must be in ACCEPTED status before enrollment',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Generate admission number MIS-YYYY-NNNN
      const year = new Date().getFullYear();
      const admPrefix = `MIS-${year}-`;
      const count = await tx.student.count({
        where: { admissionNo: { startsWith: admPrefix } },
      });
      const admissionNo = `${admPrefix}${String(count + 1).padStart(4, '0')}`;

      // Build email from name + admissionNo
      const emailBase = `${application.studentFirstName.toLowerCase()}.${application.studentLastName.toLowerCase()}`;
      const email = `${emailBase}.${admissionNo.replace(/[^a-z0-9]/gi, '').toLowerCase()}@school.local`;

      const passwordHash = await bcrypt.hash('student@123', 10);

      // Need a schoolId — fetch from academic session
      const session = await tx.academicSession.findUnique({
        where: { id: application.academicSessionId },
        select: { schoolId: true },
      });
      if (!session) throw new NotFoundException('Academic session not found');

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: application.studentFirstName,
          lastName: application.studentLastName,
          role: 'STUDENT',
          schoolId: session.schoolId,
        },
      });

      // We need a classId — try to find by classAppliedFor name
      const classRecord = await tx.class.findFirst({
        where: {
          name: application.classAppliedFor,
          schoolId: session.schoolId,
        },
        include: { sections: { take: 1 } },
      });

      // Create student record
      const student = await tx.student.create({
        data: {
          admissionNo,
          userId: user.id,
          classId: classRecord?.id ?? '',
          sectionId: classRecord?.sections?.[0]?.id ?? '',
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          addressLine1: application.addressLine1 ?? undefined,
          city: application.city ?? undefined,
          state: application.state ?? undefined,
          pincode: application.pincode ?? undefined,
          academicSessionId: application.academicSessionId,
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      // Update application status to ENROLLED
      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: { status: 'ENROLLED' },
      });

      // Update enquiry status to ENROLLED
      await tx.admissionEnquiry.update({
        where: { id: application.enquiryId },
        data: { status: 'ENROLLED' },
      });

      return { student, admissionNo };
    });
  }

  async getApplications(filters: {
    enquiryId?: string;
    status?: string;
    classAppliedFor?: string;
  }) {
    return this.prisma.admissionApplication.findMany({
      where: {
        ...(filters.enquiryId && { enquiryId: filters.enquiryId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.classAppliedFor && {
          classAppliedFor: filters.classAppliedFor,
        }),
      },
      include: {
        enquiry: {
          select: {
            id: true,
            studentName: true,
            parentName: true,
            parentPhone: true,
          },
        },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdmissionStats(academicSessionId?: string) {
    const enquiryWhere = academicSessionId ? { academicSessionId } : {};
    const appWhere = academicSessionId ? { academicSessionId } : {};

    const [totalEnquiries, totalApplications, enrolledCount, rejectedCount] =
      await Promise.all([
        this.prisma.admissionEnquiry.count({ where: enquiryWhere }),
        this.prisma.admissionApplication.count({ where: appWhere }),
        this.prisma.admissionApplication.count({
          where: { ...appWhere, status: 'ENROLLED' },
        }),
        this.prisma.admissionApplication.count({
          where: { ...appWhere, status: 'REJECTED' },
        }),
      ]);

    const enquiryToAppPct =
      totalEnquiries > 0
        ? Math.round((totalApplications / totalEnquiries) * 100)
        : 0;
    const appToEnrolledPct =
      totalApplications > 0
        ? Math.round((enrolledCount / totalApplications) * 100)
        : 0;
    const overallPct =
      totalEnquiries > 0
        ? Math.round((enrolledCount / totalEnquiries) * 100)
        : 0;

    return {
      totalEnquiries,
      totalApplications,
      enrolledCount,
      rejectedCount,
      conversionFunnel: {
        enquiryToApplicationPct: enquiryToAppPct,
        applicationToEnrolledPct: appToEnrolledPct,
        overallConversionPct: overallPct,
      },
    };
  }
}

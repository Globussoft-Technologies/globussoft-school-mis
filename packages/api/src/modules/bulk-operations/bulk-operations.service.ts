import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export interface StudentImportRow {
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string;
  classGrade: string;
  sectionName: string;
  dateOfBirth: string;
  gender: string;
}

export interface PaymentImportRow {
  studentAdmissionNo: string;
  feeHeadName: string;
  amount: number;
  method: string;
  receiptNo: string;
  date: string;
}

@Injectable()
export class BulkOperationsService {
  constructor(private prisma: PrismaService) {}

  async importStudents(data: StudentImportRow[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    const passwordHash = await bcrypt.hash('student123', 10);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowLabel = `Row ${i + 1} (${row.admissionNo || 'no admissionNo'})`;

      try {
        if (!row.admissionNo || !row.firstName || !row.email || !row.classGrade || !row.sectionName) {
          errors.push(`${rowLabel}: Missing required fields (admissionNo, firstName, email, classGrade, sectionName)`);
          continue;
        }

        // Check for duplicate admission number
        const existingStudent = await this.prisma.student.findUnique({
          where: { admissionNo: row.admissionNo },
        });
        if (existingStudent) {
          errors.push(`${rowLabel}: Admission number already exists`);
          continue;
        }

        // Check for duplicate email
        const existingUser = await this.prisma.user.findUnique({
          where: { email: row.email },
        });
        if (existingUser) {
          errors.push(`${rowLabel}: Email already exists`);
          continue;
        }

        // Resolve class by grade name
        const classRecord = await this.prisma.class.findFirst({
          where: { grade: typeof row.classGrade === 'string' ? parseInt(row.classGrade, 10) : row.classGrade },
        });
        if (!classRecord) {
          errors.push(`${rowLabel}: Class grade "${row.classGrade}" not found`);
          continue;
        }

        // Resolve section by name within class
        const sectionRecord = await this.prisma.section.findFirst({
          where: { name: row.sectionName, classId: classRecord.id },
        });
        if (!sectionRecord) {
          errors.push(`${rowLabel}: Section "${row.sectionName}" not found in class "${row.classGrade}"`);
          continue;
        }

        // Resolve active academic session for this class's school
        const school = await this.prisma.school.findFirst({
          where: { classes: { some: { id: classRecord.id } } },
          select: { id: true },
        });
        if (!school) {
          errors.push(`${rowLabel}: Could not determine school for class "${row.classGrade}"`);
          continue;
        }
        const academicSession = await this.prisma.academicSession.findFirst({
          where: {
            schoolId: school.id,
            status: 'ACTIVE',
          },
          orderBy: { startDate: 'desc' },
        });
        if (!academicSession) {
          errors.push(`${rowLabel}: No active academic session found`);
          continue;
        }

        await this.prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: row.email,
              passwordHash,
              firstName: row.firstName,
              lastName: row.lastName || '',
              role: 'STUDENT',
              schoolId: school.id,
            },
          });

          await tx.student.create({
            data: {
              admissionNo: row.admissionNo,
              userId: user.id,
              classId: classRecord.id,
              sectionId: sectionRecord.id,
              dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : new Date('2000-01-01'),
              gender: row.gender || 'OTHER',
              academicSessionId: academicSession.id,
            },
          });
        });

        imported++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${rowLabel}: ${message}`);
      }
    }

    return { imported, errors };
  }

  async importFeePayments(data: PaymentImportRow[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowLabel = `Row ${i + 1} (${row.studentAdmissionNo || 'no admissionNo'})`;

      try {
        if (!row.studentAdmissionNo || !row.feeHeadName || !row.amount || !row.receiptNo) {
          errors.push(`${rowLabel}: Missing required fields (studentAdmissionNo, feeHeadName, amount, receiptNo)`);
          continue;
        }

        const student = await this.prisma.student.findUnique({
          where: { admissionNo: row.studentAdmissionNo },
        });
        if (!student) {
          errors.push(`${rowLabel}: Student with admission number "${row.studentAdmissionNo}" not found`);
          continue;
        }

        const feeHead = await this.prisma.feeHead.findFirst({
          where: { name: row.feeHeadName },
        });
        if (!feeHead) {
          errors.push(`${rowLabel}: Fee head "${row.feeHeadName}" not found`);
          continue;
        }

        const existingReceipt = await this.prisma.payment.findUnique({
          where: { receiptNo: row.receiptNo },
        });
        if (existingReceipt) {
          errors.push(`${rowLabel}: Receipt number "${row.receiptNo}" already exists`);
          continue;
        }

        await this.prisma.payment.create({
          data: {
            studentId: student.id,
            feeHeadId: feeHead.id,
            amount: Number(row.amount),
            paidAmount: Number(row.amount),
            method: row.method || 'CASH',
            receiptNo: row.receiptNo,
            status: 'PAID',
            paidAt: row.date ? new Date(row.date) : new Date(),
          },
        });

        // Mark related defaulter resolved if any
        await this.prisma.defaulterRecord.updateMany({
          where: { studentId: student.id, feeHeadId: feeHead.id, status: 'ACTIVE' },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });

        imported++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${rowLabel}: ${message}`);
      }
    }

    return { imported, errors };
  }

  async exportStudents(classId?: string, sectionId?: string) {
    const students = await this.prisma.student.findMany({
      where: {
        isActive: true,
        ...(classId && { classId }),
        ...(sectionId && { sectionId }),
      },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
        class: { select: { name: true, grade: true } },
        section: { select: { name: true } },
        guardians: { select: { name: true, phone: true, relation: true }, take: 1 },
      },
      orderBy: [{ class: { grade: 'asc' } }, { admissionNo: 'asc' }],
    });

    return students.map((s) => ({
      admissionNo: s.admissionNo,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      email: s.user.email,
      phone: s.user.phone ?? '',
      classGrade: s.class?.grade ?? '',
      className: s.class?.name ?? '',
      sectionName: s.section?.name ?? '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.toISOString().split('T')[0] : '',
      gender: s.gender,
      guardianName: s.guardians[0]?.name ?? '',
      guardianPhone: s.guardians[0]?.phone ?? '',
      guardianRelation: s.guardians[0]?.relation ?? '',
    }));
  }

  async exportAttendance(classId: string, sectionId: string, startDate: string, endDate: string) {
    if (!classId || !startDate || !endDate) {
      throw new BadRequestException('classId, startDate, and endDate are required');
    }

    const records = await this.prisma.attendance.findMany({
      where: {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
        student: {
          classId,
          ...(sectionId && { sectionId }),
        },
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true, grade: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { student: { admissionNo: 'asc' } }],
    });

    return records.map((r) => ({
      admissionNo: r.student.admissionNo,
      studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
      class: r.student.class?.grade ?? '',
      section: r.student.section?.name ?? '',
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      remarks: r.remarks ?? '',
    }));
  }

  async exportGrades(classId: string, subjectId?: string) {
    if (!classId) {
      throw new BadRequestException('classId is required');
    }

    const grades = await this.prisma.grade.findMany({
      where: {
        student: { classId },
        ...(subjectId && { subjectId }),
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true, grade: true } },
            section: { select: { name: true } },
          },
        },
        subject: { select: { name: true, code: true } },
        assessment: { select: { title: true, type: true } },
      },
      orderBy: [{ student: { admissionNo: 'asc' } }, { createdAt: 'desc' }],
    });

    return grades.map((g) => ({
      admissionNo: g.student.admissionNo,
      studentName: `${g.student.user.firstName} ${g.student.user.lastName}`,
      class: g.student.class?.grade ?? '',
      section: g.student.section?.name ?? '',
      subject: g.subject?.name ?? '',
      subjectCode: g.subject?.code ?? '',
      assessmentTitle: g.assessment?.title ?? '',
      assessmentType: g.assessment?.type ?? '',
      marksObtained: g.marksObtained,
      maxMarks: g.maxMarks,
      percentage: g.percentage,
      gradeLabel: g.gradeLabel,
    }));
  }
}

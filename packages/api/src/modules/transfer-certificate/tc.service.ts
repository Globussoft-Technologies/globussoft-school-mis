import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TcService {
  constructor(private prisma: PrismaService) {}

  private async generateTcNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.transferCertificate.count({
      where: { tcNumber: { startsWith: `TC-${year}-` } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `TC-${year}-${seq}`;
  }

  async generate(studentId: string, reasonForLeaving: string, issuedBy: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
        section: true,
        academicSession: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const tcNumber = await this.generateTcNumber();
    const className = student.class
      ? `Class ${student.class.grade}${student.section ? ' ' + student.section.name : ''}`
      : 'N/A';

    return this.prisma.transferCertificate.create({
      data: {
        studentId,
        tcNumber,
        dateOfIssue: new Date(),
        reasonForLeaving,
        lastClassAttended: className,
        issuedBy,
        status: 'DRAFT',
      },
    });
  }

  async issue(tcId: string) {
    const tc = await this.prisma.transferCertificate.findUnique({ where: { id: tcId } });
    if (!tc) throw new NotFoundException('TC not found');
    if (tc.status !== 'DRAFT') throw new BadRequestException('Only DRAFT TCs can be issued');

    const [updated] = await this.prisma.$transaction([
      this.prisma.transferCertificate.update({
        where: { id: tcId },
        data: { status: 'ISSUED' },
      }),
      this.prisma.student.update({
        where: { id: tc.studentId },
        data: { isActive: false },
      }),
    ]);
    return updated;
  }

  async cancel(tcId: string) {
    const tc = await this.prisma.transferCertificate.findUnique({ where: { id: tcId } });
    if (!tc) throw new NotFoundException('TC not found');
    if (tc.status === 'CANCELLED') throw new BadRequestException('TC is already cancelled');

    return this.prisma.transferCertificate.update({
      where: { id: tcId },
      data: { status: 'CANCELLED' },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status } : {};
    const tcs = await this.prisma.transferCertificate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(
      tcs.map(async (tc) => {
        const student = await this.prisma.student.findUnique({
          where: { id: tc.studentId },
          include: { user: true, class: true, section: true },
        });
        return {
          ...tc,
          student: student
            ? {
                id: student.id,
                name: `${student.user.firstName} ${student.user.lastName}`,
                admissionNo: student.admissionNo,
                class: student.class ? `Class ${student.class.grade}` : '',
                section: student.section?.name || '',
              }
            : null,
        };
      }),
    );
    return enriched;
  }

  async findById(id: string) {
    const tc = await this.prisma.transferCertificate.findUnique({ where: { id } });
    if (!tc) throw new NotFoundException('TC not found');

    const student = await this.prisma.student.findUnique({
      where: { id: tc.studentId },
      include: { user: true, class: true, section: true, academicSession: true },
    });

    return { ...tc, student };
  }

  async getTcData(id: string) {
    const tc = await this.findById(id);
    const student = tc.student as any;
    const school = student
      ? await this.prisma.school.findFirst({ where: { id: student.user?.schoolId } })
      : null;

    return {
      schoolName: school?.name || 'MIS-ILSMS School',
      schoolAddress: school?.address || '',
      schoolPhone: school?.phone || '',
      tcNumber: tc.tcNumber,
      dateOfIssue: tc.dateOfIssue,
      studentName: student ? `${student.user.firstName} ${student.user.lastName}` : '',
      admissionNo: student?.admissionNo || '',
      dateOfBirth: student?.dateOfBirth || null,
      gender: student?.gender || '',
      class: tc.lastClassAttended,
      reasonForLeaving: tc.reasonForLeaving,
      lastExamPassed: tc.lastExamPassed || 'N/A',
      conductAndCharacter: tc.conductAndCharacter,
      generalRemarks: tc.generalRemarks || '',
      issuedBy: tc.issuedBy,
      status: tc.status,
    };
  }
}

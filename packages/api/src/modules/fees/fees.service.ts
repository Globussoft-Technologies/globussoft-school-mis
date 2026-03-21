import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeeHeadDto } from './dto/create-fee-head.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateDefaulterDto } from './dto/update-defaulter.dto';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async createFeeHead(dto: CreateFeeHeadDto) {
    return this.prisma.feeHead.create({
      data: {
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        classId: dto.classId,
        academicSessionId: dto.academicSessionId,
        isRecurring: dto.isRecurring ?? false,
        frequency: dto.frequency ?? 'ONE_TIME',
        dueDay: dto.dueDay,
      },
      include: {
        class: { select: { id: true, name: true } },
        academicSession: { select: { id: true, name: true } },
      },
    });
  }

  async getFeeHeadsByClass(classId: string, academicSessionId?: string) {
    return this.prisma.feeHead.findMany({
      where: {
        classId,
        ...(academicSessionId && { academicSessionId }),
      },
      include: {
        class: { select: { id: true, name: true } },
        academicSession: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllFeeHeads(filters: { classId?: string; academicSessionId?: string }) {
    return this.prisma.feeHead.findMany({
      where: {
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.academicSessionId && { academicSessionId: filters.academicSessionId }),
      },
      include: {
        class: { select: { id: true, name: true } },
        academicSession: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordPayment(dto: RecordPaymentDto, receivedBy: string) {
    // Check if receipt number is unique
    const existing = await this.prisma.payment.findUnique({
      where: { receiptNo: dto.receiptNo },
    });
    if (existing) {
      throw new BadRequestException(`Receipt number ${dto.receiptNo} already exists`);
    }

    const feeHead = await this.prisma.feeHead.findUnique({ where: { id: dto.feeHeadId } });
    if (!feeHead) throw new NotFoundException('Fee head not found');

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    // Determine payment status
    const netAmount = dto.amount - (dto.discount ?? 0);
    let status = 'PENDING';
    if (dto.paidAmount >= netAmount) {
      status = 'PAID';
    } else if (dto.paidAmount > 0) {
      status = 'PARTIAL';
    }

    const payment = await this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        feeHeadId: dto.feeHeadId,
        amount: dto.amount,
        paidAmount: dto.paidAmount,
        discount: dto.discount ?? 0,
        method: dto.method ?? 'CASH',
        transactionId: dto.transactionId,
        receiptNo: dto.receiptNo,
        status,
        paidAt: dto.paidAmount > 0 ? new Date() : null,
        receivedBy,
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        feeHead: { select: { id: true, name: true } },
        receiver: { select: { firstName: true, lastName: true } },
      },
    });

    // If fully paid and there's a defaulter record, mark it resolved
    if (status === 'PAID') {
      await this.prisma.defaulterRecord.updateMany({
        where: { studentId: dto.studentId, feeHeadId: dto.feeHeadId, status: 'ACTIVE' },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
    }

    return payment;
  }

  async getStudentPayments(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.payment.findMany({
      where: { studentId },
      include: {
        feeHead: { select: { id: true, name: true, frequency: true } },
        receiver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDefaulters(filters: { status?: string; academicSessionId?: string }) {
    return this.prisma.defaulterRecord.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.academicSessionId && {
          feeHead: { academicSessionId: filters.academicSessionId },
        }),
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
            class: { select: { name: true } },
            section: { select: { name: true } },
            guardians: { select: { name: true, phone: true, relation: true }, take: 1 },
          },
        },
        feeHead: { select: { id: true, name: true, amount: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async updateDefaulterStatus(id: string, dto: UpdateDefaulterDto) {
    const record = await this.prisma.defaulterRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Defaulter record not found');

    const data: Record<string, unknown> = { ...dto };
    if (dto.status === 'RESOLVED') {
      data.resolvedAt = new Date();
    }
    if (dto.callAttempts !== undefined) {
      data.lastCallAt = new Date();
    }

    return this.prisma.defaulterRecord.update({
      where: { id },
      data,
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        feeHead: { select: { id: true, name: true } },
      },
    });
  }

  async createDefaulterRecord(data: {
    studentId: string;
    feeHeadId: string;
    amountDue: number;
    dueDate: Date;
  }) {
    return this.prisma.defaulterRecord.create({ data });
  }
}

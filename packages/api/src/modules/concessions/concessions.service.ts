import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConcessionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new concession request for a student on a specific fee head.
   */
  async create(
    studentId: string,
    feeHeadId: string,
    type: string,
    reason: string,
    discountPercent?: number,
    discountAmount?: number,
  ) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const feeHead = await this.prisma.feeHead.findUnique({ where: { id: feeHeadId } });
    if (!feeHead) throw new NotFoundException('Fee head not found');

    if (!discountPercent && !discountAmount) {
      throw new BadRequestException('Either discountPercent or discountAmount must be provided');
    }

    return this.prisma.concession.create({
      data: {
        studentId,
        feeHeadId,
        type,
        reason,
        discountPercent,
        discountAmount,
        status: 'PENDING',
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        feeHead: { select: { name: true, amount: true } },
      },
    });
  }

  /**
   * List all concessions with optional filters.
   */
  async findAll(studentId?: string, type?: string, status?: string) {
    return this.prisma.concession.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
        feeHead: { select: { name: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve or reject a concession request.
   */
  async approve(concessionId: string, approvedBy: string, status: 'APPROVED' | 'REJECTED') {
    const concession = await this.prisma.concession.findUnique({ where: { id: concessionId } });
    if (!concession) throw new NotFoundException('Concession not found');

    if (concession.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING concessions can be approved or rejected');
    }

    return this.prisma.concession.update({
      where: { id: concessionId },
      data: { status, approvedBy },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        feeHead: { select: { name: true, amount: true } },
      },
    });
  }

  /**
   * Get all concessions for a specific student.
   */
  async getStudentConcessions(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.concession.findMany({
      where: { studentId },
      include: {
        feeHead: { select: { name: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Calculate effective fee for a student on a given fee head after applying approved concessions.
   */
  async calculateEffectiveFee(studentId: string, feeHeadId: string) {
    const feeHead = await this.prisma.feeHead.findUnique({ where: { id: feeHeadId } });
    if (!feeHead) throw new NotFoundException('Fee head not found');

    const approvedConcessions = await this.prisma.concession.findMany({
      where: { studentId, feeHeadId, status: 'APPROVED' },
    });

    let totalDiscount = 0;
    const originalAmount = feeHead.amount;

    for (const c of approvedConcessions) {
      if (c.discountAmount) {
        totalDiscount += c.discountAmount;
      } else if (c.discountPercent) {
        totalDiscount += (originalAmount * c.discountPercent) / 100;
      }
    }

    const effectiveAmount = Math.max(0, originalAmount - totalDiscount);

    return {
      originalAmount,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      effectiveAmount: Math.round(effectiveAmount * 100) / 100,
      concessions: approvedConcessions,
    };
  }
}

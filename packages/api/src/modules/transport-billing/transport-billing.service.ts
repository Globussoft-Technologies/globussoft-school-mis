import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransportBillingService {
  constructor(private prisma: PrismaService) {}

  async generateMonthlyBills(month: number, year: number, amount = 1500) {
    // Get all active bus assignments
    const assignments = await this.prisma.busAssignment.findMany({
      include: { route: true },
    });

    const results: any[] = [];
    for (const assignment of assignments) {
      try {
        const bill = await this.prisma.transportBilling.upsert({
          where: {
            studentId_routeId_month_year: {
              studentId: assignment.studentId,
              routeId: assignment.routeId,
              month,
              year,
            },
          },
          create: {
            studentId: assignment.studentId,
            routeId: assignment.routeId,
            month,
            year,
            amount,
            status: 'PENDING',
          },
          update: {},
        });
        results.push(bill);
      } catch (e) {
        // Skip duplicates
      }
    }
    return { generated: results.length, bills: results };
  }

  async recordPayment(billingId: string, receiptNo?: string) {
    const bill = await this.prisma.transportBilling.findUnique({ where: { id: billingId } });
    if (!bill) throw new NotFoundException('Billing record not found');

    return this.prisma.transportBilling.update({
      where: { id: billingId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        receiptNo: receiptNo || `RCPT-${Date.now()}`,
      },
    });
  }

  async waive(billingId: string, remarks?: string) {
    const bill = await this.prisma.transportBilling.findUnique({ where: { id: billingId } });
    if (!bill) throw new NotFoundException('Billing record not found');

    return this.prisma.transportBilling.update({
      where: { id: billingId },
      data: { status: 'WAIVED', remarks },
    });
  }

  async getStudentBills(studentId: string) {
    return this.prisma.transportBilling.findMany({
      where: { studentId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getMonthlyReport(month: number, year: number) {
    const bills = await this.prisma.transportBilling.findMany({
      where: { month, year },
    });

    const totalBilled = bills.reduce((sum, b) => sum + b.amount, 0);
    const collected = bills.filter((b) => b.status === 'PAID').reduce((sum, b) => sum + b.amount, 0);
    const waived = bills.filter((b) => b.status === 'WAIVED').reduce((sum, b) => sum + b.amount, 0);
    const pending = bills.filter((b) => b.status === 'PENDING').reduce((sum, b) => sum + b.amount, 0);

    // Per-route breakdown
    const routeMap: Record<string, { routeId: string; total: number; paid: number; pending: number; count: number }> = {};
    for (const bill of bills) {
      if (!routeMap[bill.routeId]) {
        routeMap[bill.routeId] = { routeId: bill.routeId, total: 0, paid: 0, pending: 0, count: 0 };
      }
      routeMap[bill.routeId].total += bill.amount;
      routeMap[bill.routeId].count += 1;
      if (bill.status === 'PAID') routeMap[bill.routeId].paid += bill.amount;
      if (bill.status === 'PENDING') routeMap[bill.routeId].pending += bill.amount;
    }

    return {
      month,
      year,
      totalBilled,
      collected,
      waived,
      pending,
      totalStudents: bills.length,
      paidCount: bills.filter((b) => b.status === 'PAID').length,
      pendingCount: bills.filter((b) => b.status === 'PENDING').length,
      waivedCount: bills.filter((b) => b.status === 'WAIVED').length,
      routeBreakdown: Object.values(routeMap),
    };
  }

  async findAll(params: { month?: number; year?: number; status?: string; routeId?: string }) {
    const { month, year, status, routeId } = params;
    return this.prisma.transportBilling.findMany({
      where: {
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
        ...(status ? { status } : {}),
        ...(routeId ? { routeId } : {}),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });
  }
}

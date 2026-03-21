import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // ─── Salary Structures ───────────────────────────────────────────

  async createSalaryStructure(data: {
    role: string;
    basicSalary: number;
    hra?: number;
    da?: number;
    ta?: number;
    pf?: number;
    tax?: number;
    schoolId: string;
  }) {
    const existing = await this.prisma.salaryStructure.findUnique({
      where: { role_schoolId: { role: data.role, schoolId: data.schoolId } },
    });
    if (existing) {
      return this.prisma.salaryStructure.update({
        where: { role_schoolId: { role: data.role, schoolId: data.schoolId } },
        data: {
          basicSalary: data.basicSalary,
          hra: data.hra ?? 0,
          da: data.da ?? 0,
          ta: data.ta ?? 0,
          pf: data.pf ?? 0,
          tax: data.tax ?? 0,
        },
      });
    }
    return this.prisma.salaryStructure.create({
      data: {
        role: data.role,
        basicSalary: data.basicSalary,
        hra: data.hra ?? 0,
        da: data.da ?? 0,
        ta: data.ta ?? 0,
        pf: data.pf ?? 0,
        tax: data.tax ?? 0,
        schoolId: data.schoolId,
      },
    });
  }

  async getSalaryStructures(schoolId: string) {
    return this.prisma.salaryStructure.findMany({
      where: { schoolId },
      orderBy: { role: 'asc' },
    });
  }

  // ─── Payroll Records ─────────────────────────────────────────────

  async generateMonthlyPayroll(month: number, year: number, schoolId: string) {
    // Get all staff users (non-student, non-parent roles)
    const staffRoles = [
      'SUPER_ADMIN', 'ADMIN', 'IT_ADMIN', 'DIRECTOR', 'ACADEMIC_COORDINATOR',
      'CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACCOUNTANT', 'TRANSPORT_MANAGER',
      'HOBBY_COORDINATOR',
    ];
    const users = await this.prisma.user.findMany({
      where: { schoolId, role: { in: staffRoles } },
      select: { id: true, role: true, firstName: true, lastName: true, email: true },
    });

    const structures = await this.prisma.salaryStructure.findMany({
      where: { schoolId },
    });
    const structureMap = new Map(structures.map((s) => [s.role, s]));

    const results: { created: number; skipped: number; records: unknown[] } = {
      created: 0,
      skipped: 0,
      records: [],
    };

    for (const user of users) {
      const structure = structureMap.get(user.role);
      if (!structure) {
        results.skipped++;
        continue;
      }

      const allowances = structure.hra + structure.da + structure.ta;
      const deductions = structure.pf + structure.tax;
      const netSalary = structure.basicSalary + allowances - deductions;

      try {
        const record = await this.prisma.payrollRecord.create({
          data: {
            userId: user.id,
            month,
            year,
            basicSalary: structure.basicSalary,
            allowances,
            deductions,
            netSalary,
            status: 'DRAFT',
          },
        });
        results.created++;
        results.records.push(record);
      } catch {
        // Skip duplicate (already generated)
        results.skipped++;
      }
    }

    return results;
  }

  async getPayrollRecords(filters: {
    month?: number;
    year?: number;
    status?: string;
    schoolId: string;
  }) {
    const { month, year, status, schoolId } = filters;

    // Get all staff user IDs for this school
    const users = await this.prisma.user.findMany({
      where: { schoolId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    const userIds = users.map((u) => u.id);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const records = await this.prisma.payrollRecord.findMany({
      where: {
        userId: { in: userIds },
        ...(month && { month }),
        ...(year && { year }),
        ...(status && { status }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return records.map((r) => ({ ...r, user: userMap.get(r.userId) ?? null }));
  }

  async approvePayroll(id: string, approvedBy: string) {
    const record = await this.prisma.payrollRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Payroll record not found');
    if (record.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT records can be approved');
    }
    return this.prisma.payrollRecord.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy },
    });
  }

  async markPaid(id: string) {
    const record = await this.prisma.payrollRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Payroll record not found');
    if (record.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED records can be marked as paid');
    }
    return this.prisma.payrollRecord.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async getUserPayslips(userId: string) {
    return this.prisma.payrollRecord.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getMonthlySummary(month: number, year: number, schoolId: string) {
    const users = await this.prisma.user.findMany({
      where: { schoolId },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    const records = await this.prisma.payrollRecord.findMany({
      where: { userId: { in: userIds }, month, year },
    });

    const total = records.reduce((s, r) => s + r.netSalary, 0);
    const approved = records.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.netSalary, 0);
    const paid = records.filter((r) => r.status === 'PAID').reduce((s, r) => s + r.netSalary, 0);
    const draft = records.filter((r) => r.status === 'DRAFT').reduce((s, r) => s + r.netSalary, 0);

    return {
      month,
      year,
      totalRecords: records.length,
      totalPayroll: total,
      approvedPayroll: approved,
      paidPayroll: paid,
      draftPayroll: draft,
      countByStatus: {
        DRAFT: records.filter((r) => r.status === 'DRAFT').length,
        APPROVED: records.filter((r) => r.status === 'APPROVED').length,
        PAID: records.filter((r) => r.status === 'PAID').length,
      },
    };
  }
}

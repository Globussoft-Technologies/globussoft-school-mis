import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async createExpense(data: {
    title: string;
    category: string;
    amount: number;
    date: string;
    vendor?: string;
    invoiceNo?: string;
    description?: string;
    receiptUrl?: string;
    schoolId: string;
    createdBy: string;
  }) {
    const validCategories = [
      'SALARY', 'MAINTENANCE', 'UTILITIES', 'SUPPLIES',
      'TRANSPORT', 'EVENTS', 'INFRASTRUCTURE', 'OTHER',
    ];
    if (!validCategories.includes(data.category)) {
      throw new BadRequestException(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    return this.prisma.expense.create({
      data: {
        title: data.title,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        vendor: data.vendor,
        invoiceNo: data.invoiceNo,
        description: data.description,
        receiptUrl: data.receiptUrl,
        schoolId: data.schoolId,
        createdBy: data.createdBy,
        status: 'PENDING',
      },
    });
  }

  async findAll(
    schoolId: string,
    category?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.prisma.expense.findMany({
      where: {
        schoolId,
        ...(category && { category }),
        ...(status && { status }),
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) }),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async approve(id: string, approvedBy: string) {
    await this.findOne(id);
    return this.prisma.expense.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy },
    });
  }

  async markPaid(id: string, paidBy: string) {
    const expense = await this.findOne(id);
    if (expense.status !== 'APPROVED') {
      throw new BadRequestException('Only approved expenses can be marked as paid');
    }
    return this.prisma.expense.update({
      where: { id },
      data: { status: 'PAID', paidBy },
    });
  }

  async reject(id: string, rejectedBy: string) {
    await this.findOne(id);
    return this.prisma.expense.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: rejectedBy },
    });
  }

  async getExpenseSummary(schoolId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await this.prisma.expense.findMany({
      where: {
        schoolId,
        date: { gte: startDate, lte: endDate },
        status: { not: 'REJECTED' },
      },
    });

    const budgets = await this.prisma.budget.findMany({
      where: { schoolId, year, month },
    });

    const categories = [
      'SALARY', 'MAINTENANCE', 'UTILITIES', 'SUPPLIES',
      'TRANSPORT', 'EVENTS', 'INFRASTRUCTURE', 'OTHER',
    ];

    const totalByCategory: Record<string, number> = {};
    for (const cat of categories) {
      totalByCategory[cat] = 0;
    }
    for (const e of expenses) {
      totalByCategory[e.category] = (totalByCategory[e.category] ?? 0) + e.amount;
    }

    const budgetMap: Record<string, number> = {};
    for (const b of budgets) {
      budgetMap[b.category] = b.amount;
    }

    const breakdown = categories.map((cat) => ({
      category: cat,
      actual: totalByCategory[cat] ?? 0,
      budget: budgetMap[cat] ?? 0,
      variance: (budgetMap[cat] ?? 0) - (totalByCategory[cat] ?? 0),
    }));

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const approved = expenses
      .filter((e) => e.status === 'APPROVED' || e.status === 'PAID')
      .reduce((sum, e) => sum + e.amount, 0);
    const pending = expenses
      .filter((e) => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0);

    return { total, approved, pending, breakdown, month, year };
  }

  async getBudgets(schoolId: string, year: number) {
    return this.prisma.budget.findMany({
      where: { schoolId, year },
      orderBy: [{ month: 'asc' }, { category: 'asc' }],
    });
  }

  async setBudget(data: {
    category: string;
    amount: number;
    month?: number;
    year: number;
    schoolId: string;
  }) {
    const monthVal = data.month ?? undefined;
    // Try to find existing record first, then upsert
    const existing = await this.prisma.budget.findFirst({
      where: {
        category: data.category,
        month: monthVal ?? null,
        year: data.year,
        schoolId: data.schoolId,
      },
    });
    if (existing) {
      return this.prisma.budget.update({
        where: { id: existing.id },
        data: { amount: data.amount },
      });
    }
    return this.prisma.budget.create({
      data: {
        category: data.category,
        amount: data.amount,
        month: monthVal,
        year: data.year,
        schoolId: data.schoolId,
      },
    });
  }
}

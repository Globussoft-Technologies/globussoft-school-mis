import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  create(
    @Body()
    body: {
      title: string;
      category: string;
      amount: number;
      date: string;
      vendor?: string;
      invoiceNo?: string;
      description?: string;
      receiptUrl?: string;
    },
    @CurrentUser('sub') createdBy: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.expensesService.createExpense({ ...body, createdBy, schoolId });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get expense summary for a month/year' })
  getSummary(
    @CurrentUser('schoolId') schoolId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const now = new Date();
    return this.expensesService.getExpenseSummary(
      schoolId,
      month ? parseInt(month) : now.getMonth() + 1,
      year ? parseInt(year) : now.getFullYear(),
    );
  }

  @Get('budgets')
  @ApiOperation({ summary: 'Get all budgets for a year' })
  getBudgets(
    @CurrentUser('schoolId') schoolId: string,
    @Query('year') year: string,
  ) {
    return this.expensesService.getBudgets(
      schoolId,
      year ? parseInt(year) : new Date().getFullYear(),
    );
  }

  @Post('budgets')
  @ApiOperation({ summary: 'Set/update a budget' })
  setBudget(
    @Body()
    body: {
      category: string;
      amount: number;
      month?: number;
      year: number;
    },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.expensesService.setBudget({ ...body, schoolId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with optional filters' })
  findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.findAll(schoolId, category, status, startDate, endDate);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve an expense' })
  approve(
    @Param('id') id: string,
    @CurrentUser('sub') approvedBy: string,
  ) {
    return this.expensesService.approve(id, approvedBy);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark expense as paid' })
  pay(
    @Param('id') id: string,
    @CurrentUser('sub') paidBy: string,
  ) {
    return this.expensesService.markPaid(id, paidBy);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an expense' })
  reject(
    @Param('id') id: string,
    @CurrentUser('sub') rejectedBy: string,
  ) {
    return this.expensesService.reject(id, rejectedBy);
  }
}

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
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Post('structures')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create or update salary structure for a role' })
  createSalaryStructure(
    @Body()
    body: {
      role: string;
      basicSalary: number;
      hra?: number;
      da?: number;
      ta?: number;
      pf?: number;
      tax?: number;
    },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.payrollService.createSalaryStructure({ ...body, schoolId });
  }

  @Get('structures')
  @ApiOperation({ summary: 'Get all salary structures' })
  getSalaryStructures(@CurrentUser('schoolId') schoolId: string) {
    return this.payrollService.getSalaryStructures(schoolId);
  }

  @Post('generate')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Generate monthly payroll for all staff' })
  generatePayroll(
    @Body() body: { month: number; year: number },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.payrollService.generateMonthlyPayroll(body.month, body.year, schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get payroll records' })
  getPayrollRecords(
    @CurrentUser('schoolId') schoolId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
  ) {
    return this.payrollService.getPayrollRecords({
      schoolId,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      status,
    });
  }

  @Patch(':id/approve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DIRECTOR')
  @ApiOperation({ summary: 'Approve a payroll record' })
  approvePayroll(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.payrollService.approvePayroll(id, userId);
  }

  @Patch(':id/pay')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Mark payroll record as paid' })
  markPaid(@Param('id') id: string) {
    return this.payrollService.markPaid(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get payslips for a user' })
  getUserPayslips(@Param('userId') userId: string) {
    return this.payrollService.getUserPayslips(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get monthly payroll summary' })
  getMonthlySummary(
    @CurrentUser('schoolId') schoolId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.payrollService.getMonthlySummary(
      parseInt(month, 10),
      parseInt(year, 10),
      schoolId,
    );
  }
}

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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransportBillingService } from './transport-billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transport Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transport-billing')
export class TransportBillingController {
  constructor(private transportBillingService: TransportBillingService) {}

  @Post('generate')
  generate(@Body() body: { month: number; year: number; amount?: number }) {
    return this.transportBillingService.generateMonthlyBills(
      body.month,
      body.year,
      body.amount,
    );
  }

  @Get('report')
  getReport(@Query('month') month: string, @Query('year') year: string) {
    return this.transportBillingService.getMonthlyReport(
      parseInt(month, 10),
      parseInt(year, 10),
    );
  }

  @Get('student/:studentId')
  getStudentBills(@Param('studentId') studentId: string) {
    return this.transportBillingService.getStudentBills(studentId);
  }

  @Get()
  findAll(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('routeId') routeId?: string,
  ) {
    return this.transportBillingService.findAll({
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      status,
      routeId,
    });
  }

  @Patch(':id/pay')
  recordPayment(@Param('id') id: string, @Body() body: { receiptNo?: string }) {
    return this.transportBillingService.recordPayment(id, body.receiptNo);
  }

  @Patch(':id/waive')
  waive(@Param('id') id: string, @Body() body: { remarks?: string }) {
    return this.transportBillingService.waive(id, body.remarks);
  }
}

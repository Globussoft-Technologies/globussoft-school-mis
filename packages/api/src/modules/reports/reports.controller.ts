import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('report-card/:studentId')
  generateReportCard(
    @Param('studentId') studentId: string,
    @Query('term') term?: string,
  ) {
    return this.reportsService.generateReportCardData(studentId, term);
  }

  @Get('fee-receipt/:paymentId')
  generateFeeReceipt(@Param('paymentId') paymentId: string) {
    return this.reportsService.generateFeeReceipt(paymentId);
  }

  @Get('attendance/:classId')
  generateAttendanceReport(
    @Param('classId') classId: string,
    @Query('sectionId') sectionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateAttendanceReport(
      classId,
      sectionId,
      startDate,
      endDate,
    );
  }

  @Get('student-profile/:studentId')
  generateStudentProfile(@Param('studentId') studentId: string) {
    return this.reportsService.generateStudentProfile(studentId);
  }
}

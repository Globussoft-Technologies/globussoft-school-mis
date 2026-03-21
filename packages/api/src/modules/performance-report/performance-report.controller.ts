import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerformanceReportService } from './performance-report.service';

@ApiTags('Performance Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('performance-report')
export class PerformanceReportController {
  constructor(private readonly reportService: PerformanceReportService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Generate performance report for a student' })
  async getStudentReport(
    @Param('studentId') studentId: string,
    @Query('academicSessionId') academicSessionId?: string,
  ) {
    return this.reportService.generateReport(studentId, academicSessionId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Generate performance summary for a whole class' })
  async getClassReport(
    @Param('classId') classId: string,
    @Query('academicSessionId') academicSessionId?: string,
  ) {
    return this.reportService.generateClassReport(classId, academicSessionId);
  }
}

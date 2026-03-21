import { Module } from '@nestjs/common';
import { PerformanceReportController } from './performance-report.controller';
import { PerformanceReportService } from './performance-report.service';

@Module({
  controllers: [PerformanceReportController],
  providers: [PerformanceReportService],
  exports: [PerformanceReportService],
})
export class PerformanceReportModule {}

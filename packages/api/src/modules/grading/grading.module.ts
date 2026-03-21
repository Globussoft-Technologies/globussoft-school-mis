import { Module } from '@nestjs/common';
import { GradingService } from './grading.service';
import { GradingController } from './grading.controller';
import { ReportCardService } from './report-card.service';
import { ReportCardController } from './report-card.controller';

@Module({
  controllers: [GradingController, ReportCardController],
  providers: [GradingService, ReportCardService],
  exports: [GradingService, ReportCardService],
})
export class GradingModule {}

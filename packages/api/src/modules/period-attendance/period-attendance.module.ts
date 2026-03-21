import { Module } from '@nestjs/common';
import { PeriodAttendanceService } from './period-attendance.service';
import { PeriodAttendanceController } from './period-attendance.controller';

@Module({
  controllers: [PeriodAttendanceController],
  providers: [PeriodAttendanceService],
  exports: [PeriodAttendanceService],
})
export class PeriodAttendanceModule {}

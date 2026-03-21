import { Module } from '@nestjs/common';
import { ExamScheduleService } from './exam-schedule.service';
import { ExamScheduleController } from './exam-schedule.controller';

@Module({
  controllers: [ExamScheduleController],
  providers: [ExamScheduleService],
  exports: [ExamScheduleService],
})
export class ExamScheduleModule {}

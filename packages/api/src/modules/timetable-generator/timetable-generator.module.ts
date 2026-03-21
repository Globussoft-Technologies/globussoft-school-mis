import { Module } from '@nestjs/common';
import { TimetableGeneratorService } from './timetable-generator.service';
import { TimetableGeneratorController } from './timetable-generator.controller';

@Module({
  controllers: [TimetableGeneratorController],
  providers: [TimetableGeneratorService],
  exports: [TimetableGeneratorService],
})
export class TimetableGeneratorModule {}

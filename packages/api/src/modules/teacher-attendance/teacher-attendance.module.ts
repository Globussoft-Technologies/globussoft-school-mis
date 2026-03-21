import { Module } from '@nestjs/common';
import { TeacherAttendanceService } from './teacher-attendance.service';
import { TeacherAttendanceController } from './teacher-attendance.controller';

@Module({
  controllers: [TeacherAttendanceController],
  providers: [TeacherAttendanceService],
  exports: [TeacherAttendanceService],
})
export class TeacherAttendanceModule {}

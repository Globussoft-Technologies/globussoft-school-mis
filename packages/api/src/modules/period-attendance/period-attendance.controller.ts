import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PeriodAttendanceService } from './period-attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Period Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('period-attendance')
export class PeriodAttendanceController {
  constructor(private service: PeriodAttendanceService) {}

  @Post('mark')
  @Roles('CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR', 'SUPER_ADMIN', 'IT_ADMIN')
  mark(
    @Body() body: { records: any[] },
    @CurrentUser('sub') teacherId: string,
  ) {
    return this.service.markPeriodAttendance(body.records, teacherId);
  }

  @Get('class')
  getByClass(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('date') date: string,
    @Query('period') period?: string,
  ) {
    return this.service.getPeriodAttendance(
      classId,
      sectionId,
      date,
      period !== undefined ? Number(period) : undefined,
    );
  }

  @Get('student/:studentId')
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('date') date: string,
  ) {
    return this.service.getStudentPeriodAttendance(studentId, date);
  }

  @Get('absent')
  getAbsent(
    @Query('date') date: string,
    @Query('period') period?: string,
  ) {
    return this.service.getAbsentStudents(
      date,
      period !== undefined ? Number(period) : undefined,
    );
  }

  @Get('summary')
  getSummary(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.getPeriodSummary(classId, sectionId, startDate, endDate);
  }
}

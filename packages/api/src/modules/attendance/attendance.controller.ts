import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('bulk')
  @Roles('CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR', 'SUPER_ADMIN')
  markBulk(@Body() dto: BulkAttendanceDto, @CurrentUser('sub') userId: string) {
    return this.attendanceService.markBulk(dto, userId);
  }

  @Get('class')
  getByClass(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getByClassAndDate(classId, sectionId, date);
  }

  @Get('student/:studentId/summary')
  getStudentSummary(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getStudentSummary(studentId, startDate, endDate);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeacherAttendanceService } from './teacher-attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { ApproveLeaveDto } from './dto/approve-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Teacher Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher-attendance')
export class TeacherAttendanceController {
  constructor(private readonly teacherAttendanceService: TeacherAttendanceService) {}

  @Post('mark')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Mark or update attendance for a teacher on a specific date' })
  markAttendance(@Body() dto: MarkAttendanceDto) {
    return this.teacherAttendanceService.markAttendance(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get attendance records for a specific teacher within a date range' })
  getTeacherAttendance(
    @Query('teacherId') teacherId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;
    return this.teacherAttendanceService.getTeacherAttendance(teacherId, start, end);
  }

  @Get('all')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Get all teacher attendance records for a specific date (admin view)' })
  getAllTeacherAttendance(@Query('date') date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.teacherAttendanceService.getAllTeacherAttendance(targetDate);
  }

  @Post('leave')
  @ApiOperation({ summary: 'Apply for leave' })
  applyLeave(
    @Body() dto: ApplyLeaveDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.teacherAttendanceService.applyLeave(userId, dto);
  }

  @Get('leaves')
  @ApiOperation({ summary: 'Get leave applications with optional filters' })
  getLeaves(
    @Query('applicantId') applicantId?: string,
    @Query('status') status?: string,
  ) {
    return this.teacherAttendanceService.getLeaves({ applicantId, status });
  }

  @Patch('leaves/:id/approve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Approve or reject a leave application' })
  approveLeave(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.teacherAttendanceService.approveLeave(id, userId, dto.status, dto.remarks);
  }
}

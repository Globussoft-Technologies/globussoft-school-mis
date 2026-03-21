import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('student/:studentId')
  getStudentPerformance(@Param('studentId') studentId: string) {
    return this.analyticsService.getStudentPerformance(studentId);
  }

  @Get('class/:classId')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER')
  getClassAnalytics(
    @Param('classId') classId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.analyticsService.getClassAnalytics(classId, subjectId);
  }

  @Get('weak-students/:classId')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER')
  getWeakStudents(
    @Param('classId') classId: string,
    @Query('threshold') threshold?: string,
  ) {
    return this.analyticsService.getWeakStudents(classId, threshold ? parseInt(threshold) : 60);
  }

  @Get('compliance-performance')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'ACADEMIC_COORDINATOR')
  getComplianceVsPerformance(@CurrentUser('schoolId') schoolId: string) {
    return this.analyticsService.getComplianceVsPerformance(schoolId);
  }
}

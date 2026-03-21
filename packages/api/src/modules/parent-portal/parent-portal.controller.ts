import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ParentPortalService } from './parent-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Parent Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARENT')
@Controller('parent-portal')
export class ParentPortalController {
  constructor(private parentPortalService: ParentPortalService) {}

  /**
   * GET /parent-portal/overview
   * Returns overview for all wards of the authenticated parent.
   */
  @Get('overview')
  getWardOverview(@CurrentUser('sub') parentUserId: string) {
    return this.parentPortalService.getWardOverview(parentUserId);
  }

  /**
   * GET /parent-portal/attendance?studentId=&startDate=&endDate=
   * Returns detailed attendance records for a ward within a date range.
   */
  @Get('attendance')
  @ApiQuery({ name: 'studentId', required: true })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2025-12-31' })
  getWardAttendance(
    @CurrentUser('sub') parentUserId: string,
    @Query('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.parentPortalService.getWardAttendance(
      parentUserId,
      studentId,
      startDate,
      endDate,
    );
  }

  /**
   * GET /parent-portal/grades?studentId=
   * Returns all grades for a ward.
   */
  @Get('grades')
  @ApiQuery({ name: 'studentId', required: true })
  getWardGrades(
    @CurrentUser('sub') parentUserId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.parentPortalService.getWardGrades(parentUserId, studentId);
  }

  /**
   * GET /parent-portal/fees?studentId=
   * Returns all payments and pending fees for a ward.
   */
  @Get('fees')
  @ApiQuery({ name: 'studentId', required: true })
  getWardFees(
    @CurrentUser('sub') parentUserId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.parentPortalService.getWardFees(parentUserId, studentId);
  }

  /**
   * GET /parent-portal/report-cards?studentId=
   * Returns all report cards for a ward.
   */
  @Get('report-cards')
  @ApiQuery({ name: 'studentId', required: true })
  getWardReportCards(
    @CurrentUser('sub') parentUserId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.parentPortalService.getWardReportCards(parentUserId, studentId);
  }
}

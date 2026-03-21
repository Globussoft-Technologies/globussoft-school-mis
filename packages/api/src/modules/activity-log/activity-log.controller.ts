import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Activity Log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity-log')
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Post()
  log(@Body() body: { studentId: string; type: string; title: string; description?: string; metadata?: any }) {
    return this.activityLogService.log(
      body.studentId,
      body.type,
      body.title,
      body.description,
      body.metadata,
    );
  }

  @Get('student/:studentId')
  getTimeline(
    @Param('studentId') studentId: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.activityLogService.getStudentTimeline(
      studentId,
      type,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('student/:studentId/stats')
  getStats(@Param('studentId') studentId: string) {
    return this.activityLogService.getActivityStats(studentId);
  }

  @Get('recent/:studentId')
  getRecent(
    @Param('studentId') studentId: string,
    @Query('days') days?: string,
  ) {
    return this.activityLogService.getRecentActivity(
      studentId,
      days ? parseInt(days) : 30,
    );
  }
}

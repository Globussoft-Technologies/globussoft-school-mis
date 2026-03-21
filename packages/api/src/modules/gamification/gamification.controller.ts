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
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly service: GamificationService) {}

  @Post('points')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  awardPoints(
    @Body() body: { studentId: string; points: number; category: string; reason?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.awardPoints(
      body.studentId,
      body.points,
      body.category,
      body.reason,
      userId,
    );
  }

  @Post('badges')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  createBadge(@Body() body: any) {
    return this.service.createBadge(body);
  }

  @Get('badges')
  getBadges(@Query('schoolId') schoolId: string) {
    return this.service.getBadges(schoolId);
  }

  @Get('badges/student/:studentId')
  getStudentBadges(@Param('studentId') studentId: string) {
    return this.service.getStudentBadges(studentId);
  }

  @Post('badges/award')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  awardBadge(
    @Body() body: { studentId: string; badgeId: string; reason?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.awardBadge(body.studentId, body.badgeId, body.reason, userId);
  }

  @Get('profile/:studentId')
  getStudentProfile(@Param('studentId') studentId: string) {
    return this.service.getStudentProfile(studentId);
  }

  @Get('leaderboard/:classId')
  getLeaderboard(
    @Param('classId') classId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getLeaderboard(classId, limit ? parseInt(limit) : 20);
  }

  @Post('leaderboard/:classId/refresh')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER')
  refreshLeaderboard(@Param('classId') classId: string) {
    return this.service.updateLeaderboard(classId);
  }

  @Post('leaderboard/enroll')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER')
  enrollInLeaderboard(@Body() body: { studentId: string; classId: string }) {
    return this.service.ensureLeaderboardEntry(body.studentId, body.classId);
  }
}

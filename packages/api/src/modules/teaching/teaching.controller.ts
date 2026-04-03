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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TeachingService } from './teaching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Teaching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teaching')
export class TeachingController {
  constructor(private readonly service: TeachingService) {}

  @Post('sessions/start')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  startSession(
    @CurrentUser('sub') teacherId: string,
    @Body() body: { moduleId: string; classId: string; sectionId?: string },
  ) {
    return this.service.startSession(teacherId, body);
  }

  @Patch('sessions/:id/complete')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  completeSession(
    @Param('id') id: string,
    @CurrentUser('sub') teacherId: string,
    @Body() body: { remarks?: string },
  ) {
    return this.service.completeSession(id, teacherId, body.remarks);
  }

  @Patch('sessions/:id/pause')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  pauseSession(
    @Param('id') id: string,
    @CurrentUser('sub') teacherId: string,
  ) {
    return this.service.pauseSession(id, teacherId);
  }

  @Patch('sessions/:id/resume')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  resumeSession(
    @Param('id') id: string,
    @CurrentUser('sub') teacherId: string,
  ) {
    return this.service.resumeSession(id, teacherId);
  }

  @Post('sessions/:id/cover-item')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  coverItem(
    @Param('id') sessionId: string,
    @CurrentUser('sub') teacherId: string,
    @Body()
    body: {
      moduleItemId: string;
      method?: string;
      duration?: number;
      notes?: string;
    },
  ) {
    return this.service.coverItem(sessionId, teacherId, body);
  }

  @Get('sessions')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  listSessions(
    @CurrentUser('sub') teacherId: string,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listSessions(teacherId, { classId, status });
  }

  @Get('dashboard')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  getDashboard(@CurrentUser('sub') teacherId: string) {
    return this.service.getDashboard(teacherId);
  }

  @Get('sessions/:id')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  getSessionDetail(@Param('id') id: string) {
    return this.service.getSessionDetail(id);
  }

  @Get('sessions/:id/progress')
  @Roles(
    'SUPER_ADMIN',
    'ACADEMIC_COORDINATOR',
    'CLASS_TEACHER',
    'SUBJECT_TEACHER',
  )
  getSessionProgress(@Param('id') id: string) {
    return this.service.getSessionProgress(id);
  }
}

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
import { LiveClassesService } from './live-classes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Live Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('live-classes')
export class LiveClassesController {
  constructor(private readonly service: LiveClassesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  schedule(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.schedule({
      ...dto,
      teacherId: dto.teacherId || user.sub,
      schoolId: dto.schoolId || user.schoolId,
    });
  }

  @Get()
  findAll(
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({ schoolId, classId, teacherId, status });
  }

  @Get('upcoming')
  getUpcoming(@Query('schoolId') schoolId: string) {
    return this.service.getUpcoming(schoolId);
  }

  @Get('recordings')
  getRecordings(@Query('schoolId') schoolId: string) {
    return this.service.getRecordings(schoolId);
  }

  @Get('class/:classId')
  getByClass(@Param('classId') classId: string) {
    return this.service.getByClass(classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/start')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  start(@Param('id') id: string) {
    return this.service.start(id);
  }

  @Patch(':id/end')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  end(@Param('id') id: string, @Body('recordingUrl') recordingUrl?: string) {
    return this.service.end(id, recordingUrl);
  }

  @Patch(':id/cancel')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Post(':id/attend')
  attend(@Param('id') liveClassId: string, @Body('studentId') studentId: string) {
    return this.service.recordAttendance(liveClassId, studentId);
  }
}

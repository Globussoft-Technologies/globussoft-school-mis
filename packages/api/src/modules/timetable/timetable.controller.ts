import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private timetableService: TimetableService) {}

  @Get()
  findByClassSection(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
  ) {
    return this.timetableService.findByClassSection(classId, sectionId);
  }

  @Get('teacher-subjects')
  @ApiOperation({ summary: 'Get subjects with assigned teachers for a class' })
  getTeacherSubjects(@Query('classId') classId: string) {
    return this.timetableService.getTeacherSubjects(classId);
  }

  @Post('teacher-subjects')
  @ApiOperation({ summary: 'Save teacher-subject assignments' })
  saveTeacherSubjects(
    @Body() body: { assignments: { subjectId: string; teacherId: string }[] },
  ) {
    return this.timetableService.saveTeacherSubjects(body.assignments);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timetableService.findById(id);
  }

  @Patch('slots/:id')
  @ApiOperation({ summary: 'Update a timetable slot' })
  updateSlot(
    @Param('id') id: string,
    @Body()
    body: {
      subjectId?: string | null;
      teacherId?: string | null;
      room?: string | null;
      type?: string;
    },
  ) {
    return this.timetableService.updateSlot(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a timetable' })
  deleteTimetable(@Param('id') id: string) {
    return this.timetableService.deleteTimetable(id);
  }
}

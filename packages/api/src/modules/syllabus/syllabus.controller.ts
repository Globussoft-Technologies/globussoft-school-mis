import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SyllabusService } from './syllabus.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Syllabus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('syllabus')
export class SyllabusController {
  constructor(private syllabusService: SyllabusService) {}

  @Get()
  findAll(@Query('classId') classId?: string, @Query('academicSessionId') academicSessionId?: string) {
    return this.syllabusService.findAll(classId, academicSessionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.syllabusService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  create(@Body() body: { subjectId: string; classId: string; academicSessionId: string; chapters?: any[] }) {
    return this.syllabusService.create(body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  remove(@Param('id') id: string) {
    return this.syllabusService.deleteSyllabus(id);
  }

  @Post(':id/chapters')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  addChapter(@Param('id') id: string, @Body() body: { title: string; estimatedHours?: number }) {
    return this.syllabusService.addChapter(id, body);
  }

  @Patch('chapters/:chapterId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  updateChapter(@Param('chapterId') id: string, @Body() body: { title?: string; estimatedHours?: number }) {
    return this.syllabusService.updateChapter(id, body);
  }

  @Delete('chapters/:chapterId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  deleteChapter(@Param('chapterId') id: string) {
    return this.syllabusService.deleteChapter(id);
  }

  @Post('chapters/:chapterId/topics')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  addTopic(@Param('chapterId') id: string, @Body() body: { title: string; estimatedMinutes?: number }) {
    return this.syllabusService.addTopic(id, body);
  }

  @Patch('topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  updateTopic(@Param('topicId') id: string, @Body() body: { title?: string; estimatedMinutes?: number }) {
    return this.syllabusService.updateTopic(id, body);
  }

  @Delete('topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  deleteTopic(@Param('topicId') id: string) {
    return this.syllabusService.deleteTopic(id);
  }
}

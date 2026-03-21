import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GradingService } from './grading.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Grading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grading')
export class GradingController {
  constructor(private gradingService: GradingService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  create(@Body() dto: CreateGradeDto, @CurrentUser('sub') userId: string) {
    return this.gradingService.create(dto, userId);
  }

  @Post('bulk')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  bulkCreate(@Body() body: { grades: CreateGradeDto[] }, @CurrentUser('sub') userId: string) {
    return this.gradingService.bulkCreate(body.grades, userId);
  }

  @Get('student/:studentId')
  getStudentGrades(
    @Param('studentId') studentId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.gradingService.getStudentGrades(studentId, subjectId);
  }

  @Get('class')
  getClassGrades(
    @Query('classId') classId: string,
    @Query('subjectId') subjectId: string,
    @Query('assessmentId') assessmentId?: string,
  ) {
    return this.gradingService.getClassGrades(classId, subjectId, assessmentId);
  }
}

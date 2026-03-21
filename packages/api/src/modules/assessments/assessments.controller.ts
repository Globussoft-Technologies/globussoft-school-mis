import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  create(@Body() dto: CreateAssessmentDto, @CurrentUser('sub') userId: string) {
    return this.assessmentsService.create(dto, userId);
  }

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('type') type?: string,
    @Query('academicSessionId') academicSessionId?: string,
  ) {
    return this.assessmentsService.findAll({ classId, subjectId, type, academicSessionId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findById(id);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  publish(@Param('id') id: string) {
    return this.assessmentsService.publish(id);
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitAssessmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    // In production, resolve studentId from userId
    return this.assessmentsService.submit({ ...dto, assessmentId: id }, dto.studentId, userId);
  }

  @Get(':id/submissions')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  getSubmissions(@Param('id') id: string) {
    return this.assessmentsService.getSubmissions(id);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() body: { totalMarks: number; feedback: string },
  ) {
    return this.assessmentsService.gradeSubmission(submissionId, body.totalMarks, body.feedback);
  }
}

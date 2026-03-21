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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  create(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.assignmentsService.create(dto, userId);
  }

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('academicSessionId') academicSessionId?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    return this.assignmentsService.findAll({
      classId,
      subjectId,
      teacherId,
      academicSessionId,
      isPublished,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findById(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAssignmentDto>) {
    return this.assignmentsService.update(id, dto);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  publish(@Param('id') id: string) {
    return this.assignmentsService.publish(id);
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.assignmentsService.submit(id, dto, userId);
  }

  @Get(':id/submissions')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  getSubmissions(@Param('id') id: string) {
    return this.assignmentsService.getSubmissions(id);
  }

  @Patch('submissions/:id/grade')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  gradeSubmission(
    @Param('id') submissionId: string,
    @Body() body: { marksAwarded: number; feedback: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.assignmentsService.gradeSubmission(
      submissionId,
      body.marksAwarded,
      body.feedback,
      userId,
    );
  }
}

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
import { RubricsService } from './rubrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Rubrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rubrics')
export class RubricsController {
  constructor(private readonly service: RubricsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRubric({
      ...dto,
      createdBy: user.sub,
      schoolId: dto.schoolId || user.schoolId,
    });
  }

  @Get()
  findAll(
    @Query('schoolId') schoolId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.getRubrics({ schoolId, subjectId });
  }

  @Get('student/:studentId')
  getStudentAssessments(@Param('studentId') studentId: string) {
    return this.service.getStudentRubricAssessments(studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.getRubricById(id);
  }

  @Post(':id/assess')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  assess(
    @Param('id') rubricId: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.assessWithRubric(rubricId, {
      ...dto,
      assessedBy: user.sub,
    });
  }

  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.service.getRubricResults(id);
  }
}

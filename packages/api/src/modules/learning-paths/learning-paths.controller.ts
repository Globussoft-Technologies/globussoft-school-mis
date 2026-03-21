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
import { LearningPathsService } from './learning-paths.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Learning Paths')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly service: LearningPathsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPath({
      ...dto,
      createdBy: user.sub,
      schoolId: dto.schoolId || user.schoolId,
    });
  }

  @Get()
  findAll(
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    return this.service.getPaths({ schoolId, classId, subjectId, isPublished });
  }

  @Get('student/:studentId')
  getStudentPaths(@Param('studentId') studentId: string) {
    return this.service.getStudentPaths(studentId);
  }

  @Get('recommended/:studentId')
  getRecommended(@Param('studentId') studentId: string) {
    return this.service.getRecommendedPaths(studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('studentId') studentId?: string) {
    return this.service.getPathDetail(id, studentId);
  }

  @Post(':id/enroll')
  enroll(@Param('id') pathId: string, @Body('studentId') studentId: string) {
    return this.service.enroll(pathId, studentId);
  }

  @Post(':id/advance')
  advance(
    @Param('id') pathId: string,
    @Body('studentId') studentId: string,
  ) {
    return this.service.advanceStep(pathId, studentId);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER')
  publish(@Param('id') id: string, @Body('isPublished') isPublished: boolean) {
    return this.service.publishPath(id, isPublished);
  }
}

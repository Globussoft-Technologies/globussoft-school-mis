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
import { CourseModulesService } from './course-modules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Course Modules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('course-modules')
export class CourseModulesController {
  constructor(private readonly service: CourseModulesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  create(@Body() body: any, @CurrentUser('sub') userId: string) {
    return this.service.createModule({ ...body, createdBy: userId });
  }

  @Get()
  getModules(
    @Query('classId') classId: string,
    @Query('subjectId') subjectId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.service.getModulesBySubject(classId, subjectId, studentId);
  }

  @Get('progress/:studentId')
  getStudentProgress(
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.getStudentProgress(studentId, classId, subjectId);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @Query('studentId') studentId?: string) {
    return this.service.getModuleDetail(id, studentId);
  }

  @Get(':id/unlock-status')
  checkUnlock(@Param('id') id: string, @Query('studentId') studentId: string) {
    return this.service.checkUnlockStatus(id, studentId);
  }

  @Post(':id/items')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  addItem(@Param('id') moduleId: string, @Body() body: any) {
    return this.service.addItemToModule(moduleId, body);
  }

  @Post('items/:itemId/complete')
  completeItem(
    @Param('itemId') itemId: string,
    @Body() body: { studentId: string; score?: number },
  ) {
    return this.service.completeItem(itemId, body.studentId, body.score);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  publishModule(@Param('id') id: string, @Body('isPublished') isPublished: boolean) {
    return this.service.publishModule(id, isPublished);
  }

  @Patch(':id/reorder')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  reorder(@Body() body: { classId: string; subjectId: string; moduleIds: string[] }) {
    return this.service.reorderModules(body.classId, body.subjectId, body.moduleIds);
  }
}

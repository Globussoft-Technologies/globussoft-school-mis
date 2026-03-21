import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LmsContentService } from './lms-content.service';
import { CreateLmsContentDto } from './dto/create-lms-content.dto';
import { UpdateLmsContentDto } from './dto/update-lms-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('LMS Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lms-content')
export class LmsContentController {
  constructor(private lmsContentService: LmsContentService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  create(@Body() dto: CreateLmsContentDto, @CurrentUser('sub') userId: string) {
    return this.lmsContentService.create(dto, userId);
  }

  @Get()
  findAll(
    @Query('subjectId') subjectId?: string,
    @Query('classId') classId?: string,
    @Query('type') type?: string,
  ) {
    return this.lmsContentService.findAll({ subjectId, classId, type });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lmsContentService.findById(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  update(@Param('id') id: string, @Body() dto: UpdateLmsContentDto) {
    return this.lmsContentService.update(id, dto);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  publish(@Param('id') id: string) {
    return this.lmsContentService.publish(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  remove(@Param('id') id: string) {
    return this.lmsContentService.delete(id);
  }
}

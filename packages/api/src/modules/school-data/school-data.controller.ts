import {
  Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { SchoolDataService } from './school-data.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('School Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SchoolDataController {
  constructor(
    private prisma: PrismaService,
    private schoolDataService: SchoolDataService,
  ) {}

  // ─── Classes ──────────────────────────────────────────────────────────────

  @Get('classes')
  @ApiOperation({ summary: 'List classes (lightweight for dropdowns)' })
  async getClasses() {
    return this.prisma.class.findMany({
      orderBy: { grade: 'asc' },
      select: { id: true, name: true, grade: true },
    });
  }

  @Get('classes/detailed')
  @ApiOperation({ summary: 'List classes with full stats (sections, subjects, counts)' })
  async getClassesDetailed(@CurrentUser('schoolId') schoolId: string) {
    return this.schoolDataService.getClassesWithStats(schoolId);
  }

  @Post('classes')
  @ApiOperation({ summary: 'Create a new class' })
  async createClass(
    @Body() body: { name: string; grade: number; schoolId?: string },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.schoolDataService.createClass(body.name, body.grade, body.schoolId ?? schoolId);
  }

  @Patch('classes/:id')
  @ApiOperation({ summary: 'Update a class' })
  async updateClass(
    @Param('id') id: string,
    @Body() body: { name?: string; grade?: number },
  ) {
    return this.schoolDataService.updateClass(id, body.name, body.grade);
  }

  @Delete('classes/:id')
  @ApiOperation({ summary: 'Delete a class (only if no students)' })
  async deleteClass(@Param('id') id: string) {
    return this.schoolDataService.deleteClass(id);
  }

  // ─── Sections ─────────────────────────────────────────────────────────────

  @Get('sections')
  @ApiOperation({ summary: 'List sections by classId' })
  async getSections(@Query('classId') classId: string) {
    return this.prisma.section.findMany({
      where: { classId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, classId: true, capacity: true },
    });
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create a new section' })
  async createSection(
    @Body() body: { name: string; classId: string; capacity?: number },
  ) {
    return this.schoolDataService.createSection(body.name, body.classId, body.capacity);
  }

  @Patch('sections/:id')
  @ApiOperation({ summary: 'Update a section' })
  async updateSection(
    @Param('id') id: string,
    @Body() body: { name?: string; capacity?: number },
  ) {
    return this.schoolDataService.updateSection(id, body.name, body.capacity);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: 'Delete a section (only if no students)' })
  async deleteSection(@Param('id') id: string) {
    return this.schoolDataService.deleteSection(id);
  }

  // ─── Subjects ─────────────────────────────────────────────────────────────

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects by optional classId' })
  async getSubjects(@Query('classId') classId?: string) {
    return this.prisma.subject.findMany({
      where: classId ? { classId } : undefined,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, classId: true, isElective: true, description: true },
    });
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create a new subject' })
  async createSubject(
    @Body() body: { name: string; code: string; classId: string; isElective?: boolean; description?: string },
  ) {
    return this.schoolDataService.createSubject(
      body.name, body.code, body.classId, body.isElective, body.description,
    );
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Update a subject' })
  async updateSubject(
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; isElective?: boolean; description?: string },
  ) {
    return this.schoolDataService.updateSubject(id, body.name, body.code, body.isElective, body.description);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Delete a subject' })
  async deleteSubject(@Param('id') id: string) {
    return this.schoolDataService.deleteSubject(id);
  }

  // ─── Academic Sessions ────────────────────────────────────────────────────

  @Get('academic-sessions')
  @ApiOperation({ summary: 'List academic sessions' })
  async getSessions(@CurrentUser('schoolId') schoolId: string) {
    return this.prisma.academicSession.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true, status: true, startDate: true, endDate: true },
    });
  }
}

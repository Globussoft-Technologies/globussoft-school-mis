import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExamScheduleService } from './exam-schedule.service';
import { CreateExamScheduleDto, CreateExamScheduleEntryDto } from './dto/create-exam-schedule.dto';
import { UpdateExamScheduleDto } from './dto/update-exam-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Exam Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam-schedules')
export class ExamScheduleController {
  constructor(private examScheduleService: ExamScheduleService) {}

  /**
   * GET /exam-schedules?classId=&type=&status=
   * List all exam schedules with optional filters.
   */
  @Get()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'PARENT', 'STUDENT')
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('classId') classId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.examScheduleService.findAll({ classId, type, status });
  }

  /**
   * GET /exam-schedules/:id
   * Get a single exam schedule with all entries.
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'PARENT', 'STUDENT')
  findOne(@Param('id') id: string) {
    return this.examScheduleService.findOne(id);
  }

  /**
   * POST /exam-schedules
   * Create a new exam schedule (optionally with entries).
   */
  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  create(@Body() dto: CreateExamScheduleDto) {
    return this.examScheduleService.create(dto);
  }

  /**
   * PATCH /exam-schedules/:id
   * Update schedule metadata.
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  update(@Param('id') id: string, @Body() dto: UpdateExamScheduleDto) {
    return this.examScheduleService.update(id, dto);
  }

  /**
   * DELETE /exam-schedules/:id
   * Delete a schedule (cascades entries).
   */
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  remove(@Param('id') id: string) {
    return this.examScheduleService.remove(id);
  }

  /**
   * POST /exam-schedules/:id/entries
   * Add an entry to an existing schedule.
   */
  @Post(':id/entries')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  addEntry(@Param('id') scheduleId: string, @Body() dto: CreateExamScheduleEntryDto) {
    return this.examScheduleService.addEntry(scheduleId, dto);
  }

  /**
   * DELETE /exam-schedules/:id/entries/:entryId
   * Remove an entry from a schedule.
   */
  @Delete(':id/entries/:entryId')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  removeEntry(@Param('id') scheduleId: string, @Param('entryId') entryId: string) {
    return this.examScheduleService.removeEntry(scheduleId, entryId);
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private timetableService: TimetableService) {}

  @Get()
  findByClassSection(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
  ) {
    return this.timetableService.findByClassSection(classId, sectionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timetableService.findById(id);
  }
}

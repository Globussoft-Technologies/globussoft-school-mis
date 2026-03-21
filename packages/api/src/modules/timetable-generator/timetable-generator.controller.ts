import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TimetableGeneratorService } from './timetable-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Timetable Generator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable-generator')
export class TimetableGeneratorController {
  constructor(private timetableGeneratorService: TimetableGeneratorService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Auto-generate timetable for a class/section' })
  generate(
    @Body()
    body: {
      classId: string;
      sectionId: string;
      academicSessionId: string;
    },
  ) {
    return this.timetableGeneratorService.generateTimetable(
      body.classId,
      body.sectionId,
      body.academicSessionId,
    );
  }

  @Post('validate/:id')
  @ApiOperation({ summary: 'Validate an existing timetable for conflicts' })
  validate(@Param('id') id: string) {
    return this.timetableGeneratorService.validateTimetable(id);
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Get all timetable conflicts, optionally filtered by classId' })
  conflicts(@Query('classId') classId?: string) {
    return this.timetableGeneratorService.getConflicts(classId);
  }
}

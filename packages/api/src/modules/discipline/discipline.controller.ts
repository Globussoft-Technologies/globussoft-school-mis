import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DisciplineService } from './discipline.service';
import { LogIncidentDto } from './dto/log-incident.dto';
import { CreateActionDto } from './dto/create-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Discipline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discipline')
export class DisciplineController {
  constructor(private disciplineService: DisciplineService) {}

  @Post('incidents')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Log a new disciplinary incident' })
  logIncident(
    @Body() dto: LogIncidentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.disciplineService.logIncident(dto, userId);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Get incidents with optional filters' })
  getIncidents(
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
  ) {
    return this.disciplineService.getIncidents({ studentId, classId, status, severity, type });
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get a single incident by ID' })
  getIncident(@Param('id') id: string) {
    return this.disciplineService.getIncidentById(id);
  }

  @Patch('incidents/:id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Update incident status' })
  updateIncidentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.disciplineService.updateIncidentStatus(id, status);
  }

  @Post('actions')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CLASS_TEACHER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Create a disciplinary action for an incident' })
  createAction(
    @Body() dto: CreateActionDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.disciplineService.createAction(dto, userId);
  }

  @Get('red-flags')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'CLASS_TEACHER')
  @ApiOperation({ summary: 'Get red flag records' })
  getRedFlags(
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.disciplineService.getRedFlags({ studentId, status });
  }

  @Patch('red-flags/:id/resolve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Resolve a red flag' })
  resolveRedFlag(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.disciplineService.resolveRedFlag(id, userId);
  }
}

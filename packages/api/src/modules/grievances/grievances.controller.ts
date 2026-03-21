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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GrievancesService } from './grievances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Grievances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grievances')
export class GrievancesController {
  constructor(private grievancesService: GrievancesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a grievance' })
  submit(
    @Body()
    body: {
      category: string;
      subject: string;
      description: string;
      priority?: string;
    },
    @CurrentUser('sub') submittedBy: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.grievancesService.submit({ ...body, submittedBy, schoolId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all grievances with optional filters' })
  findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.grievancesService.findAll({ schoolId, status, category, priority, assignedTo });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get grievance statistics' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.grievancesService.getStats(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single grievance by id' })
  findOne(@Param('id') id: string) {
    return this.grievancesService.findOne(id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign grievance to a staff member' })
  assign(
    @Param('id') id: string,
    @Body() body: { assignedTo: string },
  ) {
    return this.grievancesService.assign(id, body.assignedTo);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update grievance status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.grievancesService.updateStatus(id, body.status);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve a grievance with resolution text' })
  resolve(
    @Param('id') id: string,
    @Body() body: { resolution: string },
  ) {
    return this.grievancesService.resolve(id, body.resolution);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close a grievance' })
  close(@Param('id') id: string) {
    return this.grievancesService.close(id);
  }

  @Patch(':id/reopen')
  @ApiOperation({ summary: 'Reopen a resolved/closed grievance' })
  reopen(@Param('id') id: string) {
    return this.grievancesService.reopen(id);
  }
}

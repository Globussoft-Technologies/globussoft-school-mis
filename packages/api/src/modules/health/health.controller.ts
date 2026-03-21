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
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Post('records')
  upsertRecord(@Body() body: any) {
    return this.healthService.upsertHealthRecord(body);
  }

  @Get('records/:studentId')
  getRecord(@Param('studentId') studentId: string) {
    return this.healthService.getHealthRecord(studentId);
  }

  @Post('incidents')
  logIncident(@Body() body: any) {
    return this.healthService.logIncident(body);
  }

  @Get('incidents')
  getIncidents(
    @Query('studentId') studentId?: string,
    @Query('date') date?: string,
    @Query('type') type?: string,
  ) {
    return this.healthService.getIncidents({ studentId, date, type });
  }

  @Get('allergies')
  getStudentsWithAllergies() {
    return this.healthService.getStudentsWithAllergies();
  }
}

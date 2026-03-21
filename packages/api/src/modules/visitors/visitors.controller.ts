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
import { VisitorsService } from './visitors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Visitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(private visitorsService: VisitorsService) {}

  @Post('check-in')
  checkIn(@Body() body: any) {
    return this.visitorsService.checkIn(body);
  }

  @Patch(':id/check-out')
  checkOut(@Param('id') id: string) {
    return this.visitorsService.checkOut(id);
  }

  @Get()
  findAll(
    @Query('date') date?: string,
    @Query('purpose') purpose?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.visitorsService.findAll({ date, purpose, schoolId });
  }

  @Get('today')
  getTodaysVisitors(@Query('schoolId') schoolId?: string) {
    return this.visitorsService.getTodaysVisitors(schoolId);
  }

  @Get('active')
  getActiveVisitors(@Query('schoolId') schoolId?: string) {
    return this.visitorsService.getActiveVisitors(schoolId);
  }
}

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
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Post()
  create(@Body() body: any) {
    return this.meetingsService.create(body);
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.meetingsService.findAll({ type, status, schoolId });
  }

  @Get('upcoming')
  getUpcoming(@Query('schoolId') schoolId?: string) {
    return this.meetingsService.getUpcoming(schoolId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.meetingsService.update(id, body);
  }

  @Patch(':id/circulate')
  circulate(@Param('id') id: string) {
    return this.meetingsService.circulate(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.meetingsService.approve(id);
  }
}

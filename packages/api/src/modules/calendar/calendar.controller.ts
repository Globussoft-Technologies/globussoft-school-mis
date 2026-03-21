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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Create a calendar event' })
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.calendarService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get calendar events, optionally filtered by month/year/type' })
  findAll(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('type') type?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.calendarService.findAll({ month, year, type, schoolId });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events in the next 30 days' })
  getUpcoming(@Query('schoolId') schoolId?: string) {
    return this.calendarService.getUpcoming(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single calendar event by ID' })
  findOne(@Param('id') id: string) {
    return this.calendarService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Update a calendar event' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.calendarService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Delete a calendar event' })
  remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }
}

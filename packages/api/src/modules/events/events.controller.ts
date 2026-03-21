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
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a school event' })
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      type: string;
      startDate: string;
      endDate?: string;
      venue?: string;
      organizer?: string;
      budget?: number;
      maxParticipants?: number;
    },
    @CurrentUser('sub') createdBy: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.eventsService.create({ ...body, createdBy, schoolId });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  upcoming(
    @CurrentUser('schoolId') schoolId: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventsService.getUpcomingEvents(schoolId, limit ? parseInt(limit) : 10);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filters' })
  findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.eventsService.findAll(schoolId, type, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by id' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      venue?: string;
      organizer?: string;
      budget?: number;
      maxParticipants?: number;
    },
  ) {
    return this.eventsService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update event status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.eventsService.updateStatus(id, body.status);
  }

  @Post(':id/register')
  @ApiOperation({ summary: 'Register current user for an event' })
  register(
    @Param('id') eventId: string,
    @Body() body: { userId?: string; role?: string },
    @CurrentUser('sub') currentUserId: string,
  ) {
    const userId = body.userId ?? currentUserId;
    return this.eventsService.registerParticipant(eventId, userId, body.role);
  }

  @Delete(':id/register/:userId')
  @ApiOperation({ summary: 'Cancel a registration' })
  cancelRegistration(
    @Param('id') eventId: string,
    @Param('userId') userId: string,
  ) {
    return this.eventsService.cancelRegistration(eventId, userId);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get event participants' })
  getParticipants(@Param('id') id: string) {
    return this.eventsService.getEventParticipants(id);
  }

  @Patch(':id/attend/:userId')
  @ApiOperation({ summary: 'Mark a participant as attended' })
  markAttended(
    @Param('id') eventId: string,
    @Param('userId') userId: string,
  ) {
    return this.eventsService.markAttended(eventId, userId);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get event statistics' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.eventsService.getEventStats(schoolId);
  }
}

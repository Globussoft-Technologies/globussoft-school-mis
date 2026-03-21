import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationTriggersService } from './notification-triggers.service';

class AbsentAlertDto {
  @IsString()
  studentId: string;

  @IsDateString()
  date: string;
}

class FeeReminderDto {
  @IsString()
  studentId: string;

  @IsString()
  feeHeadId: string;
}

class BulkAbsentDto {
  @IsDateString()
  date: string;
}

@ApiTags('Notification Triggers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-triggers')
export class NotificationTriggersController {
  constructor(private readonly triggersService: NotificationTriggersService) {}

  @Post('absent-alert')
  @Roles('ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Trigger an absent notification for a specific student on a date' })
  async triggerAbsentAlert(@Body() dto: AbsentAlertDto) {
    return this.triggersService.triggerAbsentNotification(dto.studentId, dto.date);
  }

  @Post('fee-reminders')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Trigger a fee reminder for a student and fee head' })
  async triggerFeeReminder(@Body() dto: FeeReminderDto) {
    return this.triggersService.triggerFeeReminder(dto.studentId, dto.feeHeadId);
  }

  @Post('test-results/:assessmentId')
  @Roles('ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Trigger test result notifications for all students in an assessment' })
  async triggerTestResults(@Param('assessmentId') assessmentId: string) {
    // Fetch all graded submissions for the assessment and send notifications
    return this.triggersService.triggerAllTestResultsForAssessment(assessmentId);
  }

  @Post('bulk-absent')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Trigger bulk absent notifications for all absent students on a date (defaults to today)' })
  async triggerBulkAbsent(@Body() dto: BulkAbsentDto) {
    const date = dto.date ?? new Date().toISOString().split('T')[0];
    return this.triggersService.triggerBulkAbsentNotifications(date);
  }
}

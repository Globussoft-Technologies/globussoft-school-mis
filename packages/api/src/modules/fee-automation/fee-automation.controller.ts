import {
  Controller, Get, Post, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FeeAutomationService } from './fee-automation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Fee Automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fee-automation')
export class FeeAutomationController {
  constructor(private readonly feeAutomationService: FeeAutomationService) {}

  @Post('check-defaulters')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Trigger defaulter check — scans fee heads and creates defaulter records' })
  checkDefaulters() {
    return this.feeAutomationService.checkAndCreateDefaulters();
  }

  @Post('send-reminders')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Trigger bulk reminder generation for all active defaulters' })
  sendReminders() {
    return this.feeAutomationService.generateReminders();
  }

  @Get('summary')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get defaulter analytics summary' })
  getSummary() {
    return this.feeAutomationService.getDefaulterSummary();
  }

  @Post('remind/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Send reminder to a specific defaulter' })
  remindDefaulter(@Param('id') id: string) {
    return this.feeAutomationService.sendReminder(id);
  }
}

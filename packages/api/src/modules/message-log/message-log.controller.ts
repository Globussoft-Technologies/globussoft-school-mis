import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessageLogService } from './message-log.service';
import { LogMessageDto } from './dto/log-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Message Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('message-logs')
export class MessageLogController {
  constructor(private readonly messageLogService: MessageLogService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Log a new message' })
  create(@Body() dto: LogMessageDto) {
    return this.messageLogService.logMessage(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all message logs with optional filters' })
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.messageLogService.getAll({ type, status, startDate, endDate });
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get message log stats' })
  getStats() {
    return this.messageLogService.getStats();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get a single message log' })
  findOne(@Param('id') id: string) {
    return this.messageLogService.findOne(id);
  }

  @Patch(':id/retry')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retry a failed message' })
  retry(@Param('id') id: string) {
    return this.messageLogService.retry(id);
  }
}

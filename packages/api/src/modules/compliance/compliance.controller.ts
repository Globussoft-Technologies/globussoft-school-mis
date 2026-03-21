import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { RecordDeliveryDto } from './dto/record-delivery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Post('delivery')
  @Roles('CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR', 'SUPER_ADMIN')
  recordDelivery(@Body() dto: RecordDeliveryDto, @CurrentUser('sub') userId: string) {
    return this.complianceService.recordDelivery(dto, userId);
  }

  @Get('deliveries')
  getDeliveries(
    @Query('teacherId') teacherId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.complianceService.getDeliveries({ teacherId, startDate, endDate });
  }

  @Get('report')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'ACADEMIC_COORDINATOR')
  getReport(
    @Query('classId') classId: string,
    @Query('academicSessionId') academicSessionId: string,
  ) {
    return this.complianceService.getComplianceReport(classId, academicSessionId);
  }
}

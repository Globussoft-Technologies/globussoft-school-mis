import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { CreateFeeHeadDto } from './dto/create-fee-head.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateDefaulterDto } from './dto/update-defaulter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Fees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fees')
export class FeesController {
  constructor(private feesService: FeesService) {}

  @Post('heads')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create a fee head' })
  createFeeHead(@Body() dto: CreateFeeHeadDto) {
    return this.feesService.createFeeHead(dto);
  }

  @Get('heads')
  @ApiOperation({ summary: 'Get fee heads with optional filters' })
  getFeeHeads(
    @Query('classId') classId?: string,
    @Query('academicSessionId') academicSessionId?: string,
  ) {
    return this.feesService.getAllFeeHeads({ classId, academicSessionId });
  }

  @Post('payments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Record a fee payment' })
  recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.feesService.recordPayment(dto, userId);
  }

  @Get('payments/:studentId')
  @ApiOperation({ summary: 'Get all payments for a student' })
  getStudentPayments(@Param('studentId') studentId: string) {
    return this.feesService.getStudentPayments(studentId);
  }

  @Get('defaulters')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get defaulter records' })
  getDefaulters(
    @Query('status') status?: string,
    @Query('academicSessionId') academicSessionId?: string,
  ) {
    return this.feesService.getDefaulters({ status, academicSessionId });
  }

  @Patch('defaulters/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Update defaulter record status' })
  updateDefaulter(
    @Param('id') id: string,
    @Body() dto: UpdateDefaulterDto,
  ) {
    return this.feesService.updateDefaulterStatus(id, dto);
  }
}

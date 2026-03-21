import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConcessionsService } from './concessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Concessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('concessions')
export class ConcessionsController {
  constructor(private concessionsService: ConcessionsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACCOUNTANT', 'PRINCIPAL')
  @ApiOperation({ summary: 'Create a new concession request' })
  create(
    @Body()
    body: {
      studentId: string;
      feeHeadId: string;
      type: string;
      reason: string;
      discountPercent?: number;
      discountAmount?: number;
    },
  ) {
    return this.concessionsService.create(
      body.studentId,
      body.feeHeadId,
      body.type,
      body.reason,
      body.discountPercent,
      body.discountAmount,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List concessions with optional filters' })
  findAll(
    @Query('studentId') studentId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.concessionsService.findAll(studentId, type, status);
  }

  @Patch(':id/approve')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACCOUNTANT', 'PRINCIPAL', 'DIRECTOR')
  @ApiOperation({ summary: 'Approve or reject a concession request' })
  approve(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
    @CurrentUser('sub') userId: string,
  ) {
    return this.concessionsService.approve(id, userId, body.status);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all concessions for a student' })
  getStudentConcessions(@Param('studentId') studentId: string) {
    return this.concessionsService.getStudentConcessions(studentId);
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate effective fee after concessions for a student + fee head' })
  calculateEffectiveFee(
    @Query('studentId') studentId: string,
    @Query('feeHeadId') feeHeadId: string,
  ) {
    return this.concessionsService.calculateEffectiveFee(studentId, feeHeadId);
  }
}

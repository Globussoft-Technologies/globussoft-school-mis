import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  @Post('generate')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Generate promotion records for all students in a class' })
  generatePromotions(
    @Body() body: { classId: string; academicSessionId: string },
  ) {
    return this.promotionsService.generatePromotions(body.classId, body.academicSessionId);
  }

  @Patch(':id/process')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Process (approve/retain) a single promotion' })
  processPromotion(
    @Param('id') id: string,
    @Body() body: { status: string; toClassId?: string; toSectionId?: string; remarks?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.promotionsService.processPromotion(
      id,
      body.status,
      body.toClassId,
      body.toSectionId,
      body.remarks,
      userId,
    );
  }

  @Post('bulk-process')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Bulk auto-promote all eligible PENDING students in a class' })
  bulkProcess(
    @Body() body: { classId: string; academicSessionId: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.promotionsService.bulkProcess(body.classId, body.academicSessionId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List promotions with optional filters' })
  getPromotions(
    @Query('classId') classId?: string,
    @Query('academicSessionId') academicSessionId?: string,
    @Query('status') status?: string,
  ) {
    return this.promotionsService.getPromotions(classId, academicSessionId, status);
  }
}

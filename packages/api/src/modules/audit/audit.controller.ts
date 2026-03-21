import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /audit/logs
   * List audit logs with optional filters. Admin only.
   */
  @Get('logs')
  @Roles('SUPER_ADMIN', 'IT_ADMIN')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getLogs(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.auditService.getLogs(
      {
        userId,
        entity,
        action,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      Number(page),
      Number(limit),
    );
  }

  /**
   * GET /audit/logs/entity/:entity/:entityId
   * History for a specific record. Admin only.
   */
  @Get('logs/entity/:entity/:entityId')
  @Roles('SUPER_ADMIN', 'IT_ADMIN')
  getEntityHistory(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entity, entityId);
  }

  /**
   * GET /audit/logs/user/:userId
   * Recent activity for a user. Admin only.
   */
  @Get('logs/user/:userId')
  @Roles('SUPER_ADMIN', 'IT_ADMIN')
  @ApiQuery({ name: 'limit', required: false })
  getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit = '50',
  ) {
    return this.auditService.getUserActivity(userId, Number(limit));
  }
}

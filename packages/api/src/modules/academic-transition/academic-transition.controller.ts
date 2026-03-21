import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AcademicTransitionService } from './academic-transition.service';

@ApiTags('Academic Transition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academic-transition')
export class AcademicTransitionController {
  constructor(private readonly transitionService: AcademicTransitionService) {}

  @Post('new-session')
  @ApiOperation({ summary: 'Create a new academic session' })
  async createNewSession(
    @Body() body: { name: string; startDate: string; endDate: string; schoolId?: string },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.transitionService.createNewSession(
      body.name,
      body.startDate,
      body.endDate,
      body.schoolId ?? schoolId,
    );
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate an academic year transition' })
  async initiateTransition(
    @Body() body: { fromSessionId: string; toSessionId: string; schoolId?: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.transitionService.initiateTransition(
      body.fromSessionId,
      body.toSessionId,
      userId,
      body.schoolId ?? schoolId,
    );
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute an initiated academic year transition' })
  async executeTransition(@Param('id') id: string) {
    return this.transitionService.executeTransition(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all transitions for the school' })
  async getTransitions(@CurrentUser('schoolId') schoolId: string) {
    return this.transitionService.getTransitions(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transition status and details' })
  async getTransitionStatus(@Param('id') id: string) {
    return this.transitionService.getTransitionStatus(id);
  }
}

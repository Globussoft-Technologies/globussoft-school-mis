import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Surveys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('surveys')
export class SurveysController {
  constructor(private surveysService: SurveysService) {}

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.surveysService.createSurvey({
      ...body,
      createdBy: req.user?.userId || body.createdBy,
    });
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.surveysService.findAll({ type, status, schoolId });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.surveysService.findById(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.surveysService.activate(id);
  }

  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.surveysService.close(id);
  }

  @Post(':id/respond')
  respond(@Param('id') surveyId: string, @Body() body: any, @Request() req: any) {
    return this.surveysService.submitResponse({
      surveyId,
      respondentId: req.user?.userId || body.respondentId,
      answers: body.answers,
    });
  }

  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.surveysService.getSurveyResults(id);
  }
}

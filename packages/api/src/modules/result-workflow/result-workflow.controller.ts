import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ResultWorkflowService } from './result-workflow.service';

@Controller('result-workflow')
export class ResultWorkflowController {
  constructor(private readonly service: ResultWorkflowService) {}

  @Post('submit')
  submit(
    @Body()
    body: {
      classId: string;
      subjectId: string;
      sessionId: string;
      term: string;
      submittedBy: string;
      assessmentId?: string;
    },
  ) {
    return this.service.submit(
      body.classId,
      body.subjectId,
      body.sessionId,
      body.term,
      body.submittedBy,
      body.assessmentId,
    );
  }

  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body()
    body: {
      reviewedBy: string;
      status: 'UNDER_REVIEW' | 'REJECTED';
      remarks?: string;
    },
  ) {
    return this.service.review(id, body.reviewedBy, body.status, body.remarks);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { approvedBy: string },
  ) {
    return this.service.approve(id, body.approvedBy);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string; rejectedBy: string },
  ) {
    return this.service.reject(id, body.rejectionReason, body.rejectedBy);
  }

  @Get()
  getAll(
    @Query('classId') classId?: string,
    @Query('status') status?: string,
    @Query('term') term?: string,
  ) {
    return this.service.getAll({ classId, status, term });
  }

  @Get('status')
  getWorkflowStatus(
    @Query('classId') classId: string,
    @Query('subjectId') subjectId: string,
    @Query('term') term: string,
  ) {
    return this.service.getWorkflowStatus(classId, subjectId, term);
  }
}

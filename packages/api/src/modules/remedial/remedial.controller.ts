import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RemedialService } from './remedial.service';

@Controller('remedial')
export class RemedialController {
  constructor(private readonly service: RemedialService) {}

  @Post('check/:assessmentId')
  checkAndEnroll(@Param('assessmentId') assessmentId: string) {
    return this.service.checkAndEnroll(assessmentId);
  }

  @Get()
  getEnrollments(
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getEnrollments({ studentId, subjectId, status });
  }

  @Patch(':id/score')
  recordRemedialScore(
    @Param('id') id: string,
    @Body()
    body: {
      score: number;
      maxMarks: number;
      remarks?: string;
    },
  ) {
    return this.service.recordRemedialScore(id, body.score, body.maxMarks, body.remarks);
  }

  @Get('student/:studentId')
  getStudentRemedials(@Param('studentId') studentId: string) {
    return this.service.getStudentRemedials(studentId);
  }

  @Get('subject/:subjectId')
  getSubjectRemedials(@Param('subjectId') subjectId: string) {
    return this.service.getSubjectRemedials(subjectId);
  }
}

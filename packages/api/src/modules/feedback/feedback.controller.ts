import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      type: string;
      toUserId?: string;
      subjectId?: string;
      classId?: string;
      rating: number;
      comment?: string;
      isAnonymous?: boolean;
      academicSessionId?: string;
    },
  ) {
    return this.feedbackService.create({
      ...body,
      fromUserId: req.user.sub,
    });
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('toUserId') toUserId?: string,
    @Query('classId') classId?: string,
    @Query('fromUserId') fromUserId?: string,
    @Query('academicSessionId') academicSessionId?: string,
  ) {
    return this.feedbackService.findAll({
      type,
      toUserId,
      classId,
      fromUserId,
      academicSessionId,
    });
  }

  @Get('summary')
  getSummary(@Query('academicSessionId') academicSessionId?: string) {
    return this.feedbackService.getFeedbackSummary(academicSessionId);
  }

  @Get('teacher/:teacherId')
  getTeacherRatings(@Param('teacherId') teacherId: string) {
    return this.feedbackService.getTeacherRatings(teacherId);
  }

  @Get('subject/:subjectId')
  getSubjectFeedback(@Param('subjectId') subjectId: string) {
    return this.feedbackService.getSubjectFeedback(subjectId);
  }
}

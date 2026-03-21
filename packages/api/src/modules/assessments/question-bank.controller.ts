import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionBankService } from './question-bank.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Question Bank')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('question-bank')
export class QuestionBankController {
  constructor(private questionBankService: QuestionBankService) {}

  @Post('banks')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  createBank(@Body() body: { subjectId: string; name: string }) {
    return this.questionBankService.createBank(body.subjectId, body.name);
  }

  @Get('banks')
  getBanks(@Query('subjectId') subjectId?: string) {
    return this.questionBankService.getBanks(subjectId);
  }

  @Post('questions')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  addQuestion(@Body() dto: CreateQuestionDto) {
    return this.questionBankService.addQuestion(dto);
  }

  @Get('banks/:bankId/questions')
  getQuestions(
    @Param('bankId') bankId: string,
    @Query('type') type?: string,
    @Query('difficultyLevel') difficultyLevel?: string,
  ) {
    return this.questionBankService.getQuestions(bankId, { type, difficultyLevel });
  }

  @Patch('questions/:id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  updateQuestion(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>) {
    return this.questionBankService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  deleteQuestion(@Param('id') id: string) {
    return this.questionBankService.deleteQuestion(id);
  }
}

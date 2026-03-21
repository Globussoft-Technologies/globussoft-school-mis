import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { QuestionBankService } from './question-bank.service';
import { QuestionBankController } from './question-bank.controller';

@Module({
  controllers: [AssessmentsController, QuestionBankController],
  providers: [AssessmentsService, QuestionBankService],
  exports: [AssessmentsService, QuestionBankService],
})
export class AssessmentsModule {}

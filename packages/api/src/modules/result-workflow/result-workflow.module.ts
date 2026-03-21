import { Module } from '@nestjs/common';
import { ResultWorkflowService } from './result-workflow.service';
import { ResultWorkflowController } from './result-workflow.controller';

@Module({
  controllers: [ResultWorkflowController],
  providers: [ResultWorkflowService],
  exports: [ResultWorkflowService],
})
export class ResultWorkflowModule {}

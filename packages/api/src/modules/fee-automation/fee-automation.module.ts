import { Module } from '@nestjs/common';
import { FeeAutomationService } from './fee-automation.service';
import { FeeAutomationController } from './fee-automation.controller';

@Module({
  controllers: [FeeAutomationController],
  providers: [FeeAutomationService],
  exports: [FeeAutomationService],
})
export class FeeAutomationModule {}

import { Module } from '@nestjs/common';
import { TransportBillingService } from './transport-billing.service';
import { TransportBillingController } from './transport-billing.controller';

@Module({
  controllers: [TransportBillingController],
  providers: [TransportBillingService],
  exports: [TransportBillingService],
})
export class TransportBillingModule {}

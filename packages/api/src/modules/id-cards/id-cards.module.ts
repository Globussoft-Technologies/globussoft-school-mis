import { Module } from '@nestjs/common';
import { IdCardsService } from './id-cards.service';
import { IdCardsController } from './id-cards.controller';

@Module({
  controllers: [IdCardsController],
  providers: [IdCardsService],
  exports: [IdCardsService],
})
export class IdCardsModule {}

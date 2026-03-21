import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';

@Module({
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}

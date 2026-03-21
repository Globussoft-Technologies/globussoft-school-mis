import { Module } from '@nestjs/common';
import { SubstitutesService } from './substitutes.service';
import { SubstitutesController } from './substitutes.controller';

@Module({
  controllers: [SubstitutesController],
  providers: [SubstitutesService],
  exports: [SubstitutesService],
})
export class SubstitutesModule {}

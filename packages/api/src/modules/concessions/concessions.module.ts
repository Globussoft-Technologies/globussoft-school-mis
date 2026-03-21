import { Module } from '@nestjs/common';
import { ConcessionsService } from './concessions.service';
import { ConcessionsController } from './concessions.controller';

@Module({
  controllers: [ConcessionsController],
  providers: [ConcessionsService],
  exports: [ConcessionsService],
})
export class ConcessionsModule {}

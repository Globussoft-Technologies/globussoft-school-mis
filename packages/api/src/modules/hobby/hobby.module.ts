import { Module } from '@nestjs/common';
import { HobbyService } from './hobby.service';
import { HobbyController } from './hobby.controller';

@Module({
  controllers: [HobbyController],
  providers: [HobbyService],
  exports: [HobbyService],
})
export class HobbyModule {}

import { Module } from '@nestjs/common';
import { RemedialService } from './remedial.service';
import { RemedialController } from './remedial.controller';

@Module({
  controllers: [RemedialController],
  providers: [RemedialService],
  exports: [RemedialService],
})
export class RemedialModule {}

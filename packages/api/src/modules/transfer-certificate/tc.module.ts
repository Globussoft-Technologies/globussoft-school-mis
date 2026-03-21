import { Module } from '@nestjs/common';
import { TcService } from './tc.service';
import { TcController } from './tc.controller';

@Module({
  controllers: [TcController],
  providers: [TcService],
  exports: [TcService],
})
export class TcModule {}

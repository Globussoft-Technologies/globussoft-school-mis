import { Global, Module } from '@nestjs/common';
import { MessageLogService } from './message-log.service';
import { MessageLogController } from './message-log.controller';

@Global()
@Module({
  controllers: [MessageLogController],
  providers: [MessageLogService],
  exports: [MessageLogService],
})
export class MessageLogModule {}

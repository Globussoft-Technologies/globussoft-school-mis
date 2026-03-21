import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';

@Module({
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}

import { Module } from '@nestjs/common';
import { HostelService } from './hostel.service';
import { HostelController } from './hostel.controller';

@Module({
  controllers: [HostelController],
  providers: [HostelService],
  exports: [HostelService],
})
export class HostelModule {}

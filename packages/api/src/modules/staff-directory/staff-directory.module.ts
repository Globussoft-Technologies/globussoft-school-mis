import { Module } from '@nestjs/common';
import { StaffDirectoryService } from './staff-directory.service';
import { StaffDirectoryController } from './staff-directory.controller';

@Module({
  controllers: [StaffDirectoryController],
  providers: [StaffDirectoryService],
  exports: [StaffDirectoryService],
})
export class StaffDirectoryModule {}

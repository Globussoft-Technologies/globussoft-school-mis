import { Module } from '@nestjs/common';
import { SchoolDataController } from './school-data.controller';
import { SchoolDataService } from './school-data.service';

@Module({
  controllers: [SchoolDataController],
  providers: [SchoolDataService],
  exports: [SchoolDataService],
})
export class SchoolDataModule {}

import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';

@Module({
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}

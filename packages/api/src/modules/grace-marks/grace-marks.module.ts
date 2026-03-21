import { Module } from '@nestjs/common';
import { GraceMarksService } from './grace-marks.service';
import { GraceMarksController } from './grace-marks.controller';

@Module({
  controllers: [GraceMarksController],
  providers: [GraceMarksService],
  exports: [GraceMarksService],
})
export class GraceMarksModule {}

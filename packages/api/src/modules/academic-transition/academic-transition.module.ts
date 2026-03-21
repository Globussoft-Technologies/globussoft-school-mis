import { Module } from '@nestjs/common';
import { AcademicTransitionController } from './academic-transition.controller';
import { AcademicTransitionService } from './academic-transition.service';

@Module({
  controllers: [AcademicTransitionController],
  providers: [AcademicTransitionService],
  exports: [AcademicTransitionService],
})
export class AcademicTransitionModule {}

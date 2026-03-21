import { Module } from '@nestjs/common';
import { LmsContentService } from './lms-content.service';
import { LmsContentController } from './lms-content.controller';

@Module({
  controllers: [LmsContentController],
  providers: [LmsContentService],
  exports: [LmsContentService],
})
export class LmsContentModule {}

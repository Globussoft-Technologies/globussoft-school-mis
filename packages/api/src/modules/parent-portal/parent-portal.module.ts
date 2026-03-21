import { Module } from '@nestjs/common';
import { ParentPortalService } from './parent-portal.service';
import { ParentPortalController } from './parent-portal.controller';

@Module({
  controllers: [ParentPortalController],
  providers: [ParentPortalService],
  exports: [ParentPortalService],
})
export class ParentPortalModule {}

import { Module } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkOperationsController } from './bulk-operations.controller';

@Module({
  controllers: [BulkOperationsController],
  providers: [BulkOperationsService],
  exports: [BulkOperationsService],
})
export class BulkOperationsModule {}

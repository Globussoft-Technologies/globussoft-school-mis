import { Module } from '@nestjs/common';
import { AlumniService } from './alumni.service';
import { AlumniController } from './alumni.controller';

@Module({
  controllers: [AlumniController],
  providers: [AlumniService],
  exports: [AlumniService],
})
export class AlumniModule {}

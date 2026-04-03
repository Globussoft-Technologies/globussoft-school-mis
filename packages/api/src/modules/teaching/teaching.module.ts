import { Module } from '@nestjs/common';
import { TeachingController } from './teaching.controller';
import { TeachingService } from './teaching.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeachingController],
  providers: [TeachingService],
  exports: [TeachingService],
})
export class TeachingModule {}

import { Module } from '@nestjs/common';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}

import { Module } from '@nestjs/common';
import { RubricsController } from './rubrics.controller';
import { RubricsService } from './rubrics.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RubricsController],
  providers: [RubricsService],
  exports: [RubricsService],
})
export class RubricsModule {}

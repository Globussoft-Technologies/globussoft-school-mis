import { Module } from '@nestjs/common';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LearningPathsController],
  providers: [LearningPathsService],
  exports: [LearningPathsService],
})
export class LearningPathsModule {}

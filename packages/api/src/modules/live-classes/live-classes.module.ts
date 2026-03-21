import { Module } from '@nestjs/common';
import { LiveClassesController } from './live-classes.controller';
import { LiveClassesService } from './live-classes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LiveClassesController],
  providers: [LiveClassesService],
  exports: [LiveClassesService],
})
export class LiveClassesModule {}

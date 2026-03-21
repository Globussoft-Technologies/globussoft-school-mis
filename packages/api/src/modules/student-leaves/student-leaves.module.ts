import { Module } from '@nestjs/common';
import { StudentLeavesController } from './student-leaves.controller';
import { StudentLeavesService } from './student-leaves.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentLeavesController],
  providers: [StudentLeavesService],
  exports: [StudentLeavesService],
})
export class StudentLeavesModule {}

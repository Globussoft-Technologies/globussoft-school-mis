import { Module } from '@nestjs/common';
import { CourseModulesController } from './course-modules.controller';
import { CourseModulesService } from './course-modules.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseModulesController],
  providers: [CourseModulesService],
  exports: [CourseModulesService],
})
export class CourseModulesModule {}

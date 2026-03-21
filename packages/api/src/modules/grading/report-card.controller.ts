import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportCardService } from './report-card.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Report Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report-cards')
export class ReportCardController {
  constructor(private reportCardService: ReportCardService) {}

  @Post('generate')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  generate(@Body() body: { studentId: string; classId: string; academicSessionId: string; term: string }) {
    return this.reportCardService.generate(body.studentId, body.classId, body.academicSessionId, body.term);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportCardService.findById(id);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.reportCardService.findByStudent(studentId);
  }

  @Get('class/:classId')
  findByClass(
    @Param('classId') classId: string,
    @Query('academicSessionId') academicSessionId: string,
    @Query('term') term: string,
  ) {
    return this.reportCardService.findByClass(classId, academicSessionId, term);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'DIRECTOR')
  publish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.reportCardService.publish(id, userId);
  }
}

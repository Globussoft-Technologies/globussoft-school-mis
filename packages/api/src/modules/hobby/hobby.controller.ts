import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HobbyService } from './hobby.service';
import {
  CreateHobbyDto,
  EnrollStudentDto,
  CreateHobbySessionDto,
  MarkHobbyAttendanceDto,
} from './dto/create-hobby.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Hobby')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hobby')
export class HobbyController {
  constructor(private hobbyService: HobbyService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR')
  create(@Body() dto: CreateHobbyDto) {
    return this.hobbyService.create(dto);
  }

  @Get()
  findAll(
    @Query('schoolId') schoolId?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.hobbyService.findAll({
      schoolId,
      category,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    });
  }

  @Get('portfolio/:studentId')
  getPortfolio(@Param('studentId') studentId: string) {
    return this.hobbyService.getStudentPortfolio(studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hobbyService.findById(id);
  }

  @Post(':id/enroll')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER')
  enroll(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.hobbyService.enrollStudent(id, dto);
  }

  @Patch(':id/withdraw')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER')
  withdraw(
    @Param('id') id: string,
    @Body() body: { studentId: string; academicSessionId: string },
  ) {
    return this.hobbyService.withdrawStudent(id, body.studentId, body.academicSessionId);
  }

  @Post('sessions')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  createSession(
    @Body() dto: CreateHobbySessionDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.hobbyService.createSession(dto, userId);
  }

  @Post('sessions/:id/attendance')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  markAttendance(
    @Param('id') sessionId: string,
    @Body() body: { attendances: MarkHobbyAttendanceDto[] },
  ) {
    return this.hobbyService.markAttendance(sessionId, body.attendances);
  }

  @Get('sessions/:id/attendance')
  getSessionAttendance(@Param('id') sessionId: string) {
    return this.hobbyService.getSessionAttendance(sessionId);
  }
}

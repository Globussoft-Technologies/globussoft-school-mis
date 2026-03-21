import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudentLeavesService } from './student-leaves.service';
import { CreateStudentLeaveDto } from './dto/create-student-leave.dto';
import { ApproveStudentLeaveDto } from './dto/approve-student-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Student Leaves')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student-leaves')
export class StudentLeavesController {
  constructor(private readonly studentLeavesService: StudentLeavesService) {}

  @Post()
  @ApiOperation({ summary: 'Apply for student leave (parent)' })
  create(
    @Body() dto: CreateStudentLeaveDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.studentLeavesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List student leave applications' })
  findAll(
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.studentLeavesService.findAll({ studentId, status });
  }

  @Patch(':id/approve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  @ApiOperation({ summary: 'Approve or reject a student leave application' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveStudentLeaveDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.studentLeavesService.approve(id, userId, dto.status, dto.remarks);
  }
}

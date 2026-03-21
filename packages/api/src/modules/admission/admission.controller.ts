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
import { AdmissionService } from './admission.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ProcessApplicationDto } from './dto/process-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admission')
export class AdmissionController {
  constructor(private admissionService: AdmissionService) {}

  // ─── Enquiries ──────────────────────────────────────────────

  @Post('enquiries')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR')
  createEnquiry(@Body() dto: CreateEnquiryDto) {
    return this.admissionService.createEnquiry(dto);
  }

  @Get('enquiries')
  findAllEnquiries(@Query('academicSessionId') academicSessionId?: string) {
    return this.admissionService.findAllEnquiries(academicSessionId);
  }

  @Get('enquiries/:id')
  findEnquiry(@Param('id') id: string) {
    return this.admissionService.findEnquiryById(id);
  }

  @Patch('enquiries/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.admissionService.updateEnquiryStatus(id, status);
  }

  // ─── Applications ───────────────────────────────────────────

  @Post('applications')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR')
  createApplication(@Body() dto: CreateApplicationDto) {
    return this.admissionService.createApplication(dto);
  }

  @Get('applications')
  getApplications(
    @Query('enquiryId') enquiryId?: string,
    @Query('status') status?: string,
    @Query('classAppliedFor') classAppliedFor?: string,
  ) {
    return this.admissionService.getApplications({
      enquiryId,
      status,
      classAppliedFor,
    });
  }

  @Patch('applications/:id/process')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR')
  processApplication(
    @Param('id') id: string,
    @Body() dto: ProcessApplicationDto,
  ) {
    return this.admissionService.processApplication(id, dto);
  }

  @Post('applications/:id/enroll')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR')
  enrollStudent(@Param('id') id: string) {
    return this.admissionService.enrollStudent(id);
  }

  // ─── Stats ──────────────────────────────────────────────────

  @Get('stats')
  getAdmissionStats(@Query('academicSessionId') academicSessionId?: string) {
    return this.admissionService.getAdmissionStats(academicSessionId);
  }
}

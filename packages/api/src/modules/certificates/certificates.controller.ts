import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Post()
  generate(
    @Req() req: any,
    @Body()
    body: {
      studentId: string;
      type: string;
      title: string;
      description?: string;
      issuedDate?: string;
      templateData?: any;
    },
  ) {
    return this.certificatesService.generate({
      ...body,
      issuedBy: req.user.sub,
      issuedDate: body.issuedDate ? new Date(body.issuedDate) : undefined,
    });
  }

  @Post('merit')
  generateMerit(
    @Req() req: any,
    @Body()
    body: {
      classId: string;
      academicSessionId: string;
      topN: number;
    },
  ) {
    return this.certificatesService.generateMeritCertificates(
      body.classId,
      body.academicSessionId,
      body.topN,
      req.user.sub,
    );
  }

  @Post('attendance')
  generateAttendance(
    @Req() req: any,
    @Body() body: { classId: string; minPercentage: number },
  ) {
    return this.certificatesService.generateAttendanceCertificates(
      body.classId,
      body.minPercentage,
      req.user.sub,
    );
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.certificatesService.findAll({ studentId, type, status });
  }

  @Get(':id/print')
  getPrintData(@Param('id') id: string) {
    return this.certificatesService.getCertificateData(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Patch(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.certificatesService.revoke(id);
  }
}

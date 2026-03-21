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
import { TcService } from './tc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transfer Certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfer-certificates')
export class TcController {
  constructor(private tcService: TcService) {}

  @Post()
  generate(
    @Body() body: { studentId: string; reasonForLeaving: string; issuedBy: string },
  ) {
    return this.tcService.generate(body.studentId, body.reasonForLeaving, body.issuedBy);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.tcService.findAll(status);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tcService.findById(id);
  }

  @Patch(':id/issue')
  issue(@Param('id') id: string) {
    return this.tcService.issue(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.tcService.cancel(id);
  }

  @Get(':id/print')
  getPrintData(@Param('id') id: string) {
    return this.tcService.getTcData(id);
  }
}

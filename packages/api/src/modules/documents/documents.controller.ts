import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload document metadata for a student' })
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.documentsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List documents for a student' })
  findAll(@Query('studentId') studentId?: string) {
    return this.documentsService.findAll(studentId);
  }

  @Get('checklist')
  @ApiOperation({ summary: 'Get document checklist for a student' })
  getChecklist(@Query('studentId') studentId: string) {
    return this.documentsService.getChecklist(studentId);
  }

  @Patch(':id/verify')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'CLASS_TEACHER')
  @ApiOperation({ summary: 'Mark a document as verified' })
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyDocumentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.documentsService.verify(id, userId, dto.notes);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a document' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}

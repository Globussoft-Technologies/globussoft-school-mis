import {
  Controller, Get, Post, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BulkOperationsService, StudentImportRow, PaymentImportRow } from './bulk-operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Bulk Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'IT_ADMIN')
@Controller('bulk')
export class BulkOperationsController {
  constructor(private readonly bulkOpsService: BulkOperationsService) {}

  @Post('import/students')
  @ApiOperation({ summary: 'Bulk import students from JSON array' })
  importStudents(@Body('students') students: StudentImportRow[]) {
    if (!Array.isArray(students) || students.length === 0) {
      return { imported: 0, errors: ['No student data provided'] };
    }
    return this.bulkOpsService.importStudents(students);
  }

  @Post('import/payments')
  @ApiOperation({ summary: 'Bulk import fee payments from JSON array' })
  importPayments(@Body('payments') payments: PaymentImportRow[]) {
    if (!Array.isArray(payments) || payments.length === 0) {
      return { imported: 0, errors: ['No payment data provided'] };
    }
    return this.bulkOpsService.importFeePayments(payments);
  }

  @Get('export/students')
  @ApiOperation({ summary: 'Export students as JSON (optionally filtered by class/section)' })
  exportStudents(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.bulkOpsService.exportStudents(classId, sectionId);
  }

  @Get('export/attendance')
  @ApiOperation({ summary: 'Export attendance records for a date range' })
  exportAttendance(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.bulkOpsService.exportAttendance(classId, sectionId, startDate, endDate);
  }

  @Get('export/grades')
  @ApiOperation({ summary: 'Export grades for a class, optionally filtered by subject' })
  exportGrades(
    @Query('classId') classId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.bulkOpsService.exportGrades(classId, subjectId);
  }
}

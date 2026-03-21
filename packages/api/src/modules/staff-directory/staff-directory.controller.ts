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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StaffDirectoryService } from './staff-directory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Staff Directory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff-directory')
export class StaffDirectoryController {
  constructor(private staffDirectoryService: StaffDirectoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a staff profile' })
  createProfile(
    @Body()
    body: {
      userId: string;
      employeeId: string;
      department: string;
      designation: string;
      dateOfJoining: string;
      qualification?: string;
      specialization?: string;
      experience?: number;
      emergencyContact?: string;
      emergencyPhone?: string;
      address?: string;
      bankAccount?: string;
      panNumber?: string;
    },
  ) {
    return this.staffDirectoryService.createProfile(body);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get department statistics' })
  getDepartmentStats() {
    return this.staffDirectoryService.getDepartmentStats();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search staff profiles' })
  search(@Query('q') q: string) {
    return this.staffDirectoryService.search(q || '');
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff profiles with optional filters' })
  findAll(
    @Query('department') department?: string,
    @Query('designation') designation?: string,
  ) {
    return this.staffDirectoryService.findAll(department, designation);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a staff profile by userId' })
  findByUserId(@Param('userId') userId: string) {
    return this.staffDirectoryService.findByUserId(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update a staff profile' })
  updateProfile(
    @Param('userId') userId: string,
    @Body()
    body: {
      department?: string;
      designation?: string;
      dateOfJoining?: string;
      qualification?: string;
      specialization?: string;
      experience?: number;
      emergencyContact?: string;
      emergencyPhone?: string;
      address?: string;
      bankAccount?: string;
      panNumber?: string;
    },
  ) {
    return this.staffDirectoryService.updateProfile(userId, body);
  }
}

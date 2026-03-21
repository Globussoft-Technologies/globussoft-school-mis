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
import { HostelService } from './hostel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Hostel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hostel')
export class HostelController {
  constructor(private hostelService: HostelService) {}

  @Post('rooms')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a hostel room' })
  createRoom(
    @Body()
    body: {
      roomNumber: string;
      floor: number;
      block: string;
      capacity?: number;
      type?: string;
      amenities?: string[];
    },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.hostelService.createRoom({ ...body, schoolId });
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get all hostel rooms' })
  getRooms(
    @CurrentUser('schoolId') schoolId: string,
    @Query('block') block?: string,
    @Query('floor') floor?: string,
  ) {
    return this.hostelService.getRooms(
      schoolId,
      block,
      floor !== undefined ? parseInt(floor, 10) : undefined,
    );
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get room details with bed assignments' })
  getRoomById(@Param('id') id: string) {
    return this.hostelService.getRoomById(id);
  }

  @Post('allocate')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Allocate a student to a room' })
  allocateStudent(
    @Body()
    body: {
      studentId: string;
      roomId: string;
      bedNumber?: number;
      startDate: string;
    },
  ) {
    return this.hostelService.allocateStudent(body);
  }

  @Patch('vacate/:allocationId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Vacate a student from their room' })
  vacateStudent(@Param('allocationId') allocationId: string) {
    return this.hostelService.vacateStudent(allocationId);
  }

  @Patch('transfer/:allocationId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Transfer student to another room' })
  transferStudent(
    @Param('allocationId') allocationId: string,
    @Body() body: { newRoomId: string; bedNumber?: number },
  ) {
    return this.hostelService.transferStudent(allocationId, body.newRoomId, body.bedNumber);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get active allocation for a student' })
  getStudentAllocation(@Param('studentId') studentId: string) {
    return this.hostelService.getStudentAllocation(studentId);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Get hostel occupancy stats' })
  getOccupancy(@CurrentUser('schoolId') schoolId: string) {
    return this.hostelService.getOccupancy(schoolId);
  }

  @Post('fees/generate')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Generate monthly hostel fees for all active residents' })
  generateFees(
    @Body() body: { month: number; year: number; amount: number },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.hostelService.generateMonthlyFees(body.month, body.year, body.amount, schoolId);
  }

  @Get('fees')
  @ApiOperation({ summary: 'Get hostel fees' })
  getHostelFees(
    @Query('studentId') studentId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.hostelService.getHostelFees(
      studentId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }
}

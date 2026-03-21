import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BusService } from './bus.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CreateRouteDto, CreateStopDto } from './dto/create-route.dto';
import { AssignStudentDto } from './dto/assign-student.dto';
import { RecordBoardingDto } from './dto/record-boarding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Bus Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bus')
export class BusController {
  constructor(private busService: BusService) {}

  // ─── Vehicles ─────────────────────────────────────────────────────

  @Post('vehicles')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add a new vehicle' })
  createVehicle(
    @Body() dto: CreateVehicleDto,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.busService.createVehicle(dto, schoolId);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Get all vehicles for the school' })
  getVehicles(@CurrentUser('schoolId') schoolId: string) {
    return this.busService.getVehicles(schoolId);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get a vehicle by ID' })
  getVehicle(@Param('id') id: string) {
    return this.busService.getVehicleById(id);
  }

  @Patch('vehicles/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a vehicle' })
  updateVehicle(
    @Param('id') id: string,
    @Body() dto: Partial<CreateVehicleDto>,
  ) {
    return this.busService.updateVehicle(id, dto);
  }

  @Delete('vehicles/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a vehicle' })
  deleteVehicle(@Param('id') id: string) {
    return this.busService.deleteVehicle(id);
  }

  // ─── Routes ───────────────────────────────────────────────────────

  @Post('routes')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new route with optional stops' })
  createRoute(
    @Body() dto: CreateRouteDto,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.busService.createRoute(dto, schoolId);
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get all routes for the school' })
  getRoutes(
    @CurrentUser('schoolId') schoolId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.busService.getRoutes(schoolId, activeOnly === 'true');
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get a route by ID with stops and assignments' })
  getRoute(@Param('id') id: string) {
    return this.busService.getRouteById(id);
  }

  @Patch('routes/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a route' })
  updateRoute(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRouteDto>,
  ) {
    return this.busService.updateRoute(id, dto);
  }

  @Delete('routes/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a route' })
  deleteRoute(@Param('id') id: string) {
    return this.busService.deleteRoute(id);
  }

  @Post('routes/:routeId/stops')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add a stop to a route' })
  addStop(
    @Param('routeId') routeId: string,
    @Body() dto: CreateStopDto,
  ) {
    return this.busService.addStop(routeId, dto);
  }

  @Delete('stops/:stopId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Remove a stop' })
  deleteStop(@Param('stopId') stopId: string) {
    return this.busService.deleteStop(stopId);
  }

  // ─── Student Assignments ──────────────────────────────────────────

  @Post('assignments')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Assign a student to a route and stop' })
  assignStudent(@Body() dto: AssignStudentDto) {
    return this.busService.assignStudent(dto);
  }

  @Get('assignments/:studentId')
  @ApiOperation({ summary: 'Get bus assignment for a student' })
  getStudentAssignment(@Param('studentId') studentId: string) {
    return this.busService.getStudentAssignment(studentId);
  }

  @Delete('assignments/:studentId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Remove bus assignment for a student' })
  removeAssignment(@Param('studentId') studentId: string) {
    return this.busService.removeAssignment(studentId);
  }

  // ─── Boarding Logs ────────────────────────────────────────────────

  @Post('boarding')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONDUCTOR')
  @ApiOperation({ summary: 'Record student boarding/alighting' })
  recordBoarding(
    @Body() dto: RecordBoardingDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.busService.recordBoarding(dto, userId);
  }

  @Get('boarding')
  @ApiOperation({ summary: 'Get boarding logs with optional filters' })
  getBoardingLogs(
    @Query('routeId') routeId?: string,
    @Query('studentId') studentId?: string,
    @Query('date') date?: string,
    @Query('type') type?: string,
  ) {
    return this.busService.getBoardingLogs({ routeId, studentId, date, type });
  }
}

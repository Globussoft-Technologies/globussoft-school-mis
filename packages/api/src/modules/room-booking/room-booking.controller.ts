import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoomBookingService } from './room-booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Room Booking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomBookingController {
  constructor(private roomBookingService: RoomBookingService) {}

  // ─── Rooms ────────────────────────────────────────────────────

  @Post()
  createRoom(@Body() body: any) {
    return this.roomBookingService.createRoom(body);
  }

  @Get()
  getRooms(@Query('schoolId') schoolId?: string) {
    return this.roomBookingService.getRooms(schoolId);
  }

  @Get('available')
  getAvailableRooms(
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.roomBookingService.getAvailableRooms(date, startTime, endTime, schoolId);
  }

  @Get('my-bookings')
  getMyBookings(@Request() req: any) {
    return this.roomBookingService.getUserBookings(req.user.sub || req.user.id);
  }

  @Get(':id/bookings')
  getRoomBookings(@Param('id') id: string, @Query('date') date?: string) {
    return this.roomBookingService.getRoomBookings(id, date);
  }

  @Patch(':id')
  updateRoom(@Param('id') id: string, @Body() body: any) {
    return this.roomBookingService.updateRoom(id, body);
  }

  // ─── Bookings ─────────────────────────────────────────────────

  @Post('book')
  bookRoom(@Body() body: any) {
    return this.roomBookingService.bookRoom(body);
  }

  @Delete('bookings/:id')
  cancelBooking(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.roomBookingService.cancelBooking(id, userId);
  }
}

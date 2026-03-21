import { Module } from '@nestjs/common';
import { RoomBookingService } from './room-booking.service';
import { RoomBookingController } from './room-booking.controller';

@Module({
  controllers: [RoomBookingController],
  providers: [RoomBookingService],
  exports: [RoomBookingService],
})
export class RoomBookingModule {}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoomBookingService {
  constructor(private prisma: PrismaService) {}

  // ─── Rooms ────────────────────────────────────────────────────

  async createRoom(data: {
    name: string;
    type: string;
    capacity: number;
    floor?: number;
    building?: string;
    hasProjector?: boolean;
    hasAC?: boolean;
    schoolId: string;
  }) {
    return this.prisma.schoolRoom.create({ data });
  }

  async getRooms(schoolId?: string) {
    return this.prisma.schoolRoom.findMany({
      where: { ...(schoolId ? { schoolId } : {}), isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getRoom(id: string) {
    const room = await this.prisma.schoolRoom.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async updateRoom(id: string, data: Partial<{
    name: string;
    type: string;
    capacity: number;
    floor: number;
    building: string;
    hasProjector: boolean;
    hasAC: boolean;
    isActive: boolean;
  }>) {
    return this.prisma.schoolRoom.update({ where: { id }, data });
  }

  // ─── Bookings ─────────────────────────────────────────────────

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  async bookRoom(data: {
    roomId: string;
    bookedBy: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    attendees?: number;
    remarks?: string;
  }) {
    const room = await this.prisma.schoolRoom.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.isActive) throw new BadRequestException('Room is not active');

    // Check for time conflicts
    const bookingDate = new Date(data.date);
    const conflicts = await this.prisma.roomBooking.findMany({
      where: {
        roomId: data.roomId,
        date: bookingDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const newStart = this.timeToMinutes(data.startTime);
    const newEnd = this.timeToMinutes(data.endTime);

    for (const b of conflicts) {
      const existStart = this.timeToMinutes(b.startTime);
      const existEnd = this.timeToMinutes(b.endTime);
      if (newStart < existEnd && newEnd > existStart) {
        throw new BadRequestException(
          `Room is already booked from ${b.startTime} to ${b.endTime} on this date`,
        );
      }
    }

    return this.prisma.roomBooking.create({
      data: {
        ...data,
        date: bookingDate,
        status: 'CONFIRMED',
      },
      include: { room: true },
    });
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await this.prisma.roomBooking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.bookedBy !== userId) throw new BadRequestException('You can only cancel your own bookings');
    return this.prisma.roomBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getAvailableRooms(date: string, startTime: string, endTime: string, schoolId?: string) {
    const bookingDate = new Date(date);
    const newStart = this.timeToMinutes(startTime);
    const newEnd = this.timeToMinutes(endTime);

    const allRooms = await this.prisma.schoolRoom.findMany({
      where: { ...(schoolId ? { schoolId } : {}), isActive: true },
    });

    const conflictedBookings = await this.prisma.roomBooking.findMany({
      where: {
        date: bookingDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const conflictedRoomIds = new Set<string>();
    for (const b of conflictedBookings) {
      const existStart = this.timeToMinutes(b.startTime);
      const existEnd = this.timeToMinutes(b.endTime);
      if (newStart < existEnd && newEnd > existStart) {
        conflictedRoomIds.add(b.roomId);
      }
    }

    return allRooms.filter((r) => !conflictedRoomIds.has(r.id));
  }

  async getRoomBookings(roomId: string, date?: string) {
    const where: any = { roomId };
    if (date) where.date = new Date(date);
    return this.prisma.roomBooking.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { room: true },
    });
  }

  async getUserBookings(userId: string) {
    return this.prisma.roomBooking.findMany({
      where: { bookedBy: userId },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
      include: { room: true },
    });
  }
}

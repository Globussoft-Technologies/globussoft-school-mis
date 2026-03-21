import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  // ─── Rooms ──────────────────────────────────────────────────────

  async createRoom(data: {
    roomNumber: string;
    floor: number;
    block: string;
    capacity?: number;
    type?: string;
    amenities?: string[];
    schoolId: string;
  }) {
    const existing = await this.prisma.hostelRoom.findFirst({
      where: { roomNumber: data.roomNumber, block: data.block, schoolId: data.schoolId },
    });
    if (existing) {
      throw new ConflictException(
        `Room ${data.roomNumber} in block ${data.block} already exists`,
      );
    }
    return this.prisma.hostelRoom.create({
      data: {
        roomNumber: data.roomNumber,
        floor: data.floor,
        block: data.block,
        capacity: data.capacity ?? 4,
        type: data.type ?? 'SHARED',
        amenities: data.amenities ?? [],
        schoolId: data.schoolId,
      },
    });
  }

  async getRooms(schoolId: string, block?: string, floor?: number) {
    return this.prisma.hostelRoom.findMany({
      where: {
        schoolId,
        isActive: true,
        ...(block && { block }),
        ...(floor !== undefined && { floor }),
      },
      include: {
        allocations: {
          where: { status: 'ACTIVE' },
          select: { id: true, studentId: true, bedNumber: true, startDate: true },
        },
      },
      orderBy: [{ block: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
    });
  }

  async getRoomById(id: string) {
    const room = await this.prisma.hostelRoom.findUnique({
      where: { id },
      include: {
        allocations: {
          where: { status: 'ACTIVE' },
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  // ─── Allocations ────────────────────────────────────────────────

  async allocateStudent(data: {
    studentId: string;
    roomId: string;
    bedNumber?: number;
    startDate: string;
  }) {
    const room = await this.prisma.hostelRoom.findUnique({
      where: { id: data.roomId },
      include: { allocations: { where: { status: 'ACTIVE' } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.isActive) throw new BadRequestException('Room is not active');
    if (room.occupied >= room.capacity) {
      throw new BadRequestException('Room is at full capacity');
    }

    // Check if student already has an active allocation
    const existingAlloc = await this.prisma.hostelAllocation.findFirst({
      where: { studentId: data.studentId, status: 'ACTIVE' },
    });
    if (existingAlloc) {
      throw new ConflictException('Student already has an active hostel allocation');
    }

    const [allocation] = await this.prisma.$transaction([
      this.prisma.hostelAllocation.create({
        data: {
          studentId: data.studentId,
          roomId: data.roomId,
          bedNumber: data.bedNumber,
          startDate: new Date(data.startDate),
          status: 'ACTIVE',
        },
        include: { room: true },
      }),
      this.prisma.hostelRoom.update({
        where: { id: data.roomId },
        data: { occupied: { increment: 1 } },
      }),
    ]);
    return allocation;
  }

  async vacateStudent(allocationId: string) {
    const allocation = await this.prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (allocation.status !== 'ACTIVE') {
      throw new BadRequestException('Allocation is not active');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.hostelAllocation.update({
        where: { id: allocationId },
        data: { status: 'VACATED', endDate: new Date() },
      }),
      this.prisma.hostelRoom.update({
        where: { id: allocation.roomId },
        data: { occupied: { decrement: 1 } },
      }),
    ]);
    return updated;
  }

  async transferStudent(allocationId: string, newRoomId: string, bedNumber?: number) {
    const allocation = await this.prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (allocation.status !== 'ACTIVE') {
      throw new BadRequestException('Allocation is not active');
    }

    const newRoom = await this.prisma.hostelRoom.findUnique({ where: { id: newRoomId } });
    if (!newRoom) throw new NotFoundException('Target room not found');
    if (newRoom.occupied >= newRoom.capacity) {
      throw new BadRequestException('Target room is at full capacity');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.hostelAllocation.update({
        where: { id: allocationId },
        data: {
          status: 'TRANSFERRED',
          endDate: new Date(),
        },
      }),
      this.prisma.hostelRoom.update({
        where: { id: allocation.roomId },
        data: { occupied: { decrement: 1 } },
      }),
      this.prisma.hostelAllocation.create({
        data: {
          studentId: allocation.studentId,
          roomId: newRoomId,
          bedNumber,
          startDate: new Date(),
          status: 'ACTIVE',
        },
      }),
      this.prisma.hostelRoom.update({
        where: { id: newRoomId },
        data: { occupied: { increment: 1 } },
      }),
    ]);
    return updated;
  }

  async getStudentAllocation(studentId: string) {
    return this.prisma.hostelAllocation.findFirst({
      where: { studentId, status: 'ACTIVE' },
      include: { room: true },
    });
  }

  async getOccupancy(schoolId: string) {
    const rooms = await this.prisma.hostelRoom.findMany({
      where: { schoolId, isActive: true },
      select: { id: true, roomNumber: true, block: true, floor: true, capacity: true, occupied: true, type: true },
    });

    const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
    const totalOccupied = rooms.reduce((s, r) => s + r.occupied, 0);
    const byBlock: Record<string, { capacity: number; occupied: number }> = {};
    for (const r of rooms) {
      if (!byBlock[r.block]) byBlock[r.block] = { capacity: 0, occupied: 0 };
      byBlock[r.block].capacity += r.capacity;
      byBlock[r.block].occupied += r.occupied;
    }

    return {
      totalRooms: rooms.length,
      totalCapacity,
      totalOccupied,
      totalAvailable: totalCapacity - totalOccupied,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
      byBlock,
      rooms,
    };
  }

  // ─── Fees ───────────────────────────────────────────────────────

  async generateMonthlyFees(month: number, year: number, amount: number, schoolId: string) {
    // Get all active allocations in this school
    const allocations = await this.prisma.hostelAllocation.findMany({
      where: {
        status: 'ACTIVE',
        room: { schoolId },
      },
      select: { studentId: true },
    });

    const studentIds = [...new Set(allocations.map((a) => a.studentId))];

    const fees = await Promise.all(
      studentIds.map((studentId) =>
        this.prisma.hostelFee.upsert({
          where: { studentId_month_year: { studentId, month, year } },
          create: { studentId, month, year, amount, status: 'PENDING' },
          update: {},
        }),
      ),
    );

    return { generated: fees.length, month, year, amount };
  }

  async getHostelFees(studentId?: string, month?: number, year?: number) {
    return this.prisma.hostelFee.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(month && { month }),
        ...(year && { year }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}

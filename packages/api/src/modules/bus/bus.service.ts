import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { AssignStudentDto } from './dto/assign-student.dto';
import { RecordBoardingDto } from './dto/record-boarding.dto';

@Injectable()
export class BusService {
  constructor(private prisma: PrismaService) {}

  // ─── Vehicles ─────────────────────────────────────────────────────

  async createVehicle(dto: CreateVehicleDto, schoolId: string) {
    const existing = await this.prisma.vehicle.findUnique({ where: { number: dto.number } });
    if (existing) throw new ConflictException(`Vehicle with number ${dto.number} already exists`);

    return this.prisma.vehicle.create({
      data: {
        number: dto.number,
        type: dto.type ?? 'BUS',
        capacity: dto.capacity,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        conductorName: dto.conductorName,
        conductorPhone: dto.conductorPhone,
        gpsDeviceId: dto.gpsDeviceId,
        isActive: dto.isActive ?? true,
        schoolId,
      },
    });
  }

  async getVehicles(schoolId: string) {
    return this.prisma.vehicle.findMany({
      where: { schoolId },
      include: {
        _count: { select: { routes: true } },
      },
      orderBy: { number: 'asc' },
    });
  }

  async getVehicleById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        routes: {
          include: {
            stops: { orderBy: { orderIndex: 'asc' } },
            _count: { select: { busAssignments: true } },
          },
        },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async updateVehicle(id: string, dto: Partial<CreateVehicleDto>) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
    });
  }

  async deleteVehicle(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    return this.prisma.vehicle.delete({ where: { id } });
  }

  // ─── Routes ───────────────────────────────────────────────────────

  async createRoute(dto: CreateRouteDto, schoolId: string) {
    const route = await this.prisma.route.create({
      data: {
        name: dto.name,
        description: dto.description,
        vehicleId: dto.vehicleId,
        schoolId,
        isActive: dto.isActive ?? true,
        stops: dto.stops?.length
          ? {
              create: dto.stops.map((stop) => ({
                name: stop.name,
                latitude: stop.latitude,
                longitude: stop.longitude,
                estimatedArrival: stop.estimatedArrival,
                orderIndex: stop.orderIndex,
              })),
            }
          : undefined,
      },
      include: {
        vehicle: { select: { id: true, number: true, type: true } },
        stops: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { busAssignments: true } },
      },
    });

    return route;
  }

  async getRoutes(schoolId: string, activeOnly = false) {
    return this.prisma.route.findMany({
      where: {
        schoolId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        vehicle: { select: { id: true, number: true, type: true, capacity: true } },
        stops: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { busAssignments: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRouteById(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        vehicle: true,
        stops: { orderBy: { orderIndex: 'asc' } },
        busAssignments: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
                class: { select: { name: true } },
                section: { select: { name: true } },
              },
            },
            stop: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async updateRoute(id: string, dto: Partial<CreateRouteDto>) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');

    const { stops, ...routeData } = dto;

    return this.prisma.route.update({
      where: { id },
      data: routeData,
      include: {
        vehicle: { select: { id: true, number: true } },
        stops: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  async deleteRoute(id: string) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');

    return this.prisma.route.delete({ where: { id } });
  }

  async addStop(routeId: string, stop: {
    name: string;
    latitude?: number;
    longitude?: number;
    estimatedArrival?: string;
    orderIndex: number;
  }) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    return this.prisma.stop.create({
      data: { ...stop, routeId },
    });
  }

  async deleteStop(stopId: string) {
    const stop = await this.prisma.stop.findUnique({ where: { id: stopId } });
    if (!stop) throw new NotFoundException('Stop not found');

    return this.prisma.stop.delete({ where: { id: stopId } });
  }

  // ─── Student Assignments ──────────────────────────────────────────

  async assignStudent(dto: AssignStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
    if (!route) throw new NotFoundException('Route not found');

    const stop = await this.prisma.stop.findUnique({ where: { id: dto.stopId } });
    if (!stop) throw new NotFoundException('Stop not found');

    // Upsert assignment (student can only have one assignment)
    return this.prisma.busAssignment.upsert({
      where: { studentId: dto.studentId },
      update: {
        routeId: dto.routeId,
        stopId: dto.stopId,
        academicSessionId: dto.academicSessionId,
      },
      create: {
        studentId: dto.studentId,
        routeId: dto.routeId,
        stopId: dto.stopId,
        academicSessionId: dto.academicSessionId,
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        route: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true } },
      },
    });
  }

  async getStudentAssignment(studentId: string) {
    return this.prisma.busAssignment.findUnique({
      where: { studentId },
      include: {
        route: {
          include: {
            vehicle: { select: { number: true, driverName: true, driverPhone: true } },
            stops: { orderBy: { orderIndex: 'asc' } },
          },
        },
        stop: true,
      },
    });
  }

  async removeAssignment(studentId: string) {
    const assignment = await this.prisma.busAssignment.findUnique({ where: { studentId } });
    if (!assignment) throw new NotFoundException('Bus assignment not found');

    return this.prisma.busAssignment.delete({ where: { studentId } });
  }

  // ─── Boarding Logs ────────────────────────────────────────────────

  async recordBoarding(dto: RecordBoardingDto, conductorId: string) {
    return this.prisma.boardingLog.create({
      data: {
        studentId: dto.studentId,
        routeId: dto.routeId,
        stopId: dto.stopId,
        date: new Date(dto.date),
        boardingTime: dto.boardingTime ? new Date(`${dto.date}T${dto.boardingTime}`) : undefined,
        alightingTime: dto.alightingTime ? new Date(`${dto.date}T${dto.alightingTime}`) : undefined,
        type: dto.type,
        status: dto.status ?? 'BOARDED',
        conductorId,
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        route: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true } },
        conductor: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getBoardingLogs(filters: {
    routeId?: string;
    studentId?: string;
    date?: string;
    type?: string;
  }) {
    return this.prisma.boardingLog.findMany({
      where: {
        ...(filters.routeId && { routeId: filters.routeId }),
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.date && { date: new Date(filters.date) }),
        ...(filters.type && { type: filters.type }),
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true } },
          },
        },
        route: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true } },
        conductor: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ date: 'desc' }, { boardingTime: 'asc' }],
    });
  }
}

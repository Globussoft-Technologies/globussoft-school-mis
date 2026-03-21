import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateHobbyDto,
  EnrollStudentDto,
  CreateHobbySessionDto,
  MarkHobbyAttendanceDto,
} from './dto/create-hobby.dto';

@Injectable()
export class HobbyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHobbyDto) {
    return this.prisma.hobby.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        maxCapacity: dto.maxCapacity,
        coordinatorId: dto.coordinatorId,
        isActive: dto.isActive ?? true,
        schoolId: dto.schoolId,
      },
      include: {
        coordinator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(filters: { schoolId?: string; category?: string; isActive?: boolean }) {
    return this.prisma.hobby.findMany({
      where: {
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        coordinator: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const hobby = await this.prisma.hobby.findUnique({
      where: { id },
      include: {
        coordinator: { select: { id: true, firstName: true, lastName: true } },
        enrollments: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
          where: { status: 'ENROLLED' },
        },
        sessions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: { select: { enrollments: true, sessions: true } },
      },
    });
    if (!hobby) throw new NotFoundException('Hobby not found');
    return hobby;
  }

  async enrollStudent(hobbyId: string, dto: EnrollStudentDto) {
    const hobby = await this.prisma.hobby.findUnique({ where: { id: hobbyId } });
    if (!hobby) throw new NotFoundException('Hobby not found');
    if (!hobby.isActive) throw new BadRequestException('Hobby is not active');
    if (hobby.currentEnrollment >= hobby.maxCapacity) {
      throw new BadRequestException('Hobby is at full capacity');
    }

    const existing = await this.prisma.hobbyEnrollment.findUnique({
      where: {
        studentId_hobbyId_academicSessionId: {
          studentId: dto.studentId,
          hobbyId,
          academicSessionId: dto.academicSessionId,
        },
      },
    });
    if (existing) throw new BadRequestException('Student is already enrolled in this hobby');

    const [enrollment] = await this.prisma.$transaction([
      this.prisma.hobbyEnrollment.create({
        data: {
          studentId: dto.studentId,
          hobbyId,
          academicSessionId: dto.academicSessionId,
          level: dto.level ?? 'BEGINNER',
          status: 'ENROLLED',
        },
      }),
      this.prisma.hobby.update({
        where: { id: hobbyId },
        data: { currentEnrollment: { increment: 1 } },
      }),
    ]);

    return enrollment;
  }

  async withdrawStudent(hobbyId: string, studentId: string, academicSessionId: string) {
    const enrollment = await this.prisma.hobbyEnrollment.findUnique({
      where: {
        studentId_hobbyId_academicSessionId: { studentId, hobbyId, academicSessionId },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status === 'WITHDRAWN') throw new BadRequestException('Student already withdrawn');

    const [updated] = await this.prisma.$transaction([
      this.prisma.hobbyEnrollment.update({
        where: { studentId_hobbyId_academicSessionId: { studentId, hobbyId, academicSessionId } },
        data: { status: 'WITHDRAWN' },
      }),
      this.prisma.hobby.update({
        where: { id: hobbyId },
        data: { currentEnrollment: { decrement: 1 } },
      }),
    ]);

    return updated;
  }

  async createSession(dto: CreateHobbySessionDto, conductedBy: string) {
    const hobby = await this.prisma.hobby.findUnique({ where: { id: dto.hobbyId } });
    if (!hobby) throw new NotFoundException('Hobby not found');

    return this.prisma.hobbySession.create({
      data: {
        hobbyId: dto.hobbyId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        activity: dto.activity,
        materials: dto.materials,
        notes: dto.notes,
        conductedBy,
      },
      include: {
        hobby: { select: { id: true, name: true } },
        conductor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async markAttendance(sessionId: string, attendances: MarkHobbyAttendanceDto[]) {
    const session = await this.prisma.hobbySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const results = await this.prisma.$transaction(
      attendances.map((a) =>
        this.prisma.hobbyAttendance.upsert({
          where: { sessionId_studentId: { sessionId, studentId: a.studentId } },
          create: { sessionId, studentId: a.studentId, status: a.status, remarks: a.remarks },
          update: { status: a.status, remarks: a.remarks },
        }),
      ),
    );

    return results;
  }

  async getSessionAttendance(sessionId: string) {
    return this.prisma.hobbyAttendance.findMany({
      where: { sessionId },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async getStudentPortfolio(studentId: string) {
    const enrollments = await this.prisma.hobbyEnrollment.findMany({
      where: { studentId },
      include: {
        hobby: {
          include: { coordinator: { select: { firstName: true, lastName: true } } },
        },
        academicSession: { select: { id: true, name: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const sessionAttendances = await this.prisma.hobbyAttendance.findMany({
      where: { studentId },
      include: {
        session: {
          include: { hobby: { select: { id: true, name: true } } },
        },
      },
      orderBy: { session: { date: 'desc' } },
    });

    const stats = enrollments.reduce(
      (acc, e) => {
        acc[e.hobby.category] = (acc[e.hobby.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { enrollments, sessionAttendances, categoryStats: stats };
  }
}

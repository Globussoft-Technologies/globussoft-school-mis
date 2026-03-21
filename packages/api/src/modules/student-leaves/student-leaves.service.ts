import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentLeaveDto } from './dto/create-student-leave.dto';

@Injectable()
export class StudentLeavesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentLeaveDto, appliedBy: string) {
    return this.prisma.studentLeave.create({
      data: {
        studentId: dto.studentId,
        appliedBy,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: 'PENDING',
      },
    });
  }

  async findAll(filters: { studentId?: string; status?: string }) {
    return this.prisma.studentLeave.findMany({
      where: {
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const leave = await this.prisma.studentLeave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Student leave not found');
    return leave;
  }

  async approve(id: string, approvedBy: string, status: string, remarks?: string) {
    await this.findOne(id);
    return this.prisma.studentLeave.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
        ...(remarks !== undefined ? { remarks } : {}),
      },
    });
  }
}

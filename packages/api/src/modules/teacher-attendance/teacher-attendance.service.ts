import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ApplyLeaveDto } from './dto/apply-leave.dto';

@Injectable()
export class TeacherAttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(dto: MarkAttendanceDto) {
    const { teacherId, date, status, checkIn, checkOut, remarks } = dto;
    return this.prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: {
          teacherId,
          date: new Date(date),
        },
      },
      update: { status, checkIn, checkOut, remarks },
      create: {
        teacherId,
        date: new Date(date),
        status,
        checkIn,
        checkOut,
        remarks,
      },
    });
  }

  async getTeacherAttendance(teacherId: string, startDate: string, endDate: string) {
    return this.prisma.teacherAttendance.findMany({
      where: {
        teacherId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getAllTeacherAttendance(date: string) {
    return this.prisma.teacherAttendance.findMany({
      where: {
        date: new Date(date),
      },
      orderBy: { teacherId: 'asc' },
    });
  }

  async applyLeave(applicantId: string, dto: ApplyLeaveDto) {
    return this.prisma.leaveApplication.create({
      data: {
        applicantId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: 'PENDING',
      },
    });
  }

  async getLeaves(filters: { applicantId?: string; status?: string }) {
    return this.prisma.leaveApplication.findMany({
      where: {
        ...(filters.applicantId ? { applicantId: filters.applicantId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveLeave(
    leaveId: string,
    approvedBy: string,
    status: string,
    remarks?: string,
  ) {
    const leave = await this.prisma.leaveApplication.findUnique({ where: { id: leaveId } });
    if (!leave) {
      throw new NotFoundException(`Leave application ${leaveId} not found`);
    }

    return this.prisma.leaveApplication.update({
      where: { id: leaveId },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
        remarks,
      },
    });
  }
}

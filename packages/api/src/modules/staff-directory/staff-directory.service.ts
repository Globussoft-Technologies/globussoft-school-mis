import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StaffDirectoryService {
  constructor(private prisma: PrismaService) {}

  async createProfile(data: {
    userId: string;
    employeeId: string;
    department: string;
    designation: string;
    dateOfJoining: string;
    qualification?: string;
    specialization?: string;
    experience?: number;
    emergencyContact?: string;
    emergencyPhone?: string;
    address?: string;
    bankAccount?: string;
    panNumber?: string;
  }) {
    const existingUser = await this.prisma.staffProfile.findUnique({ where: { userId: data.userId } });
    if (existingUser) throw new ConflictException('Staff profile already exists for this user');

    const existingEmpId = await this.prisma.staffProfile.findUnique({ where: { employeeId: data.employeeId } });
    if (existingEmpId) throw new ConflictException('Employee ID already in use');

    return this.prisma.staffProfile.create({
      data: {
        userId: data.userId,
        employeeId: data.employeeId,
        department: data.department,
        designation: data.designation,
        dateOfJoining: new Date(data.dateOfJoining),
        qualification: data.qualification,
        specialization: data.specialization,
        experience: data.experience,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
        bankAccount: data.bankAccount,
        panNumber: data.panNumber,
      },
    });
  }

  async updateProfile(userId: string, data: {
    department?: string;
    designation?: string;
    dateOfJoining?: string;
    qualification?: string;
    specialization?: string;
    experience?: number;
    emergencyContact?: string;
    emergencyPhone?: string;
    address?: string;
    bankAccount?: string;
    panNumber?: string;
  }) {
    const profile = await this.prisma.staffProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Staff profile not found');

    return this.prisma.staffProfile.update({
      where: { userId },
      data: {
        ...data,
        ...(data.dateOfJoining && { dateOfJoining: new Date(data.dateOfJoining) }),
      },
    });
  }

  async findAll(department?: string, designation?: string) {
    return this.prisma.staffProfile.findMany({
      where: {
        ...(department && { department }),
        ...(designation && { designation: { contains: designation } }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.staffProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Staff profile not found');
    return profile;
  }

  async getByDepartment(department: string) {
    return this.prisma.staffProfile.findMany({
      where: { department },
      orderBy: { designation: 'asc' },
    });
  }

  async getDepartmentStats() {
    const profiles = await this.prisma.staffProfile.findMany({
      select: { department: true },
    });

    const stats: Record<string, number> = {};
    for (const p of profiles) {
      stats[p.department] = (stats[p.department] || 0) + 1;
    }

    return Object.entries(stats).map(([department, count]) => ({ department, count }));
  }

  async search(q: string) {
    return this.prisma.staffProfile.findMany({
      where: {
        OR: [
          { designation: { contains: q } },
          { department: { contains: q } },
          { employeeId: { contains: q } },
          { specialization: { contains: q } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

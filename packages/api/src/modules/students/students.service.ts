import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const passwordHash = await bcrypt.hash('student123', 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'STUDENT',
          schoolId: dto.schoolId,
        },
      });

      const student = await tx.student.create({
        data: {
          admissionNo: dto.admissionNo,
          userId: user.id,
          classId: dto.classId,
          sectionId: dto.sectionId,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          bloodGroup: dto.bloodGroup,
          addressLine1: dto.addressLine1,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          academicSessionId: dto.academicSessionId,
        },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      });

      return student;
    });
  }

  async findAll(filters: { classId?: string; sectionId?: string; academicSessionId?: string }) {
    return this.prisma.student.findMany({
      where: {
        isActive: true,
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.academicSessionId && { academicSessionId: filters.academicSessionId }),
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
        guardians: true,
      },
    });
  }

  async findById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        class: true,
        section: true,
        guardians: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }
}

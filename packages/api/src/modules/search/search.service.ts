import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string, limit = 5) {
    if (!query || query.trim().length === 0) {
      return { students: [], users: [], subjects: [], enquiries: [] };
    }

    const q = query.trim();

    const [students, users, subjects, enquiries] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          isActive: true,
          OR: [
            { admissionNo: { contains: q } },
            { user: { firstName: { contains: q } } },
            { user: { lastName: { contains: q } } },
            { user: { email: { contains: q } } },
          ],
        },
        select: {
          id: true,
          admissionNo: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        take: 5,
      }),

      this.prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
        take: 5,
      }),

      this.prisma.subject.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { code: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          class: { select: { name: true } },
        },
        take: 3,
      }),

      this.prisma.admissionEnquiry.findMany({
        where: {
          OR: [
            { studentName: { contains: q } },
            { parentName: { contains: q } },
          ],
        },
        select: {
          id: true,
          studentName: true,
          parentName: true,
          parentPhone: true,
          status: true,
          classAppliedFor: true,
        },
        take: 3,
      }),
    ]);

    return {
      students: students.map((s) => ({
        id: s.id,
        admissionNo: s.admissionNo,
        name: `${s.user.firstName} ${s.user.lastName}`,
        email: s.user.email,
        class: s.class?.name,
        section: s.section?.name,
      })),
      users: users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        class: s.class?.name,
      })),
      enquiries: enquiries.map((e) => ({
        id: e.id,
        studentName: e.studentName,
        parentName: e.parentName,
        parentPhone: e.parentPhone,
        status: e.status,
        classAppliedFor: e.classAppliedFor,
      })),
    };
  }
}

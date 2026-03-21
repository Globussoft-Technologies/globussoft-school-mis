import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlumniService {
  constructor(private prisma: PrismaService) {}

  async register(data: {
    name: string;
    email?: string;
    phone?: string;
    graduationYear: number;
    lastClass: string;
    currentStatus?: string;
    organization?: string;
    designation?: string;
    city?: string;
    linkedinUrl?: string;
    achievements?: string;
    photoUrl?: string;
    schoolId: string;
  }) {
    return this.prisma.alumni.create({ data });
  }

  async findAll(schoolId: string, graduationYear?: number, status?: string) {
    return this.prisma.alumni.findMany({
      where: {
        schoolId,
        ...(graduationYear && { graduationYear }),
        ...(status && { currentStatus: status }),
      },
      orderBy: [{ graduationYear: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const alumni = await this.prisma.alumni.findUnique({ where: { id } });
    if (!alumni) throw new NotFoundException('Alumni not found');
    return alumni;
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      currentStatus?: string;
      organization?: string;
      designation?: string;
      city?: string;
      linkedinUrl?: string;
      achievements?: string;
      photoUrl?: string;
    },
  ) {
    await this.findOne(id);
    return this.prisma.alumni.update({ where: { id }, data });
  }

  async verify(id: string) {
    await this.findOne(id);
    return this.prisma.alumni.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async search(schoolId: string, q: string) {
    return this.prisma.alumni.findMany({
      where: {
        schoolId,
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { organization: { contains: q } },
          { city: { contains: q } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }

  async getStats(schoolId: string) {
    const all = await this.prisma.alumni.findMany({ where: { schoolId } });

    const total = all.length;
    const verified = all.filter((a) => a.isVerified).length;

    const byYear: Record<number, number> = {};
    const byStatus: Record<string, number> = {};
    const byDecade: Record<string, number> = {};

    for (const a of all) {
      byYear[a.graduationYear] = (byYear[a.graduationYear] ?? 0) + 1;

      const status = a.currentStatus ?? 'UNKNOWN';
      byStatus[status] = (byStatus[status] ?? 0) + 1;

      const decade = `${Math.floor(a.graduationYear / 10) * 10}s`;
      byDecade[decade] = (byDecade[decade] ?? 0) + 1;
    }

    return { total, verified, byYear, byStatus, byDecade };
  }
}

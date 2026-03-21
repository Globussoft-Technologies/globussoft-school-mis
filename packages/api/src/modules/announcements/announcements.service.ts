import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  type: string;
  audience: string;
  classId?: string;
  priority?: string;
  publishedAt?: Date;
  expiresAt?: Date;
  isPublished?: boolean;
  schoolId: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  type?: string;
  audience?: string;
  classId?: string;
  priority?: string;
  expiresAt?: Date;
}

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto, createdBy: string) {
    return this.prisma.announcement.create({
      data: {
        ...dto,
        createdBy,
        publishedAt: dto.isPublished ? (dto.publishedAt ?? new Date()) : null,
      },
    });
  }

  async findAll(type?: string, audience?: string, isPublished?: string) {
    return this.prisma.announcement.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(audience ? { audience } : {}),
        ...(isPublished !== undefined ? { isPublished: isPublished === 'true' } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.findOne(id);
    return this.prisma.announcement.update({ where: { id }, data: dto });
  }

  async publish(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.delete({ where: { id } });
  }

  /**
   * Get all published announcements that have not yet expired.
   */
  async getActive(schoolId?: string) {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        isPublished: true,
        ...(schoolId ? { schoolId } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLmsContentDto } from './dto/create-lms-content.dto';
import { UpdateLmsContentDto } from './dto/update-lms-content.dto';

@Injectable()
export class LmsContentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLmsContentDto, uploadedBy: string) {
    return this.prisma.lmsContent.create({
      data: { ...dto, uploadedBy },
      include: { subject: { select: { name: true } }, class: { select: { name: true } } },
    });
  }

  async findAll(filters: { subjectId?: string; classId?: string; type?: string; isPublished?: boolean }) {
    return this.prisma.lmsContent.findMany({
      where: {
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.isPublished !== undefined && { isPublished: filters.isPublished }),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        topic: { select: { id: true, title: true } },
        uploader: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const content = await this.prisma.lmsContent.findUnique({
      where: { id },
      include: {
        subject: true,
        class: true,
        topic: true,
        uploader: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  async update(id: string, dto: UpdateLmsContentDto) {
    return this.prisma.lmsContent.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.lmsContent.delete({ where: { id } });
  }

  async publish(id: string) {
    return this.prisma.lmsContent.update({
      where: { id },
      data: { isPublished: true },
    });
  }
}

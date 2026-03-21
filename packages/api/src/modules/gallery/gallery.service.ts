import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async createAlbum(data: {
    title: string;
    description?: string;
    coverUrl?: string;
    eventDate?: string;
    category: string;
    schoolId: string;
    createdBy: string;
  }) {
    return this.prisma.galleryAlbum.create({
      data: {
        title: data.title,
        description: data.description,
        coverUrl: data.coverUrl,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        category: data.category,
        schoolId: data.schoolId,
        createdBy: data.createdBy,
        isPublished: false,
      },
      include: { photos: true },
    });
  }

  async addPhoto(albumId: string, data: {
    url: string;
    caption?: string;
    sortOrder?: number;
  }) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id: albumId } });
    if (!album) throw new NotFoundException('Album not found');

    return this.prisma.galleryPhoto.create({
      data: {
        albumId,
        url: data.url,
        caption: data.caption,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async removePhoto(photoId: string) {
    const photo = await this.prisma.galleryPhoto.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('Photo not found');

    return this.prisma.galleryPhoto.delete({ where: { id: photoId } });
  }

  async findAll(category?: string, isPublished?: boolean) {
    return this.prisma.galleryAlbum.findMany({
      where: {
        ...(category && { category }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { photos: true } },
      },
    });
    if (!album) throw new NotFoundException('Album not found');
    return album;
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    coverUrl?: string;
    eventDate?: string;
    category?: string;
  }) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');

    return this.prisma.galleryAlbum.update({
      where: { id },
      data: {
        ...data,
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ? new Date(data.eventDate) : null }),
      },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async publish(id: string) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');

    return this.prisma.galleryAlbum.update({
      where: { id },
      data: { isPublished: !album.isPublished },
    });
  }

  async delete(id: string) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');

    return this.prisma.galleryAlbum.delete({ where: { id } });
  }

  async getPublicGallery(schoolId: string) {
    return this.prisma.galleryAlbum.findMany({
      where: { schoolId, isPublished: true },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

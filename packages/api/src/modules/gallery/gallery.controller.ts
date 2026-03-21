import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Gallery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gallery')
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Post('albums')
  @ApiOperation({ summary: 'Create a gallery album' })
  createAlbum(
    @Body()
    body: {
      title: string;
      description?: string;
      coverUrl?: string;
      eventDate?: string;
      category: string;
    },
    @CurrentUser('sub') createdBy: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.galleryService.createAlbum({ ...body, createdBy, schoolId });
  }

  @Get('albums')
  @ApiOperation({ summary: 'Get all albums with optional filters' })
  findAll(
    @Query('category') category?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const publishedFilter =
      isPublished === 'true' ? true : isPublished === 'false' ? false : undefined;
    return this.galleryService.findAll(category, publishedFilter);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public gallery for school' })
  getPublicGallery(@CurrentUser('schoolId') schoolId: string) {
    return this.galleryService.getPublicGallery(schoolId);
  }

  @Get('albums/:id')
  @ApiOperation({ summary: 'Get album by id with photos' })
  findById(@Param('id') id: string) {
    return this.galleryService.findById(id);
  }

  @Patch('albums/:id')
  @ApiOperation({ summary: 'Update album details' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      coverUrl?: string;
      eventDate?: string;
      category?: string;
    },
  ) {
    return this.galleryService.update(id, body);
  }

  @Patch('albums/:id/publish')
  @ApiOperation({ summary: 'Toggle publish status of an album' })
  publish(@Param('id') id: string) {
    return this.galleryService.publish(id);
  }

  @Delete('albums/:id')
  @ApiOperation({ summary: 'Delete an album and all its photos' })
  delete(@Param('id') id: string) {
    return this.galleryService.delete(id);
  }

  @Post('albums/:id/photos')
  @ApiOperation({ summary: 'Add a photo to an album' })
  addPhoto(
    @Param('id') albumId: string,
    @Body()
    body: {
      url: string;
      caption?: string;
      sortOrder?: number;
    },
  ) {
    return this.galleryService.addPhoto(albumId, body);
  }

  @Delete('photos/:id')
  @ApiOperation({ summary: 'Delete a photo' })
  removePhoto(@Param('id') photoId: string) {
    return this.galleryService.removePhoto(photoId);
  }
}

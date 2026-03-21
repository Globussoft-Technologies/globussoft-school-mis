import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnnouncementsService, CreateAnnouncementDto, UpdateAnnouncementDto } from './announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'PRINCIPAL', 'ACADEMIC_COORDINATOR', 'DIRECTOR')
  @ApiOperation({ summary: 'Create a new announcement or circular' })
  create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.announcementsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List announcements with optional filters' })
  findAll(
    @Query('type') type?: string,
    @Query('audience') audience?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    return this.announcementsService.findAll(type, audience, isPublished);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active (published, not expired) announcements' })
  getActive(@Query('schoolId') schoolId?: string) {
    return this.announcementsService.getActive(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single announcement by ID' })
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'PRINCIPAL', 'ACADEMIC_COORDINATOR', 'DIRECTOR')
  @ApiOperation({ summary: 'Update an announcement' })
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'PRINCIPAL', 'ACADEMIC_COORDINATOR', 'DIRECTOR')
  @ApiOperation({ summary: 'Publish an announcement' })
  publish(@Param('id') id: string) {
    return this.announcementsService.publish(id);
  }

  @Patch(':id/unpublish')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'PRINCIPAL', 'ACADEMIC_COORDINATOR', 'DIRECTOR')
  @ApiOperation({ summary: 'Unpublish an announcement' })
  unpublish(@Param('id') id: string) {
    return this.announcementsService.unpublish(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Delete an announcement' })
  delete(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }
}

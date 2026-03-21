import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AlumniService } from './alumni.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Alumni')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alumni')
export class AlumniController {
  constructor(private alumniService: AlumniService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new alumni' })
  register(
    @Body()
    body: {
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
    },
    @CurrentUser('schoolId') schoolId: string,
  ) {
    return this.alumniService.register({ ...body, schoolId });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get alumni statistics' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.alumniService.getStats(schoolId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search alumni by name, email, organization, city' })
  search(
    @CurrentUser('schoolId') schoolId: string,
    @Query('q') q: string,
  ) {
    return this.alumniService.search(schoolId, q || '');
  }

  @Get()
  @ApiOperation({ summary: 'Get all alumni with optional filters' })
  findAll(
    @CurrentUser('schoolId') schoolId: string,
    @Query('graduationYear') graduationYear?: string,
    @Query('status') status?: string,
  ) {
    return this.alumniService.findAll(
      schoolId,
      graduationYear ? parseInt(graduationYear) : undefined,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single alumni record' })
  findOne(@Param('id') id: string) {
    return this.alumniService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alumni details' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.alumniService.update(id, body);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify an alumni record' })
  verify(@Param('id') id: string) {
    return this.alumniService.verify(id);
  }
}

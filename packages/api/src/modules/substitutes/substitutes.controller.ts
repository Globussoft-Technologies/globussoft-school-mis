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
import { SubstitutesService } from './substitutes.service';
import { CreateSubstituteDto } from './dto/create-substitute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Substitutes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('substitutes')
export class SubstitutesController {
  constructor(private readonly substitutesService: SubstitutesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Assign a substitute teacher' })
  create(
    @Body() dto: CreateSubstituteDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.substitutesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List substitute assignments with optional filters' })
  findAll(
    @Query('date') date?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.substitutesService.findAll({ date, teacherId });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested substitute teachers free during a period' })
  getSuggestions(
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.substitutesService.getSuggestedSubstitutes(date, startTime, endTime);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a substitute assignment' })
  accept(@Param('id') id: string) {
    return this.substitutesService.accept(id);
  }

  @Patch(':id/complete')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Mark a substitute assignment as completed' })
  complete(@Param('id') id: string) {
    return this.substitutesService.complete(id);
  }

  @Patch(':id/cancel')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'Cancel a substitute assignment' })
  cancel(@Param('id') id: string) {
    return this.substitutesService.cancel(id);
  }
}

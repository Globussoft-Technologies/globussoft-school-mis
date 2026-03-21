import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IdCardsService } from './id-cards.service';
import { GenerateIdCardDto } from './dto/generate-id-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('ID Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('id-cards')
export class IdCardsController {
  constructor(private readonly idCardsService: IdCardsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Generate an ID card for a user' })
  generate(@Body() dto: GenerateIdCardDto) {
    return this.idCardsService.generate(dto);
  }

  @Post('bulk/:classId')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Bulk generate ID cards for all students in a class' })
  bulkGenerate(@Param('classId') classId: string) {
    return this.idCardsService.bulkGenerate(classId);
  }

  @Get()
  @ApiOperation({ summary: 'List all ID cards with optional filters' })
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.idCardsService.findAll(type, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ID card' })
  findOne(@Param('id') id: string) {
    return this.idCardsService.findOne(id);
  }

  @Patch(':id/revoke')
  @Roles('SUPER_ADMIN', 'IT_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Revoke an ID card' })
  revoke(@Param('id') id: string) {
    return this.idCardsService.revoke(id);
  }

  @Patch(':id/lost')
  @ApiOperation({ summary: 'Report an ID card as lost' })
  reportLost(@Param('id') id: string) {
    return this.idCardsService.reportLost(id);
  }

  @Get(':id/print')
  @ApiOperation({ summary: 'Get structured card data for printing' })
  getPrintData(@Param('id') id: string) {
    return this.idCardsService.markPrinted(id);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private service: SearchService) {}

  @Get()
  search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.globalSearch(q, limit ? Number(limit) : 5);
  }
}

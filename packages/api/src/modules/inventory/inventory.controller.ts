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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  addItem(@Body() body: any) {
    return this.inventoryService.addItem(body);
  }

  @Get('low-stock')
  getLowStock(
    @Query('threshold') threshold?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.inventoryService.getLowStock(
      threshold ? parseInt(threshold, 10) : 5,
      schoolId,
    );
  }

  @Get('logs')
  getLogs(@Query('schoolId') schoolId?: string) {
    return this.inventoryService.getAllLogs(schoolId);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('location') location?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.inventoryService.findAll({ search, category, condition, location, schoolId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  updateItem(@Param('id') id: string, @Body() body: any) {
    return this.inventoryService.updateItem(id, body);
  }

  @Post(':id/assign')
  assignItem(@Param('id') id: string, @Body() body: any) {
    return this.inventoryService.assignItem(id, body);
  }

  @Post(':id/return')
  returnItem(@Param('id') id: string, @Body() body: any) {
    return this.inventoryService.returnItem(id, body);
  }
}

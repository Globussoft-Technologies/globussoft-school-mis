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
import { DiaryService } from './diary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Diary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('diary')
export class DiaryController {
  constructor(private diaryService: DiaryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a diary entry' })
  create(
    @Body()
    body: {
      studentId?: string;
      classId?: string;
      sectionId?: string;
      date: string;
      type: string;
      subject?: string;
      content: string;
      isPublished?: boolean;
    },
    @CurrentUser('sub') createdBy: string,
  ) {
    return this.diaryService.create({ ...body, createdBy });
  }

  @Get()
  @ApiOperation({ summary: 'Get diary entries by classId and/or date' })
  getByClassAndDate(
    @Query('classId') classId: string,
    @Query('date') date: string,
    @Query('sectionId') sectionId?: string,
  ) {
    if (classId && date) {
      return this.diaryService.getByClassAndDate(classId, date, sectionId);
    }
    if (date) {
      return this.diaryService.getByDate(date, classId, sectionId);
    }
    return this.diaryService.getByDate(
      new Date().toISOString().split('T')[0],
      classId,
      sectionId,
    );
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get diary entries for a specific student' })
  getByStudent(
    @Param('studentId') studentId: string,
    @Query('date') date?: string,
  ) {
    return this.diaryService.getByStudent(studentId, date);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a diary entry' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      type?: string;
      subject?: string;
      content?: string;
      isPublished?: boolean;
    },
  ) {
    return this.diaryService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a diary entry' })
  delete(@Param('id') id: string) {
    return this.diaryService.delete(id);
  }
}

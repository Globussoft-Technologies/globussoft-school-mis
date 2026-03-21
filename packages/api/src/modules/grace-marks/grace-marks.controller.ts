import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { GraceMarksService, CreateGraceMarkDto } from './grace-marks.service';

@Controller('grace-marks')
export class GraceMarksController {
  constructor(private readonly service: GraceMarksService) {}

  @Post()
  create(@Body() dto: CreateGraceMarkDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.findAll({ studentId, subjectId });
  }

  @Get('student/:studentId')
  getStudentGraceMarks(@Param('studentId') studentId: string) {
    return this.service.getStudentGraceMarks(studentId);
  }

  @Get('adjusted')
  calculateAdjustedScore(
    @Query('studentId') studentId: string,
    @Query('subjectId') subjectId: string,
  ) {
    return this.service.calculateAdjustedScore(studentId, subjectId);
  }
}

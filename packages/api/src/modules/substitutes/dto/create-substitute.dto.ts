import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubstituteDto {
  @ApiProperty()
  @IsString()
  originalTeacherId: string;

  @ApiProperty()
  @IsString()
  substituteTeacherId: string;

  @ApiProperty({ example: '2026-03-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timetableSlotId?: string;

  @ApiProperty()
  @IsString()
  classId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

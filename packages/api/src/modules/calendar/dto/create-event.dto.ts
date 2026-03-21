import { IsString, IsOptional, IsDateString, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const EVENT_TYPES = ['HOLIDAY', 'EXAM', 'EVENT', 'MEETING', 'DEADLINE', 'OTHER'];

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EVENT_TYPES })
  @IsIn(EVENT_TYPES)
  type: string;

  @ApiProperty({ example: '2026-03-20' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-03-22' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty()
  @IsString()
  schoolId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

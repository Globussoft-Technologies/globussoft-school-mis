import { IsString, IsOptional, IsDateString, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const EVENT_TYPES = ['HOLIDAY', 'EXAM', 'EVENT', 'MEETING', 'DEADLINE', 'OTHER'];

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EVENT_TYPES })
  @IsOptional()
  @IsIn(EVENT_TYPES)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

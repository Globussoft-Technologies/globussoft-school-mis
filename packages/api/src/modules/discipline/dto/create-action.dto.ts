import { IsString, IsOptional, IsBoolean, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActionDto {
  @ApiProperty()
  @IsString()
  incidentId: string;

  @ApiProperty({
    enum: ['WARNING', 'DETENTION', 'PARENT_MEETING', 'SUSPENSION', 'EXPULSION'],
  })
  @IsIn(['WARNING', 'DETENTION', 'PARENT_MEETING', 'SUSPENSION', 'EXPULSION'])
  actionType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

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
  parentNotified?: boolean;
}

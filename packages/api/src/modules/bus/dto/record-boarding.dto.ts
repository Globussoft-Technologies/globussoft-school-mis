import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordBoardingDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  routeId: string;

  @ApiProperty()
  @IsString()
  stopId: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boardingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alightingTime?: string;

  @ApiProperty({ enum: ['MORNING', 'EVENING'] })
  @IsIn(['MORNING', 'EVENING'])
  type: string;

  @ApiPropertyOptional({ enum: ['BOARDED', 'ALIGHTED', 'ABSENT'] })
  @IsOptional()
  @IsIn(['BOARDED', 'ALIGHTED', 'ABSENT'])
  status?: string;
}

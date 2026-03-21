import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiProperty({ example: 'uuid-of-teacher' })
  @IsString()
  teacherId: string;

  @ApiProperty({ example: '2026-03-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'] })
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'])
  status: string;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @IsString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '16:00' })
  @IsOptional()
  @IsString()
  checkOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyLeaveDto {
  @ApiProperty({ enum: ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'UNPAID'] })
  @IsIn(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'UNPAID'])
  type: string;

  @ApiProperty({ example: '2026-03-20' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-22' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Medical appointment' })
  @IsString()
  reason: string;
}

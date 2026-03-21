import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentLeaveDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ enum: ['SICK', 'FAMILY', 'VACATION', 'OTHER'] })
  @IsIn(['SICK', 'FAMILY', 'VACATION', 'OTHER'])
  type: string;

  @ApiProperty({ example: '2026-03-20' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-22' })
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}

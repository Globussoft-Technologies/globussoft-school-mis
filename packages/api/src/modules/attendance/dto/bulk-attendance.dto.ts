import { IsString, IsArray, ValidateNested, IsOptional, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AttendanceRecordDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'] })
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkAttendanceDto {
  @ApiProperty()
  @IsString()
  classId: string;

  @ApiProperty()
  @IsString()
  sectionId: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}

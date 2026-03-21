import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHobbyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['VISUAL_ARTS', 'PERFORMING_ARTS', 'SPORTS', 'TECHNOLOGY', 'LITERARY', 'PHOTOGRAPHY'] })
  @IsIn(['VISUAL_ARTS', 'PERFORMING_ARTS', 'SPORTS', 'TECHNOLOGY', 'LITERARY', 'PHOTOGRAPHY'])
  category: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  maxCapacity: number;

  @ApiProperty()
  @IsString()
  coordinatorId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty()
  @IsString()
  schoolId: string;
}

export class EnrollStudentDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  academicSessionId: string;

  @ApiProperty({ required: false, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  @IsOptional()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  level?: string;
}

export class CreateHobbySessionDto {
  @ApiProperty()
  @IsString()
  hobbyId: string;

  @ApiProperty()
  @IsString()
  date: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsString()
  activity: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  materials?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkHobbyAttendanceDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT'] })
  @IsIn(['PRESENT', 'ABSENT'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

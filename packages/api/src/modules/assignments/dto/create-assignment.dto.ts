import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ enum: ['FILE_SUBMISSION', 'TEXT_RESPONSE', 'ONLINE_QUIZ', 'DRAWING'] })
  @IsIn(['FILE_SUBMISSION', 'TEXT_RESPONSE', 'ONLINE_QUIZ', 'DRAWING'])
  type: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  classId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowLate?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  latePenalty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty()
  @IsString()
  academicSessionId: string;
}

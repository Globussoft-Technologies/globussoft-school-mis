import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssessmentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ enum: ['CLASSWORK', 'HOMEWORK', 'QUIZ', 'UNIT_TEST', 'MID_TERM', 'FINAL_EXAM', 'PRACTICAL', 'PROJECT'] })
  @IsIn(['CLASSWORK', 'HOMEWORK', 'QUIZ', 'UNIT_TEST', 'MID_TERM', 'FINAL_EXAM', 'PRACTICAL', 'PROJECT'])
  type: string;

  @ApiProperty()
  @IsNumber()
  tier: number;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  classId: string;

  @ApiProperty()
  @IsString()
  academicSessionId: string;

  @ApiProperty()
  @IsNumber()
  totalMarks: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passingMarks?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  questionIds?: string[];
}

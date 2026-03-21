import { IsString, IsOptional, IsNumber, IsIn, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  bankId: string;

  @ApiProperty({ enum: ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'FILL_BLANK', 'MATCH', 'ASSERTION_REASON', 'CASE_STUDY'] })
  @IsIn(['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'FILL_BLANK', 'MATCH', 'ASSERTION_REASON', 'CASE_STUDY'])
  type: string;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty({ required: false })
  @IsOptional()
  options?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  marks?: number;

  @ApiProperty({ required: false, enum: ['EASY', 'MEDIUM', 'HARD'] })
  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficultyLevel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAssessmentDto {
  @ApiProperty()
  @IsString()
  assessmentId: string;

  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  answers?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}

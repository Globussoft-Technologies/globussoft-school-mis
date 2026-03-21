import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGradeDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @ApiProperty({ enum: ['ASSESSMENT', 'CLASSWORK', 'PARTICIPATION', 'ATTENDANCE_BONUS', 'EXTRA_CREDIT'] })
  @IsIn(['ASSESSMENT', 'CLASSWORK', 'PARTICIPATION', 'ATTENDANCE_BONUS', 'EXTRA_CREDIT'])
  type: string;

  @ApiProperty()
  @IsNumber()
  marksObtained: number;

  @ApiProperty()
  @IsNumber()
  maxMarks: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAssignmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty()
  @IsString()
  studentId: string;
}

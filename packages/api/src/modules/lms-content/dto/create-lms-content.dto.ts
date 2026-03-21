import { IsString, IsOptional, IsBoolean, IsIn, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLmsContentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['VIDEO', 'DOCUMENT', 'PRESENTATION', 'LINK', 'AUDIO', 'INTERACTIVE'] })
  @IsIn(['VIDEO', 'DOCUMENT', 'PRESENTATION', 'LINK', 'AUDIO', 'INTERACTIVE'])
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  classId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;
}

import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLmsContentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

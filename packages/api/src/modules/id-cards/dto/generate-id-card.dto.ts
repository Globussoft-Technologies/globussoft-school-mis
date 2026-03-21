import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateIdCardDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: ['STUDENT', 'TEACHER', 'STAFF'] })
  @IsIn(['STUDENT', 'TEACHER', 'STAFF'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class BulkGenerateDto {
  @ApiProperty({ enum: ['STUDENT', 'TEACHER', 'STAFF'] })
  @IsIn(['STUDENT', 'TEACHER', 'STAFF'])
  type: string;
}

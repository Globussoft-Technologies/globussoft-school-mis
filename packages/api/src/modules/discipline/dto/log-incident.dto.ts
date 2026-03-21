import { IsString, IsArray, IsOptional, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogIncidentDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({
    enum: ['MISCONDUCT', 'BULLYING', 'PROPERTY_DAMAGE', 'CHEATING', 'ALTERCATION', 'UNIFORM_VIOLATION', 'MOBILE_USE', 'OTHER'],
  })
  @IsIn(['MISCONDUCT', 'BULLYING', 'PROPERTY_DAMAGE', 'CHEATING', 'ALTERCATION', 'UNIFORM_VIOLATION', 'MOBILE_USE', 'OTHER'])
  type: string;

  @ApiProperty({ enum: ['MINOR', 'MODERATE', 'SERIOUS'] })
  @IsIn(['MINOR', 'MODERATE', 'SERIOUS'])
  severity: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  witnesses?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}

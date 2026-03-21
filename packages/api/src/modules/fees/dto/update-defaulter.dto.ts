import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDefaulterDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'RESOLVED', 'ESCALATED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'RESOLVED', 'ESCALATED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  callAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastCallStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  escalatedTo?: string;
}

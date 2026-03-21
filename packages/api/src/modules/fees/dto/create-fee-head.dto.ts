import { IsString, IsNumber, IsOptional, IsBoolean, IsIn, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeHeadDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty()
  @IsString()
  classId: string;

  @ApiProperty()
  @IsString()
  academicSessionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME'] })
  @IsOptional()
  @IsIn(['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME'])
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  dueDay?: number;
}

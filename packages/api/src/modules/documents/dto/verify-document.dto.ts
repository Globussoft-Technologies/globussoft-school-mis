import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogMessageDto {
  @ApiProperty({ enum: ['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'] })
  @IsIn(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'])
  type: string;

  @ApiProperty()
  @IsString()
  recipient: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateMessageStatusDto {
  @ApiProperty({ enum: ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'] })
  @IsIn(['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failReason?: string;
}

import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({
    enum: ['ATTENDANCE', 'TEST_RESULT', 'FEE_DUE', 'HOMEWORK', 'RED_FLAG', 'BUS', 'GENERAL'],
  })
  @IsIn(['ATTENDANCE', 'TEST_RESULT', 'FEE_DUE', 'HOMEWORK', 'RED_FLAG', 'BUS', 'GENERAL'])
  type: string;

  @ApiProperty({ enum: ['PUSH', 'SMS', 'WHATSAPP', 'EMAIL'] })
  @IsIn(['PUSH', 'SMS', 'WHATSAPP', 'EMAIL'])
  channel: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class BulkCreateNotificationDto {
  @ApiProperty({ type: [String] })
  userIds: string[];

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({
    enum: ['ATTENDANCE', 'TEST_RESULT', 'FEE_DUE', 'HOMEWORK', 'RED_FLAG', 'BUS', 'GENERAL'],
  })
  @IsIn(['ATTENDANCE', 'TEST_RESULT', 'FEE_DUE', 'HOMEWORK', 'RED_FLAG', 'BUS', 'GENERAL'])
  type: string;

  @ApiProperty({ enum: ['PUSH', 'SMS', 'WHATSAPP', 'EMAIL'] })
  @IsIn(['PUSH', 'SMS', 'WHATSAPP', 'EMAIL'])
  channel: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

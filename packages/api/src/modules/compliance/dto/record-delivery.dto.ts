import { IsString, IsOptional, IsNumber, IsArray, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordDeliveryDto {
  @ApiProperty()
  @IsString()
  lessonPlanId: string;

  @ApiProperty()
  @IsDateString()
  deliveredAt: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  topicsCovered?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  studentCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ required: false, enum: ['COMPLETED', 'PARTIAL', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['COMPLETED', 'PARTIAL', 'CANCELLED'])
  status?: string;
}

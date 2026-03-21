import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnquiryDto {
  @ApiProperty()
  @IsString()
  studentName: string;

  @ApiProperty()
  @IsString()
  parentName: string;

  @ApiProperty()
  @IsString()
  parentPhone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentEmail?: string;

  @ApiProperty()
  @IsString()
  classAppliedFor: string;

  @ApiProperty({ enum: ['WALK_IN', 'WEBSITE', 'REFERRAL', 'ADVERTISEMENT'] })
  @IsIn(['WALK_IN', 'WEBSITE', 'REFERRAL', 'ADVERTISEMENT'])
  source: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  academicSessionId: string;
}

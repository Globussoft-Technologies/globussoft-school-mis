import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  enquiryId: string;

  @ApiProperty()
  @IsString()
  studentFirstName: string;

  @ApiProperty()
  @IsString()
  studentLastName: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsString()
  gender: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  previousSchool?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pincode?: string;
}

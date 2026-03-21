import { IsString, IsEmail, IsOptional, IsIn, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  admissionNo: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  classId: string;

  @ApiProperty()
  @IsString()
  sectionId: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

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

  @ApiProperty()
  @IsString()
  academicSessionId: string;

  @ApiProperty()
  @IsString()
  schoolId: string;
}

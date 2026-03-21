import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: ['SUPER_ADMIN', 'DIRECTOR', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACCOUNTANT', 'TRANSPORT_MANAGER', 'HOBBY_COORDINATOR', 'IT_ADMIN', 'PARENT', 'STUDENT'] })
  @IsIn(['SUPER_ADMIN', 'DIRECTOR', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACCOUNTANT', 'TRANSPORT_MANAGER', 'HOBBY_COORDINATOR', 'IT_ADMIN', 'PARENT', 'STUDENT'])
  role: string;

  @ApiProperty()
  @IsString()
  schoolId: string;
}

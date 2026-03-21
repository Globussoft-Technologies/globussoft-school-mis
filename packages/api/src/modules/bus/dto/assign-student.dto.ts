import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignStudentDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  routeId: string;

  @ApiProperty()
  @IsString()
  stopId: string;

  @ApiProperty()
  @IsString()
  academicSessionId: string;
}

import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessApplicationDto {
  @ApiProperty({
    enum: [
      'APPLICATION',
      'ENTRANCE_TEST',
      'INTERVIEW',
      'OFFER',
      'ACCEPTED',
      'ENROLLED',
      'REJECTED',
      'WITHDRAWN',
    ],
  })
  @IsIn([
    'APPLICATION',
    'ENTRANCE_TEST',
    'INTERVIEW',
    'OFFER',
    'ACCEPTED',
    'ENROLLED',
    'REJECTED',
    'WITHDRAWN',
  ])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

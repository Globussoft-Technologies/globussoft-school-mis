import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveLeaveDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  status: string;

  @ApiPropertyOptional({ example: 'Approved as per leave policy' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

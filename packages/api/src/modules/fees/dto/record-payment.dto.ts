import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  feeHeadId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  paidAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ enum: ['CASH', 'ONLINE', 'CHEQUE', 'UPI'] })
  @IsOptional()
  @IsIn(['CASH', 'ONLINE', 'CHEQUE', 'UPI'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty()
  @IsString()
  receiptNo: string;
}

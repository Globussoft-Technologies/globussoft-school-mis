import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DOCUMENT_TYPES = [
  'BIRTH_CERTIFICATE',
  'TRANSFER_CERTIFICATE',
  'AADHAAR',
  'PHOTO',
  'MEDICAL',
  'REPORT_CARD',
  'CONSENT_FORM',
  'ADDRESS_PROOF',
  'OTHER',
];

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

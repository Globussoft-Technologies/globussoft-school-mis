import { IsString, IsInt, IsOptional, IsBoolean, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty()
  @IsString()
  number: string;

  @ApiPropertyOptional({ enum: ['BUS', 'VAN', 'OTHER'] })
  @IsOptional()
  @IsIn(['BUS', 'VAN', 'OTHER'])
  type?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conductorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conductorPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gpsDeviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

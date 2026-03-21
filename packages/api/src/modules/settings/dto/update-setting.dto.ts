import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty()
  @IsString()
  value: string;
}

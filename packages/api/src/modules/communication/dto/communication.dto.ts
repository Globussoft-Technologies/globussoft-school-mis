import { IsString, IsOptional, IsNumber, IsArray, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePTMSlotDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsString()
  classId: string;

  @ApiProperty()
  @IsNumber()
  maxBookings: number;

  @ApiProperty()
  @IsString()
  academicSessionId: string;
}

export class BookPTMSlotDto {
  @ApiProperty()
  @IsString()
  slotId: string;

  @ApiProperty()
  @IsString()
  studentId: string;
}

export class CompletePTMDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingNotes?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  actionItems?: string[];
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  conversationId: string;

  @ApiProperty()
  @IsString()
  content: string;
}

export class CreateConversationDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  participantIds: string[];

  @ApiProperty({ enum: ['PARENT_TEACHER', 'ANNOUNCEMENT', 'GROUP'] })
  @IsIn(['PARENT_TEACHER', 'ANNOUNCEMENT', 'GROUP'])
  type: string;

  @ApiProperty()
  @IsString()
  schoolId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import {
  CreatePTMSlotDto,
  BookPTMSlotDto,
  CompletePTMDto,
  SendMessageDto,
  CreateConversationDto,
} from './dto/communication.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Communication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private communicationService: CommunicationService) {}

  // ─── PTM ─────────────────────────────────────────────────────────

  @Post('ptm/slots')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  createPTMSlot(
    @Body() dto: CreatePTMSlotDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.communicationService.createPTMSlot(dto, userId);
  }

  @Get('ptm/slots')
  getPTMSlots(
    @Query('teacherId') teacherId?: string,
    @Query('classId') classId?: string,
    @Query('academicSessionId') academicSessionId?: string,
    @Query('date') date?: string,
  ) {
    return this.communicationService.getPTMSlots({ teacherId, classId, academicSessionId, date });
  }

  @Post('ptm/book')
  bookPTMSlot(
    @Body() dto: BookPTMSlotDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.communicationService.bookPTMSlot(dto, userId);
  }

  @Patch('ptm/bookings/:id/cancel')
  cancelPTMBooking(
    @Param('id') bookingId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.communicationService.cancelPTMBooking(bookingId, userId);
  }

  @Patch('ptm/bookings/:id/complete')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  completePTM(
    @Param('id') bookingId: string,
    @Body() dto: CompletePTMDto,
  ) {
    return this.communicationService.completePTM(bookingId, dto);
  }

  @Get('ptm/bookings')
  getPTMBookings(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.communicationService.getPTMBookings({ parentId: userId, status, teacherId });
  }

  // ─── Messaging ────────────────────────────────────────────────────

  @Post('conversations')
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.communicationService.createConversation(dto, userId);
  }

  @Get('conversations')
  getConversations(
    @CurrentUser('sub') userId: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.communicationService.getConversations(userId, schoolId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communicationService.getMessages(
      conversationId,
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('messages')
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.communicationService.sendMessage(dto, userId);
  }

  @Patch('messages/:id/read')
  markMessageRead(@Param('id') messageId: string) {
    return this.communicationService.markMessageRead(messageId);
  }
}

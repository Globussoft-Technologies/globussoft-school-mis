import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePTMSlotDto,
  BookPTMSlotDto,
  CompletePTMDto,
  SendMessageDto,
  CreateConversationDto,
} from './dto/communication.dto';

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  // ─── PTM ─────────────────────────────────────────────────────────

  async createPTMSlot(dto: CreatePTMSlotDto, teacherId: string) {
    return this.prisma.pTMSlot.create({
      data: {
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        teacherId,
        classId: dto.classId,
        maxBookings: dto.maxBookings,
        academicSessionId: dto.academicSessionId,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true } },
      },
    });
  }

  async getPTMSlots(filters: {
    teacherId?: string;
    classId?: string;
    academicSessionId?: string;
    date?: string;
  }) {
    return this.prisma.pTMSlot.findMany({
      where: {
        ...(filters.teacherId && { teacherId: filters.teacherId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.academicSessionId && { academicSessionId: filters.academicSessionId }),
        ...(filters.date && { date: new Date(filters.date) }),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async bookPTMSlot(dto: BookPTMSlotDto, parentId: string) {
    const slot = await this.prisma.pTMSlot.findUnique({ where: { id: dto.slotId } });
    if (!slot) throw new NotFoundException('PTM slot not found');
    if (slot.bookedCount >= slot.maxBookings) {
      throw new BadRequestException('PTM slot is fully booked');
    }

    const existingBooking = await this.prisma.pTMBooking.findFirst({
      where: { slotId: dto.slotId, parentId, status: 'BOOKED' },
    });
    if (existingBooking) throw new BadRequestException('You have already booked this slot');

    const [booking] = await this.prisma.$transaction([
      this.prisma.pTMBooking.create({
        data: {
          slotId: dto.slotId,
          parentId,
          studentId: dto.studentId,
          status: 'BOOKED',
        },
      }),
      this.prisma.pTMSlot.update({
        where: { id: dto.slotId },
        data: { bookedCount: { increment: 1 } },
      }),
    ]);

    return booking;
  }

  async cancelPTMBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.pTMBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('PTM booking not found');
    if (booking.parentId !== userId) throw new BadRequestException('Unauthorized to cancel this booking');
    if (booking.status !== 'BOOKED') throw new BadRequestException('Only BOOKED appointments can be cancelled');

    const [updated] = await this.prisma.$transaction([
      this.prisma.pTMBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.pTMSlot.update({
        where: { id: booking.slotId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ]);

    return updated;
  }

  async completePTM(bookingId: string, dto: CompletePTMDto) {
    const booking = await this.prisma.pTMBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('PTM booking not found');
    if (booking.status !== 'BOOKED') throw new BadRequestException('Only BOOKED appointments can be completed');

    return this.prisma.pTMBooking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        meetingNotes: dto.meetingNotes,
        actionItems: dto.actionItems ?? [],
      },
    });
  }

  async getPTMBookings(filters: { parentId?: string; teacherId?: string; status?: string }) {
    return this.prisma.pTMBooking.findMany({
      where: {
        ...(filters.parentId && { parentId: filters.parentId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.teacherId && { slot: { teacherId: filters.teacherId } }),
      },
      include: {
        slot: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
            class: { select: { id: true, name: true } },
          },
        },
        parent: { select: { id: true, firstName: true, lastName: true } },
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Messaging ────────────────────────────────────────────────────

  async createConversation(dto: CreateConversationDto, creatorId: string) {
    const participantIds = Array.from(new Set([...dto.participantIds, creatorId]));

    const conversation = await this.prisma.conversation.create({
      data: {
        participantIds,
        type: dto.type,
        schoolId: dto.schoolId,
        lastMessageAt: new Date(),
      },
    });

    if (dto.initialMessage) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: creatorId,
          content: dto.initialMessage,
        },
      });
    }

    return conversation;
  }

  async sendMessage(dto: SendMessageDto, senderId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!(conversation.participantIds as string[])?.includes(senderId)) {
      throw new BadRequestException('You are not a participant in this conversation');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: dto.conversationId,
          senderId,
          content: dto.content,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: dto.conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  async getConversations(userId: string, schoolId?: string) {
    return this.prisma.conversation.findMany({
      where: {
        participantIds: { path: '$', array_contains: userId },
        ...(schoolId && { schoolId }),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!(conversation.participantIds as string[])?.includes(userId)) {
      throw new BadRequestException('You are not a participant in this conversation');
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  }

  async markMessageRead(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}

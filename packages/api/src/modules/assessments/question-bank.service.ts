import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  async createBank(subjectId: string, name: string) {
    return this.prisma.questionBank.create({
      data: { subjectId, name },
      include: { subject: { select: { name: true } } },
    });
  }

  async getBanks(subjectId?: string) {
    return this.prisma.questionBank.findMany({
      where: subjectId ? { subjectId } : undefined,
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  async addQuestion(dto: CreateQuestionDto) {
    return this.prisma.question.create({ data: dto });
  }

  async getQuestions(bankId: string, filters?: { type?: string; difficultyLevel?: string }) {
    return this.prisma.question.findMany({
      where: {
        bankId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.difficultyLevel && { difficultyLevel: filters.difficultyLevel }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateQuestion(id: string, data: Partial<CreateQuestionDto>) {
    return this.prisma.question.update({ where: { id }, data });
  }

  async deleteQuestion(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }
}

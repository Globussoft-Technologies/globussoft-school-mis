import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}

  async createSurvey(data: {
    title: string;
    description?: string;
    type: string;
    startDate?: string;
    endDate?: string;
    targetAudience?: string;
    createdBy: string;
    schoolId: string;
    questions?: Array<{
      text: string;
      type: string;
      options?: any;
      orderIndex: number;
      isRequired?: boolean;
    }>;
  }) {
    const { questions, startDate, endDate, ...rest } = data;

    const survey = await this.prisma.survey.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        questions: questions && questions.length > 0
          ? { create: questions.map((q) => ({ ...q })) }
          : undefined,
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    return survey;
  }

  async findAll(filters: { type?: string; status?: string; schoolId?: string }) {
    const { type, status, schoolId } = filters;
    return this.prisma.survey.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(schoolId ? { schoolId } : {}),
      },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundException('Survey not found');
    return survey;
  }

  async activate(id: string) {
    const survey = await this.findById(id);
    if (survey.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT surveys can be activated');
    }
    return this.prisma.survey.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async close(id: string) {
    await this.findById(id);
    return this.prisma.survey.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  async submitResponse(data: {
    surveyId: string;
    respondentId: string;
    answers: Array<{ questionId: string; answer: any }>;
  }) {
    const survey = await this.findById(data.surveyId);
    if (survey.status !== 'ACTIVE') {
      throw new BadRequestException('Survey is not active');
    }

    // Check for duplicate response
    const existing = await this.prisma.surveyResponse.findUnique({
      where: {
        surveyId_respondentId: {
          surveyId: data.surveyId,
          respondentId: data.respondentId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('You have already responded to this survey');
    }

    return this.prisma.surveyResponse.create({
      data: {
        surveyId: data.surveyId,
        respondentId: data.respondentId,
        answers: data.answers,
      },
    });
  }

  async getSurveyResults(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        responses: true,
      },
    });
    if (!survey) throw new NotFoundException('Survey not found');

    const responseCount = survey.responses.length;

    const questionResults = survey.questions.map((q) => {
      const answers: any[] = [];

      for (const response of survey.responses) {
        const answerList = response.answers as Array<{ questionId: string; answer: any }>;
        const found = answerList.find((a) => a.questionId === q.id);
        if (found) answers.push(found.answer);
      }

      if (q.type === 'RATING') {
        const nums = answers.map(Number).filter((n) => !isNaN(n));
        const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        // Distribution: count each rating value 1-5
        const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        nums.forEach((n) => {
          const key = String(Math.round(n));
          if (distribution[key] !== undefined) distribution[key]++;
        });
        return {
          questionId: q.id,
          questionText: q.text,
          type: q.type,
          avgRating: Math.round(avg * 100) / 100,
          responseCount: nums.length,
          distribution,
        };
      }

      if (q.type === 'MULTIPLE_CHOICE') {
        const distribution: Record<string, number> = {};
        answers.forEach((a) => {
          const key = String(a);
          distribution[key] = (distribution[key] || 0) + 1;
        });
        return {
          questionId: q.id,
          questionText: q.text,
          type: q.type,
          responseCount: answers.length,
          distribution,
        };
      }

      if (q.type === 'YES_NO') {
        const distribution = { YES: 0, NO: 0 };
        answers.forEach((a) => {
          const val = String(a).toUpperCase();
          if (val === 'YES') distribution.YES++;
          else if (val === 'NO') distribution.NO++;
        });
        return {
          questionId: q.id,
          questionText: q.text,
          type: q.type,
          responseCount: answers.length,
          distribution,
        };
      }

      // TEXT
      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        responseCount: answers.length,
        textAnswers: answers.map(String),
      };
    });

    return {
      surveyId: id,
      title: survey.title,
      status: survey.status,
      totalResponses: responseCount,
      questions: questionResults,
    };
  }
}

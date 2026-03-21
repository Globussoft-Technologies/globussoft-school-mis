import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAssessmentDto, createdBy: string) {
    const { questionIds, ...data } = dto;
    const assessment = await this.prisma.assessment.create({
      data: { ...data, createdBy },
    });

    if (questionIds?.length) {
      await this.prisma.assessmentQuestion.createMany({
        data: questionIds.map((qId, i) => ({
          assessmentId: assessment.id,
          questionId: qId,
          orderIndex: i + 1,
          marks: dto.totalMarks / questionIds.length,
        })),
      });
    }

    return this.findById(assessment.id);
  }

  async findAll(filters: { classId?: string; subjectId?: string; type?: string; academicSessionId?: string }) {
    return this.prisma.assessment.findMany({
      where: {
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.academicSessionId && { academicSessionId: filters.academicSessionId }),
      },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        creator: { select: { firstName: true, lastName: true } },
        _count: { select: { submissions: true, questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        subject: true,
        class: true,
        creator: { select: { firstName: true, lastName: true } },
        questions: {
          include: { question: true },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async publish(id: string) {
    return this.prisma.assessment.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async submit(dto: SubmitAssessmentDto, studentId: string, submittedBy: string) {
    return this.prisma.assessmentSubmission.create({
      data: {
        assessmentId: dto.assessmentId,
        studentId,
        submittedBy,
        answers: dto.answers,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async getSubmissions(assessmentId: string) {
    return this.prisma.assessmentSubmission.findMany({
      where: { assessmentId },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async gradeSubmission(submissionId: string, totalMarks: number, feedback: string) {
    return this.prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: { totalMarks, feedback, status: 'GRADED', gradedAt: new Date() },
    });
  }
}

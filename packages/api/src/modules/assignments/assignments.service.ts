import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAssignmentDto, teacherId: string) {
    const assignment = await this.prisma.assignment.create({
      data: {
        title: dto.title,
        instructions: dto.instructions,
        type: dto.type,
        subjectId: dto.subjectId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        teacherId,
        dueDate: new Date(dto.dueDate),
        totalMarks: dto.totalMarks,
        allowLate: dto.allowLate ?? false,
        latePenalty: dto.latePenalty,
        attachmentUrl: dto.attachmentUrl,
        academicSessionId: dto.academicSessionId,
      },
    });
    return this.findById(assignment.id);
  }

  async findAll(filters: {
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    academicSessionId?: string;
    isPublished?: string;
  }) {
    return this.prisma.assignment.findMany({
      where: {
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.teacherId && { teacherId: filters.teacherId }),
        ...(filters.academicSessionId && { academicSessionId: filters.academicSessionId }),
        ...(filters.isPublished !== undefined && {
          isPublished: filters.isPublished === 'true',
        }),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findById(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { submissions: true } },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async update(id: string, dto: Partial<CreateAssignmentDto>) {
    await this.findById(id);
    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.classId !== undefined && { classId: dto.classId }),
        ...(dto.sectionId !== undefined && { sectionId: dto.sectionId }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.totalMarks !== undefined && { totalMarks: dto.totalMarks }),
        ...(dto.allowLate !== undefined && { allowLate: dto.allowLate }),
        ...(dto.latePenalty !== undefined && { latePenalty: dto.latePenalty }),
        ...(dto.attachmentUrl !== undefined && { attachmentUrl: dto.attachmentUrl }),
      },
    });
  }

  async publish(id: string) {
    await this.findById(id);
    return this.prisma.assignment.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async submit(assignmentId: string, dto: SubmitAssignmentDto, submittingUserId: string) {
    const assignment = await this.findById(assignmentId);
    const isLate = new Date() > assignment.dueDate;

    // Check if already submitted
    const existing = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: dto.studentId,
        },
      },
    });

    if (existing) {
      // Allow resubmission if status is RESUBMIT
      return this.prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          content: dto.content,
          fileUrl: dto.fileUrl,
          submittedAt: new Date(),
          isLate,
          status: 'SUBMITTED',
        },
      });
    }

    return this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: dto.studentId,
        content: dto.content,
        fileUrl: dto.fileUrl,
        isLate,
        status: 'SUBMITTED',
      },
    });
  }

  async getSubmissions(assignmentId: string) {
    await this.findById(assignmentId);
    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async gradeSubmission(
    submissionId: string,
    marksAwarded: number,
    feedback: string,
    gradedBy: string,
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksAwarded,
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedBy,
      },
    });
  }
}

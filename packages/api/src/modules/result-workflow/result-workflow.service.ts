import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResultWorkflowService {
  constructor(private prisma: PrismaService) {}

  async submit(
    classId: string,
    subjectId: string,
    sessionId: string,
    term: string,
    submittedBy: string,
    assessmentId?: string,
  ) {
    return this.prisma.resultPublication.upsert({
      where: {
        classId_subjectId_academicSessionId_term: {
          classId,
          subjectId,
          academicSessionId: sessionId,
          term,
        },
      },
      update: {
        status: 'SUBMITTED',
        submittedBy,
        submittedAt: new Date(),
        rejectionReason: null,
        reviewRemarks: null,
        reviewedBy: null,
        reviewedAt: null,
        approvedBy: null,
        approvedAt: null,
        publishedAt: null,
      },
      create: {
        classId,
        subjectId,
        academicSessionId: sessionId,
        term,
        assessmentId,
        status: 'SUBMITTED',
        submittedBy,
        submittedAt: new Date(),
      },
    });
  }

  async review(
    id: string,
    reviewedBy: string,
    status: 'UNDER_REVIEW' | 'REJECTED',
    remarks?: string,
  ) {
    const record = await this.prisma.resultPublication.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`ResultPublication ${id} not found`);
    if (record.status !== 'SUBMITTED' && record.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(`Cannot review a record in status ${record.status}`);
    }
    return this.prisma.resultPublication.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewRemarks: remarks,
        ...(status === 'REJECTED' && { rejectionReason: remarks }),
      },
    });
  }

  async approve(id: string, approvedBy: string) {
    const record = await this.prisma.resultPublication.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`ResultPublication ${id} not found`);
    if (record.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(`Cannot approve a record in status ${record.status}`);
    }
    return this.prisma.resultPublication.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async publish(id: string) {
    const record = await this.prisma.resultPublication.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`ResultPublication ${id} not found`);
    if (record.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot publish a record in status ${record.status}`);
    }
    return this.prisma.resultPublication.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  async reject(id: string, rejectionReason: string, rejectedBy: string) {
    const record = await this.prisma.resultPublication.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`ResultPublication ${id} not found`);
    return this.prisma.resultPublication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedBy: rejectedBy,
        reviewedAt: new Date(),
      },
    });
  }

  async getAll(filters: { classId?: string; status?: string; term?: string }) {
    return this.prisma.resultPublication.findMany({
      where: {
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.term && { term: filters.term }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getWorkflowStatus(classId: string, subjectId: string, term: string) {
    const record = await this.prisma.resultPublication.findFirst({
      where: { classId, subjectId, term },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { status: 'DRAFT', timeline: [] };
    }

    const STAGES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'];
    const timeline = [
      { stage: 'DRAFT', label: 'Draft', completedAt: record.createdAt },
      { stage: 'SUBMITTED', label: 'Submitted', completedAt: record.submittedAt, by: record.submittedBy },
      { stage: 'UNDER_REVIEW', label: 'Under Review', completedAt: record.reviewedAt, by: record.reviewedBy, remarks: record.reviewRemarks },
      { stage: 'APPROVED', label: 'Approved', completedAt: record.approvedAt, by: record.approvedBy },
      { stage: 'PUBLISHED', label: 'Published', completedAt: record.publishedAt },
    ].map((t) => ({
      ...t,
      active: record.status === t.stage,
      completed: STAGES.indexOf(record.status) > STAGES.indexOf(t.stage),
    }));

    return { ...record, timeline };
  }
}

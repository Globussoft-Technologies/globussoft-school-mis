import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * For all students in a class, compute overall percentage from their grades
   * and create Promotion records with PENDING status.
   */
  async generatePromotions(classId: string, academicSessionId: string) {
    // Fetch all students in the class for this session
    const students = await this.prisma.student.findMany({
      where: { classId, academicSessionId, isActive: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
        section: { select: { id: true, name: true } },
        grades: {
          include: {
            assessment: { select: { totalMarks: true } },
          },
        },
      },
    });

    if (students.length === 0) {
      throw new BadRequestException('No active students found in this class for the given session');
    }

    const created: any[] = [];
    const skipped: string[] = [];

    for (const student of students) {
      // Check if promotion record already exists
      const existing = await this.prisma.promotion.findUnique({
        where: { studentId_academicSessionId: { studentId: student.id, academicSessionId } },
      });
      if (existing) {
        skipped.push(student.id);
        continue;
      }

      // Calculate overall percentage from grades
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      for (const grade of student.grades) {
        if (grade.marksObtained != null && grade.assessment?.totalMarks) {
          totalMarksObtained += grade.marksObtained;
          totalMaxMarks += grade.assessment.totalMarks;
        }
      }
      const overallPercentage =
        totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : null;

      const promotion = await this.prisma.promotion.create({
        data: {
          studentId: student.id,
          fromClassId: classId,
          fromSectionId: student.sectionId,
          toClassId: classId, // Will be updated when processed
          toSectionId: student.sectionId,
          academicSessionId,
          status: 'PENDING',
          overallPercentage: overallPercentage !== null ? Math.round(overallPercentage * 100) / 100 : null,
        },
      });
      created.push(promotion);
    }

    return {
      message: `Generated ${created.length} promotion records. Skipped ${skipped.length} (already exist).`,
      created: created.length,
      skipped: skipped.length,
    };
  }

  /**
   * Process (approve/retain) a single promotion record.
   */
  async processPromotion(
    promotionId: string,
    status: string,
    toClassId?: string,
    toSectionId?: string,
    remarks?: string,
    processedBy?: string,
  ) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id: promotionId } });
    if (!promotion) throw new NotFoundException('Promotion record not found');

    const allowedStatuses = ['PROMOTED', 'RETAINED', 'DETAINED'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(`Status must be one of: ${allowedStatuses.join(', ')}`);
    }

    return this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        status,
        toClassId: toClassId ?? promotion.toClassId,
        toSectionId: toSectionId ?? promotion.toSectionId,
        remarks,
        processedBy,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Bulk auto-promote all PENDING students with overallPercentage >= 33%.
   * Students below 33% are marked RETAINED.
   */
  async bulkProcess(classId: string, academicSessionId: string, processedBy?: string) {
    const pending = await this.prisma.promotion.findMany({
      where: { fromClassId: classId, academicSessionId, status: 'PENDING' },
    });

    if (pending.length === 0) {
      return { message: 'No pending promotions found', promoted: 0, retained: 0 };
    }

    // Find the next class (grade + 1) for promotions
    const currentClass = await this.prisma.class.findUnique({ where: { id: classId } });
    const nextClass = currentClass
      ? await this.prisma.class.findFirst({
          where: { grade: currentClass.grade + 1, schoolId: currentClass.schoolId },
        })
      : null;

    let promoted = 0;
    let retained = 0;

    for (const p of pending) {
      const passPercentage = 33;
      const isEligible = p.overallPercentage != null && p.overallPercentage >= passPercentage;

      await this.prisma.promotion.update({
        where: { id: p.id },
        data: {
          status: isEligible ? 'PROMOTED' : 'RETAINED',
          toClassId: isEligible && nextClass ? nextClass.id : p.fromClassId,
          processedBy,
          processedAt: new Date(),
          remarks: isEligible
            ? 'Auto-promoted based on results'
            : 'Auto-retained: percentage below 33%',
        },
      });

      if (isEligible) promoted++;
      else retained++;
    }

    return { message: 'Bulk processing complete', promoted, retained };
  }

  /**
   * List promotions with optional filters.
   */
  async getPromotions(classId?: string, academicSessionId?: string, status?: string) {
    return this.prisma.promotion.findMany({
      where: {
        ...(classId ? { fromClassId: classId } : {}),
        ...(academicSessionId ? { academicSessionId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

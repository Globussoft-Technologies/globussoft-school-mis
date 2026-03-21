import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AcademicTransitionService {
  constructor(private prisma: PrismaService) {}

  async createNewSession(name: string, startDate: string, endDate: string, schoolId: string) {
    return this.prisma.academicSession.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'UPCOMING',
        schoolId,
      },
    });
  }

  async initiateTransition(
    fromSessionId: string,
    toSessionId: string,
    startedBy: string,
    schoolId: string,
  ) {
    // Validate sessions exist
    const fromSession = await this.prisma.academicSession.findUnique({ where: { id: fromSessionId } });
    if (!fromSession) throw new NotFoundException('Source academic session not found');

    const toSession = await this.prisma.academicSession.findUnique({ where: { id: toSessionId } });
    if (!toSession) throw new NotFoundException('Target academic session not found');

    // Check for duplicate
    const existing = await this.prisma.academicTransition.findUnique({
      where: { fromSessionId_toSessionId: { fromSessionId, toSessionId } },
    });
    if (existing) {
      throw new BadRequestException(
        `A transition from "${fromSession.name}" to "${toSession.name}" already exists (status: ${existing.status})`,
      );
    }

    return this.prisma.academicTransition.create({
      data: {
        fromSessionId,
        toSessionId,
        startedBy,
        schoolId,
        status: 'IN_PROGRESS',
      },
    });
  }

  async executeTransition(transitionId: string) {
    const transition = await this.prisma.academicTransition.findUnique({
      where: { id: transitionId },
    });
    if (!transition) throw new NotFoundException('Transition record not found');

    if (transition.status === 'COMPLETED') {
      throw new BadRequestException('This transition has already been completed');
    }

    const errors: Array<{ studentId: string; error: string }> = [];
    let studentsPromoted = 0;
    let studentsRetained = 0;
    let sectionsCreated = 0;

    // Get all active students in the fromSession school
    const students = await this.prisma.student.findMany({
      where: {
        academicSessionId: transition.fromSessionId,
        isActive: true,
      },
      include: {
        class: { select: { id: true, grade: true, schoolId: true } },
        section: { select: { id: true, name: true } },
      },
    });

    // Preload all classes and sections for the school
    const allClasses = await this.prisma.class.findMany({
      where: { schoolId: transition.schoolId },
      include: { sections: true },
      orderBy: { grade: 'asc' },
    });

    const classMap = new Map(allClasses.map((c) => [c.grade, c]));

    // Cache for created/found sections to avoid duplicate DB calls
    const sectionCache = new Map<string, string>(); // `${classId}_${sectionName}` -> sectionId

    // Pre-populate cache with existing sections
    for (const cls of allClasses) {
      for (const sec of cls.sections) {
        sectionCache.set(`${cls.id}_${sec.name}`, sec.id);
      }
    }

    for (const student of students) {
      try {
        const currentGrade = student.class.grade;
        const nextGrade = currentGrade + 1;

        // Check if student has a promotion record
        const promotion = await this.prisma.promotion.findUnique({
          where: { studentId_academicSessionId: { studentId: student.id, academicSessionId: transition.fromSessionId } },
        });

        const isPromoted = !promotion || promotion.status === 'PROMOTED';

        if (isPromoted && nextGrade <= 12) {
          // Move to next class
          const nextClass = classMap.get(nextGrade);
          if (!nextClass) {
            errors.push({ studentId: student.id, error: `No class found for grade ${nextGrade}` });
            continue;
          }

          // Find or create equivalent section in next class
          const sectionName = student.section.name;
          const cacheKey = `${nextClass.id}_${sectionName}`;
          let nextSectionId = sectionCache.get(cacheKey);

          if (!nextSectionId) {
            // Create section
            const newSection = await this.prisma.section.create({
              data: { name: sectionName, classId: nextClass.id, capacity: 40 },
            });
            nextSectionId = newSection.id;
            sectionCache.set(cacheKey, nextSectionId);
            sectionsCreated++;
          }

          await this.prisma.student.update({
            where: { id: student.id },
            data: {
              classId: nextClass.id,
              sectionId: nextSectionId,
              academicSessionId: transition.toSessionId,
            },
          });
          studentsPromoted++;
        } else {
          // Retain in same class — update only session
          await this.prisma.student.update({
            where: { id: student.id },
            data: { academicSessionId: transition.toSessionId },
          });
          studentsRetained++;
        }
      } catch (err: any) {
        errors.push({ studentId: student.id, error: err?.message ?? 'Unknown error' });
      }
    }

    // Update transition record
    const updated = await this.prisma.academicTransition.update({
      where: { id: transitionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        studentsPromoted,
        studentsRetained,
        sectionsCreated,
        errors,
      },
    });

    // Activate the new session
    await this.prisma.academicSession.update({
      where: { id: transition.toSessionId },
      data: { status: 'ACTIVE' },
    });

    // Mark old session as completed
    await this.prisma.academicSession.update({
      where: { id: transition.fromSessionId },
      data: { status: 'COMPLETED' },
    });

    return {
      ...updated,
      summary: {
        studentsPromoted,
        studentsRetained,
        sectionsCreated,
        errorCount: errors.length,
        errors,
      },
    };
  }

  async getTransitions(schoolId: string) {
    return this.prisma.academicTransition.findMany({
      where: { schoolId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getTransitionStatus(id: string) {
    const transition = await this.prisma.academicTransition.findUnique({ where: { id } });
    if (!transition) throw new NotFoundException('Transition not found');

    const fromSession = await this.prisma.academicSession.findUnique({
      where: { id: transition.fromSessionId },
      select: { name: true, status: true },
    });
    const toSession = await this.prisma.academicSession.findUnique({
      where: { id: transition.toSessionId },
      select: { name: true, status: true },
    });

    return {
      ...transition,
      fromSession,
      toSession,
    };
  }
}

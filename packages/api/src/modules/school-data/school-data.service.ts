import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchoolDataService {
  constructor(private prisma: PrismaService) {}

  // ─── Classes ────────────────────────────────────────────────────

  async createClass(name: string, grade: number, schoolId: string) {
    const existing = await this.prisma.class.findUnique({
      where: { grade_schoolId: { grade, schoolId } },
    });
    if (existing) {
      throw new ConflictException(`A class with grade ${grade} already exists for this school`);
    }
    return this.prisma.class.create({
      data: { name, grade, schoolId },
    });
  }

  async updateClass(id: string, name?: string, grade?: number) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException('Class not found');
    return this.prisma.class.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(grade !== undefined ? { grade } : {}),
      },
    });
  }

  async deleteClass(id: string) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException('Class not found');

    const studentCount = await this.prisma.student.count({ where: { classId: id } });
    if (studentCount > 0) {
      throw new BadRequestException(`Cannot delete class: ${studentCount} student(s) are currently enrolled in this class`);
    }

    await this.prisma.class.delete({ where: { id } });
    return { message: 'Class deleted successfully' };
  }

  async getClassesWithStats(schoolId: string) {
    const classes = await this.prisma.class.findMany({
      where: { schoolId },
      orderBy: { grade: 'asc' },
      include: {
        sections: {
          include: {
            _count: { select: { students: true } },
          },
        },
        subjects: {
          select: { id: true, name: true, code: true, isElective: true },
        },
        _count: { select: { students: true } },
      },
    });

    return classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      sectionCount: cls.sections.length,
      studentCount: cls._count.students,
      sections: cls.sections.map((s) => ({
        id: s.id,
        name: s.name,
        capacity: s.capacity,
        studentCount: s._count.students,
      })),
      subjects: cls.subjects,
    }));
  }

  // ─── Sections ───────────────────────────────────────────────────

  async createSection(name: string, classId: string, capacity?: number) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Class not found');

    const existing = await this.prisma.section.findUnique({
      where: { name_classId: { name, classId } },
    });
    if (existing) throw new ConflictException(`Section "${name}" already exists in this class`);

    return this.prisma.section.create({
      data: { name, classId, capacity: capacity ?? 40 },
    });
  }

  async updateSection(id: string, name?: string, capacity?: number) {
    const section = await this.prisma.section.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('Section not found');

    return this.prisma.section.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
      },
    });
  }

  async deleteSection(id: string) {
    const section = await this.prisma.section.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('Section not found');

    const studentCount = await this.prisma.student.count({ where: { sectionId: id } });
    if (studentCount > 0) {
      throw new BadRequestException(`Cannot delete section: ${studentCount} student(s) are enrolled in this section`);
    }

    await this.prisma.section.delete({ where: { id } });
    return { message: 'Section deleted successfully' };
  }

  // ─── Subjects ───────────────────────────────────────────────────

  async createSubject(name: string, code: string, classId: string, isElective?: boolean, description?: string) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Class not found');

    const existing = await this.prisma.subject.findUnique({
      where: { code_classId: { code, classId } },
    });
    if (existing) throw new ConflictException(`Subject with code "${code}" already exists in this class`);

    return this.prisma.subject.create({
      data: { name, code, classId, isElective: isElective ?? false, description },
    });
  }

  async updateSubject(id: string, name?: string, code?: string, isElective?: boolean, description?: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(isElective !== undefined ? { isElective } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
  }

  async deleteSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    // Check if subject has grades (students)
    const gradeCount = await this.prisma.grade.count({ where: { subjectId: id } });
    if (gradeCount > 0) {
      throw new BadRequestException(`Cannot delete subject: it has ${gradeCount} grade record(s) associated`);
    }

    await this.prisma.subject.delete({ where: { id } });
    return { message: 'Subject deleted successfully' };
  }
}

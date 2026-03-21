import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportCardService {
  constructor(private prisma: PrismaService) {}

  async generate(studentId: string, classId: string, academicSessionId: string, term: string) {
    // Get all grades for this student in this session
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        subject: { classId },
      },
      include: { subject: { select: { name: true } } },
    });

    // Aggregate by subject
    const subjectMap = new Map<string, { obtained: number; max: number }>();
    for (const g of grades) {
      const existing = subjectMap.get(g.subject.name) || { obtained: 0, max: 0 };
      existing.obtained += g.marksObtained;
      existing.max += g.maxMarks;
      subjectMap.set(g.subject.name, existing);
    }

    const subjectResults = Array.from(subjectMap.entries()).map(([name, data]) => ({
      subjectName: name,
      maxMarks: data.max,
      obtained: data.obtained,
      grade: this.calculateGrade((data.obtained / data.max) * 100),
    }));

    const totalObtained = subjectResults.reduce((s, r) => s + r.obtained, 0);
    const totalMax = subjectResults.reduce((s, r) => s + r.maxMarks, 0);
    const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;

    const reportCard = await this.prisma.reportCard.upsert({
      where: {
        studentId_academicSessionId_term: { studentId, academicSessionId, term },
      },
      update: {
        overallPercentage,
        overallGrade: this.calculateGrade(overallPercentage),
        status: 'GENERATED',
      },
      create: {
        studentId,
        classId,
        academicSessionId,
        term,
        overallPercentage,
        overallGrade: this.calculateGrade(overallPercentage),
        status: 'GENERATED',
      },
    });

    // Delete old results and create new
    await this.prisma.subjectResult.deleteMany({ where: { reportCardId: reportCard.id } });
    await this.prisma.subjectResult.createMany({
      data: subjectResults.map((r) => ({
        reportCardId: reportCard.id,
        ...r,
      })),
    });

    return this.findById(reportCard.id);
  }

  async findById(id: string) {
    const card = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        class: { select: { name: true } },
        subjectResults: true,
      },
    });
    if (!card) throw new NotFoundException('Report card not found');
    return card;
  }

  async findByStudent(studentId: string) {
    return this.prisma.reportCard.findMany({
      where: { studentId },
      include: {
        class: { select: { name: true } },
        subjectResults: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClass(classId: string, academicSessionId: string, term: string) {
    return this.prisma.reportCard.findMany({
      where: { classId, academicSessionId, term },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        subjectResults: true,
      },
      orderBy: { overallPercentage: 'desc' },
    });
  }

  async publish(id: string, issuedBy: string) {
    return this.prisma.reportCard.update({
      where: { id },
      data: { status: 'PUBLISHED', issuedBy, issuedAt: new Date() },
    });
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E';
  }
}

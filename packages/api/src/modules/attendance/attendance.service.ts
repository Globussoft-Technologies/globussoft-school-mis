import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markBulk(dto: BulkAttendanceDto, markedById: string) {
    const operations = dto.records.map((record) =>
      this.prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date: new Date(dto.date),
          },
        },
        update: {
          status: record.status,
          markedById,
          remarks: record.remarks,
        },
        create: {
          studentId: record.studentId,
          date: new Date(dto.date),
          status: record.status,
          markedById,
          remarks: record.remarks,
        },
      }),
    );

    return this.prisma.$transaction(operations);
  }

  async getByClassAndDate(classId: string, sectionId: string, date: string) {
    return this.prisma.attendance.findMany({
      where: {
        date: new Date(date),
        student: { classId, sectionId },
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async getStudentSummary(studentId: string, startDate: string, endDate: string) {
    const records = await this.prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
    });

    const summary = {
      studentId,
      totalDays: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
      percentage: 0,
    };

    if (summary.totalDays > 0) {
      summary.percentage = Math.round(
        ((summary.present + summary.late + summary.halfDay * 0.5) / summary.totalDays) * 100,
      );
    }

    return summary;
  }
}

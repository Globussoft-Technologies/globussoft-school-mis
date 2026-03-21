import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(schoolId: string) {
    const [
      totalStudents, totalTeachers, totalClasses, todayAttendance,
      totalEnquiries, totalSubjects, totalLmsContent, totalAssessments,
      totalQuestions, totalFeeHeads, totalPayments, totalDefaulters,
      totalIncidents, activeRedFlags, totalVehicles, totalRoutes,
      totalHobbies, totalHobbyEnrollments, totalPtmSlots, pendingNotifications,
      // LMS Deep
      totalCourseModules, totalDiscussionForums, totalBadges, totalLearningPaths,
      totalRubrics, totalLiveClasses, totalAssignments, totalLibraryBooks,
    ] = await Promise.all([
      this.prisma.student.count({ where: { isActive: true, user: { schoolId } } }),
      this.prisma.user.count({
        where: { schoolId, isActive: true, role: { in: ['CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR'] } },
      }),
      this.prisma.class.count({ where: { schoolId } }),
      this.prisma.attendance.count({
        where: { date: new Date(new Date().toISOString().split('T')[0]), status: 'PRESENT' },
      }),
      this.prisma.admissionEnquiry.count(),
      this.prisma.subject.count(),
      this.prisma.lmsContent.count(),
      this.prisma.assessment.count(),
      this.prisma.question.count(),
      this.prisma.feeHead.count(),
      this.prisma.payment.count({ where: { status: 'PAID' } }),
      this.prisma.defaulterRecord.count({ where: { status: 'ACTIVE' } }),
      this.prisma.incident.count(),
      this.prisma.redFlag.count({ where: { status: 'ACTIVE' } }),
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.route.count({ where: { isActive: true } }),
      this.prisma.hobby.count({ where: { isActive: true } }),
      this.prisma.hobbyEnrollment.count({ where: { status: 'ENROLLED' } }),
      this.prisma.pTMSlot.count(),
      this.prisma.notification.count({ where: { status: 'PENDING' } }),
      // LMS Deep
      this.prisma.courseModule.count(),
      this.prisma.discussionForum.count(),
      this.prisma.badge.count(),
      this.prisma.learningPath.count(),
      this.prisma.rubric.count(),
      this.prisma.liveClass.count(),
      this.prisma.assignment.count(),
      this.prisma.libraryBook.count(),
    ]);

    return {
      totalStudents, totalTeachers, totalClasses, todayAttendance,
      totalEnquiries, totalSubjects,
      totalLmsContent, totalAssessments, totalQuestions,
      totalFeeHeads, totalPayments, totalDefaulters,
      totalIncidents, activeRedFlags, totalVehicles, totalRoutes,
      totalHobbies, totalHobbyEnrollments, totalPtmSlots, pendingNotifications,
      // LMS Deep
      totalCourseModules, totalDiscussionForums, totalBadges, totalLearningPaths,
      totalRubrics, totalLiveClasses, totalAssignments, totalLibraryBooks,
    };
  }
}

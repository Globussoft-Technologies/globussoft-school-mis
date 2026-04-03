import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ─── Admin Stats ─────────────────────────────────────────────────

  async getAdminStats(schoolId: string) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Attendance trend: last 7 days
    const attendanceTrend: { date: string; percentage: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dateObj = new Date(dateStr);

      const [totalMarked, presentCount] = await Promise.all([
        this.prisma.attendance.count({ where: { date: dateObj } }),
        this.prisma.attendance.count({ where: { date: dateObj, status: { in: ['PRESENT', 'LATE'] } } }),
      ]);

      attendanceTrend.push({
        date: dateStr,
        percentage: totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0,
      });
    }

    // Fee summary this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [paymentsThisMonth, totalDefaulters] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          status: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        select: { paidAmount: true },
      }),
      this.prisma.defaulterRecord.count({ where: { status: 'ACTIVE' } }),
    ]);

    const collectedAmount = paymentsThisMonth.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    // Pending amount from active defaulters
    const defaulterRecords = await this.prisma.defaulterRecord.findMany({
      where: { status: 'ACTIVE' },
      select: { amountDue: true },
    });
    const pendingAmount = defaulterRecords.reduce((sum, d) => sum + (d.amountDue || 0), 0);

    // Recent alerts: last 5 incidents + grievances
    const [recentIncidents, recentGrievances] = await Promise.all([
      this.prisma.incident.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          severity: true,
          description: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.grievance.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          category: true,
          subject: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const alerts = [
      ...recentIncidents.map((i) => ({
        id: i.id,
        type: 'INCIDENT' as const,
        title: `${i.type} — ${i.description.substring(0, 60)}`,
        severity: i.severity,
        status: i.status,
        createdAt: i.createdAt,
      })),
      ...recentGrievances.map((g) => ({
        id: g.id,
        type: 'GRIEVANCE' as const,
        title: `${g.category} — ${g.subject}`,
        severity: g.priority,
        status: g.status,
        createdAt: g.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Quick stats
    const [
      totalSections,
      totalSubjects,
      totalLibraryBooks,
      totalHobbies,
      upcomingEvents,
    ] = await Promise.all([
      this.prisma.section.count(),
      this.prisma.subject.count(),
      this.prisma.libraryBook.count(),
      this.prisma.hobby.count({ where: { isActive: true } }),
      this.prisma.schoolEvent.count({
        where: { startDate: { gte: today }, status: { in: ['PLANNED', 'APPROVED'] } },
      }),
    ]);

    // Teacher compliance: lesson plans delivered vs total
    const [totalLessonPlans, deliveredLessonPlans] = await Promise.all([
      this.prisma.lessonPlan.count(),
      this.prisma.lessonPlan.count({ where: { status: 'DELIVERED' } }),
    ]);
    const compliancePercent = totalLessonPlans > 0
      ? Math.round((deliveredLessonPlans / totalLessonPlans) * 100)
      : 0;

    // Student/teacher trend (count from last month for comparison)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const [currentStudents, studentsLastMonth, currentTeachers] = await Promise.all([
      this.prisma.student.count({ where: { isActive: true, user: { schoolId } } }),
      this.prisma.student.count({
        where: { isActive: true, user: { schoolId }, createdAt: { lte: lastMonth } },
      }),
      this.prisma.user.count({
        where: { schoolId, isActive: true, role: { in: ['CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR'] } },
      }),
    ]);

    // Today's attendance %
    const [todayTotal, todayPresent] = await Promise.all([
      this.prisma.attendance.count({ where: { date: new Date(todayStr) } }),
      this.prisma.attendance.count({ where: { date: new Date(todayStr), status: { in: ['PRESENT', 'LATE'] } } }),
    ]);
    const todayAttendancePercent = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

    return {
      kpi: {
        totalStudents: currentStudents,
        studentTrend: currentStudents - studentsLastMonth,
        totalTeachers: currentTeachers,
        todayAttendancePercent,
        feeCollectedThisMonth: collectedAmount,
      },
      attendanceTrend,
      feeSummary: {
        collected: collectedAmount,
        pending: pendingAmount,
        defaulterCount: totalDefaulters,
      },
      alerts,
      quickStats: {
        totalSections,
        totalSubjects,
        totalLibraryBooks,
        totalHobbies,
        upcomingEvents,
      },
      teacherCompliance: {
        totalPlans: totalLessonPlans,
        delivered: deliveredLessonPlans,
        percent: compliancePercent,
      },
    };
  }

  // ─── Teacher Stats ───────────────────────────────────────────────

  async getTeacherStats(userId: string) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ...

    // Today's schedule from timetable slots
    const timetableSlots = await this.prisma.timetableSlot.findMany({
      where: {
        teacherId: userId,
        dayOfWeek,
      },
      include: {
        subject: { select: { name: true } },
        timetable: {
          select: {
            class: { select: { id: true, name: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const todaySchedule = timetableSlots.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject?.name || '—',
      className: s.timetable?.class?.name || '',
      section: s.timetable?.section?.name || '',
      room: s.room || '',
      type: s.type,
    }));

    // Attendance status: how many classes today have attendance marked
    const todayStr = today.toISOString().split('T')[0];
    const teacherClassIds = [...new Set(timetableSlots.map((s) => s.timetable?.class?.id).filter(Boolean))];
    const totalClassesToday = timetableSlots.filter((s) => s.type === 'LECTURE').length;

    let markedClasses = 0;
    if (teacherClassIds.length > 0) {
      // Count distinct classes where attendance was marked today by this teacher
      const markedAttendance = await this.prisma.attendance.findMany({
        where: {
          date: new Date(todayStr),
          markedById: userId,
        },
        select: { studentId: true },
      });
      markedClasses = markedAttendance.length > 0 ? Math.min(teacherClassIds.length, totalClassesToday) : 0;
    }

    // Pending tasks: assignments to grade
    const pendingGrading = await this.prisma.assignmentSubmission.count({
      where: {
        status: 'SUBMITTED',
        assignment: { teacherId: userId },
      },
    });

    // Total assignments by teacher
    const totalAssignments = await this.prisma.assignment.count({
      where: { teacherId: userId },
    });

    // Assessments to review
    const pendingAssessments = await this.prisma.assessmentSubmission.count({
      where: {
        status: 'SUBMITTED',
        assessment: { createdBy: userId },
      },
    });

    // Student performance: average across subjects this teacher teaches
    const teacherSubjects = await this.prisma.teacherSubject.findMany({
      where: { teacherId: userId },
      select: { subjectId: true, subject: { select: { name: true } } },
    });

    const subjectPerformance: { subject: string; average: number }[] = [];
    for (const ts of teacherSubjects) {
      const grades = await this.prisma.grade.findMany({
        where: { subjectId: ts.subjectId },
        select: { percentage: true },
      });
      const validGrades = grades.filter((g) => g.percentage !== null);
      const avg = validGrades.length > 0
        ? Math.round(validGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / validGrades.length)
        : 0;
      subjectPerformance.push({ subject: ts.subject.name, average: avg });
    }

    // Recent submissions needing grading
    const recentSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        status: 'SUBMITTED',
        assignment: { teacherId: userId },
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: {
        assignment: { select: { title: true, subject: { select: { name: true } } } },
      },
    });

    // Teaching progress: lesson plan completion
    const [totalPlans, deliveredPlans] = await Promise.all([
      this.prisma.lessonPlan.count({ where: { teacherId: userId } }),
      this.prisma.lessonPlan.count({ where: { teacherId: userId, status: 'DELIVERED' } }),
    ]);

    return {
      todaySchedule,
      attendanceStatus: {
        marked: markedClasses,
        total: totalClassesToday,
      },
      pendingTasks: {
        assignmentsToGrade: pendingGrading,
        assessmentsToReview: pendingAssessments,
        totalAssignments,
      },
      subjectPerformance,
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        assignmentTitle: s.assignment.title,
        subject: s.assignment.subject?.name || '',
        studentId: s.studentId,
        submittedAt: s.submittedAt,
        status: s.status,
      })),
      teachingProgress: {
        totalPlans,
        delivered: deliveredPlans,
        percent: totalPlans > 0 ? Math.round((deliveredPlans / totalPlans) * 100) : 0,
      },
    };
  }

  // ─── Student Stats ───────────────────────────────────────────────

  async getStudentStats(userId: string) {
    // Get student record from userId
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { name: true } },
      },
    });

    if (!student) {
      return { error: 'Student record not found' };
    }

    // Attendance summary
    const attendances = await this.prisma.attendance.findMany({
      where: { studentId: student.id },
    });
    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentDays = attendances.filter((a) => a.status === 'ABSENT').length;
    const lateDays = attendances.filter((a) => a.status === 'LATE').length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Subject-wise grades
    const grades = await this.prisma.grade.findMany({
      where: { studentId: student.id },
      include: { subject: { select: { name: true } } },
    });

    const subjectMap = new Map<string, { total: number; obtained: number; count: number }>();
    for (const g of grades) {
      const name = g.subject.name;
      const entry = subjectMap.get(name) || { total: 0, obtained: 0, count: 0 };
      entry.total += g.maxMarks;
      entry.obtained += g.marksObtained;
      entry.count += 1;
      subjectMap.set(name, entry);
    }

    const subjectGrades = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      percentage: data.total > 0 ? Math.round((data.obtained / data.total) * 100) : 0,
      assessments: data.count,
    }));

    // Upcoming assignments/assessments
    const upcomingAssignments = await this.prisma.assignment.findMany({
      where: {
        classId: student.classId,
        dueDate: { gte: new Date() },
        isPublished: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { subject: { select: { name: true } } },
    });

    const upcomingAssessments = await this.prisma.assessment.findMany({
      where: {
        classId: student.classId,
        scheduledDate: { not: null, gte: new Date() },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
      include: { subject: { select: { name: true } } },
    });

    const deadlines = [
      ...upcomingAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        type: 'ASSIGNMENT' as const,
        subject: a.subject.name,
        dueDate: a.dueDate,
      })),
      ...upcomingAssessments
        .filter((a) => a.scheduledDate !== null)
        .map((a) => ({
          id: a.id,
          title: a.title,
          type: 'ASSESSMENT' as const,
          subject: a.subject.name,
          dueDate: a.scheduledDate!,
        })),
    ]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    // Achievements: badges and points
    const [badgeCount, pointsRecords, leaderboard] = await Promise.all([
      this.prisma.badgeAward.count({ where: { studentId: student.id } }),
      this.prisma.studentPoints.findMany({
        where: { studentId: student.id },
        select: { points: true },
      }),
      this.prisma.leaderboard.findFirst({
        where: { studentId: student.id, classId: student.classId },
      }),
    ]);

    const totalPoints = pointsRecords.reduce((sum, p) => sum + p.points, 0);

    // Today's schedule
    const dayOfWeek = new Date().getDay();
    const todaySlots = await this.prisma.timetableSlot.findMany({
      where: {
        dayOfWeek,
        timetable: {
          classId: student.classId,
          sectionId: student.sectionId,
        },
      },
      include: {
        subject: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Learning progress: course module completion
    const moduleCompletions = await this.prisma.moduleItemCompletion.findMany({
      where: { studentId: student.id },
      select: { status: true },
    });
    const totalModuleItems = moduleCompletions.length;
    const completedItems = moduleCompletions.filter((m) => m.status === 'COMPLETED').length;

    // Learning path progress
    const pathEnrollments = await this.prisma.learningPathEnrollment.findMany({
      where: { studentId: student.id },
      include: { path: { select: { title: true } } },
    });

    return {
      attendance: {
        present: presentDays,
        absent: absentDays,
        late: lateDays,
        total: totalDays,
        percent: attendancePercent,
      },
      subjectGrades,
      deadlines,
      achievements: {
        badgeCount,
        totalPoints,
        rank: leaderboard?.rank || null,
        level: leaderboard?.level || 1,
      },
      todaySchedule: todaySlots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject?.name || '—',
        room: s.room || '',
        type: s.type,
      })),
      learningProgress: {
        moduleItems: totalModuleItems,
        completed: completedItems,
        percent: totalModuleItems > 0 ? Math.round((completedItems / totalModuleItems) * 100) : 0,
        paths: pathEnrollments.map((e) => ({
          title: e.path.title,
          completedSteps: e.completedSteps,
          totalSteps: e.totalSteps,
          status: e.status,
        })),
      },
    };
  }

  // ─── Original Stats (kept as-is) ────────────────────────────────

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

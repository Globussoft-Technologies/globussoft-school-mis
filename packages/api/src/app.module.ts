import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { AdmissionModule } from './modules/admission/admission.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { SyllabusModule } from './modules/syllabus/syllabus.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
// Phase 2
import { LmsContentModule } from './modules/lms-content/lms-content.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { GradingModule } from './modules/grading/grading.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
// Phase 3
import { FeesModule } from './modules/fees/fees.module';
import { DisciplineModule } from './modules/discipline/discipline.module';
import { BusModule } from './modules/bus/bus.module';
// Phase 4
import { HobbyModule } from './modules/hobby/hobby.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchoolDataModule } from './modules/school-data/school-data.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
// Phase 5
import { TeacherAttendanceModule } from './modules/teacher-attendance/teacher-attendance.module';
// Phase 6
import { ParentPortalModule } from './modules/parent-portal/parent-portal.module';
import { ExamScheduleModule } from './modules/exam-schedule/exam-schedule.module';
// Phase 7
import { DocumentsModule } from './modules/documents/documents.module';
import { StudentLeavesModule } from './modules/student-leaves/student-leaves.module';
// Phase 8
import { BulkOperationsModule } from './modules/bulk-operations/bulk-operations.module';
import { FeeAutomationModule } from './modules/fee-automation/fee-automation.module';
import { ReportsModule } from './modules/reports/reports.module';
// Phase 9
import { SubstitutesModule } from './modules/substitutes/substitutes.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ConcessionsModule } from './modules/concessions/concessions.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
// Phase 10
import { PeriodAttendanceModule } from './modules/period-attendance/period-attendance.module';
import { SearchModule } from './modules/search/search.module';
import { ResultWorkflowModule } from './modules/result-workflow/result-workflow.module';
import { RemedialModule } from './modules/remedial/remedial.module';
import { GraceMarksModule } from './modules/grace-marks/grace-marks.module';
// Phase 11
import { TcModule } from './modules/transfer-certificate/tc.module';
import { LibraryModule } from './modules/library/library.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
// Phase 12
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TransportBillingModule } from './modules/transport-billing/transport-billing.module';
// Phase 13
import { FeedbackModule } from './modules/feedback/feedback.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
// Infrastructure Services
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationTriggersModule } from './modules/notification-triggers/notification-triggers.module';
// Phase 14
import { RoomBookingModule } from './modules/room-booking/room-booking.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
// Phase 15
import { HostelModule } from './modules/hostel/hostel.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { GrievancesModule } from './modules/grievances/grievances.module';
// Phase 16
import { IdCardsModule } from './modules/id-cards/id-cards.module';
import { MessageLogModule } from './modules/message-log/message-log.module';
// Phase 17
import { TimetableGeneratorModule } from './modules/timetable-generator/timetable-generator.module';
import { DiaryModule } from './modules/diary/diary.module';
import { EventsModule } from './modules/events/events.module';
// Phase 18
import { ExpensesModule } from './modules/expenses/expenses.module';
import { AlumniModule } from './modules/alumni/alumni.module';
// Phase 19
import { StaffDirectoryModule } from './modules/staff-directory/staff-directory.module';
import { GalleryModule } from './modules/gallery/gallery.module';
// Phase 20
import { SurveysModule } from './modules/surveys/surveys.module';
// Phase 21
import { PerformanceReportModule } from './modules/performance-report/performance-report.module';
import { AcademicTransitionModule } from './modules/academic-transition/academic-transition.module';
// Phase 22 — LMS Deep Features
import { LearningPathsModule } from './modules/learning-paths/learning-paths.module';
import { RubricsModule } from './modules/rubrics/rubrics.module';
import { LiveClassesModule } from './modules/live-classes/live-classes.module';
// Phase 23 — Deep LMS: Course Modules, Discussions, Gamification
import { CourseModulesModule } from './modules/course-modules/course-modules.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { GamificationModule } from './modules/gamification/gamification.module';
// Phase 24 — Teaching Tracking
import { TeachingModule } from './modules/teaching/teaching.module';
// Audit
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Audit (global — register early so any service can inject AuditService)
    AuditModule,
    // Phase 1
    AuthModule,
    UsersModule,
    StudentsModule,
    AdmissionModule,
    AttendanceModule,
    SyllabusModule,
    TimetableModule,
    DashboardModule,
    // Phase 2
    LmsContentModule,
    ComplianceModule,
    AssessmentsModule,
    GradingModule,
    AnalyticsModule,
    // Phase 3
    FeesModule,
    DisciplineModule,
    BusModule,
    // Phase 4
    HobbyModule,
    CommunicationModule,
    NotificationsModule,
    SchoolDataModule,
    AssignmentsModule,
    // Phase 5
    TeacherAttendanceModule,
    // Phase 6
    ParentPortalModule,
    ExamScheduleModule,
    // Phase 7
    DocumentsModule,
    StudentLeavesModule,
    // Phase 8
    BulkOperationsModule,
    FeeAutomationModule,
    ReportsModule,
    // Phase 9
    SubstitutesModule,
    CalendarModule,
    SettingsModule,
    PromotionsModule,
    ConcessionsModule,
    AnnouncementsModule,
    // Phase 10
    PeriodAttendanceModule,
    SearchModule,
    ResultWorkflowModule,
    RemedialModule,
    GraceMarksModule,
    // Phase 11
    TcModule,
    LibraryModule,
    VisitorsModule,
    // Phase 12
    HealthModule,
    InventoryModule,
    TransportBillingModule,
    // Phase 13
    FeedbackModule,
    CertificatesModule,
    // Phase 14
    RoomBookingModule,
    MeetingsModule,
    ActivityLogModule,
    // Phase 15
    HostelModule,
    PayrollModule,
    GrievancesModule,
    // Phase 16
    IdCardsModule,
    MessageLogModule,
    // Phase 17
    TimetableGeneratorModule,
    DiaryModule,
    EventsModule,
    // Phase 18
    ExpensesModule,
    AlumniModule,
    // Phase 19
    StaffDirectoryModule,
    GalleryModule,
    // Phase 20
    SurveysModule,
    // Phase 21
    PerformanceReportModule,
    AcademicTransitionModule,
    // Phase 22 — LMS Deep Features
    LearningPathsModule,
    RubricsModule,
    LiveClassesModule,
    // Phase 23 — Deep LMS: Course Modules, Discussions, Gamification
    CourseModulesModule,
    DiscussionsModule,
    GamificationModule,
    // Phase 24 — Teaching Tracking
    TeachingModule,
    // Infrastructure Services (Global)
    FileUploadModule,
    EmailModule,
    NotificationTriggersModule,
  ],
})
export class AppModule {}

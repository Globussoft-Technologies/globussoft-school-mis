import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Settings,
  MessageSquare,
  CreditCard,
  Heart,
  Bus,
  BarChart3,
  Users,
  UserPlus,
  ClipboardCheck,
  BookMarked,
  CalendarDays,
  Library,
  ClipboardList,
  Layers,
  Brain,
  Award,
  FileText,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  LayoutGrid,
  Clipboard,
  Gauge,
  Video,
  MessageCircle,
  Trophy,
  Activity,
  Upload,
  Calendar,
  Eye,
  Megaphone,
  Building,
  UserCheck,
  Search,
  Repeat,
  Bell,
  Star,
  AlertTriangle,
  Smartphone,
  BookOpenCheck,
  Wallet,
  Receipt,
  Percent,
  Banknote,
  TrendingDown,
  Truck,
  Cog,
  Package,
  Image,
  UsersRound,
  BarChart,
  Bed,
  DoorOpen,
  BadgeCheck,
  FileBadge,
  GraduationCap,
  Zap,
  Shield,
} from 'lucide-react';

const categories = [
  {
    key: 'academic',
    title: 'Academic Management',
    subtitle: '23 Features',
    description:
      'End-to-end academic lifecycle management -- from admissions and attendance to assessments, report cards, and personalized learning paths. Support for CBSE, ICSE, and all State Board curricula.',
    color: 'from-blue-600 to-blue-700',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    features: [
      { name: 'Student Management', icon: Users, desc: 'Complete student lifecycle from enquiry to alumni with detailed profiles, documents, and academic records.' },
      { name: 'Admission Pipeline', icon: UserPlus, desc: 'Enquiry to Application to Enrollment -- structured multi-stage admission workflow with status tracking.' },
      { name: 'Daily & Period Attendance', icon: ClipboardCheck, desc: 'Mark attendance daily or period-wise with biometric and RFID integration support.' },
      { name: 'Syllabus & Curriculum', icon: BookMarked, desc: 'Map curriculum to classes, track coverage percentage, and ensure board compliance.' },
      { name: 'Smart Timetable', icon: CalendarDays, desc: 'Auto-generate conflict-free timetables with teacher workload balancing and room allocation.' },
      { name: 'LMS Content Library', icon: Library, desc: 'Upload and organize videos, documents, presentations, and links for digital learning.' },
      { name: 'Assignments & Homework', icon: ClipboardList, desc: 'Create, distribute, collect, and grade assignments with deadline tracking and reminders.' },
      { name: '8-Tier Assessments', icon: Layers, desc: 'From classwork to final exams -- 8 configurable assessment tiers for any grading scheme.' },
      { name: 'Question Bank', icon: Brain, desc: 'Categorized question repository by subject, chapter, difficulty, and Bloom\'s taxonomy level.' },
      { name: 'Grading System', icon: Award, desc: 'Flexible grading with GPA, percentage, and grade-point scales for any board requirements.' },
      { name: 'Report Cards', icon: FileText, desc: 'Generate term and annual report cards with custom templates and bulk PDF printing.' },
      { name: 'Curriculum Compliance', icon: CheckCircle2, desc: 'Track syllabus completion against timelines, flag gaps, and ensure full board compliance.' },
      { name: 'Result Approval Workflow', icon: ClipboardCheck, desc: 'Multi-level result verification by class teacher, HOD, and principal before publication.' },
      { name: 'Remedial Classes', icon: Lightbulb, desc: 'Identify struggling students and auto-schedule targeted remedial sessions.' },
      { name: 'Grace Marks', icon: Sparkles, desc: 'Configure grace mark policies by subject, exam type, student category, and special cases.' },
      { name: 'Personalized Learning', icon: Target, desc: 'Adaptive learning paths based on student performance data and learning style analytics.' },
      { name: 'Course Modules', icon: LayoutGrid, desc: 'Structure courses into modules with sequenced content, prerequisites, and progress tracking.' },
      { name: 'Assessment Rubrics', icon: Clipboard, desc: 'Create detailed rubrics with criteria, levels, and descriptors for objective assessment.' },
      { name: 'Speed Grader', icon: Gauge, desc: 'Grade submissions 3x faster with inline comments, annotations, and quick score assignment.' },
      { name: 'Live Virtual Classes', icon: Video, desc: 'Conduct live online classes with screen sharing, recording, chat, and auto-attendance.' },
      { name: 'Discussion Forums', icon: MessageCircle, desc: 'Subject-wise discussion boards for peer learning and teacher-student interaction.' },
      { name: 'Gamification', icon: Trophy, desc: 'Points, badges, and leaderboards to boost student engagement and healthy competition.' },
      { name: 'Teaching Tracker', icon: Activity, desc: 'Real-time tracking of which teacher is teaching what, with tap-to-cover substitution.' },
    ],
  },
  {
    key: 'admin',
    title: 'Administration',
    subtitle: '13 Features',
    description:
      'Powerful tools for day-to-day school operations -- user management with 10 distinct roles, academic year transitions, bulk data operations, and comprehensive audit logging.',
    color: 'from-indigo-600 to-indigo-700',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    features: [
      { name: 'Multi-Role User Management', icon: Users, desc: '10 distinct roles with granular permissions -- Super Admin, Admin, Principal, Vice Principal, Teacher, Class Teacher, Student, Parent, Accountant, Transport Manager.' },
      { name: 'Class & Section Management', icon: LayoutGrid, desc: 'Create and manage classes, sections, streams, and assign class teachers with capacity tracking.' },
      { name: 'Academic Year Transitions', icon: Repeat, desc: 'Seamless year-end transitions with bulk promotion, data archival, and setting rollover.' },
      { name: 'Bulk Import/Export', icon: Upload, desc: 'Import students, staff, fees, and attendance via CSV. Export any report to Excel, CSV, or PDF.' },
      { name: 'School Calendar', icon: Calendar, desc: 'Academic calendar with holidays, events, exam dates, PTM schedules, and board exam dates.' },
      { name: 'Event Management', icon: CalendarDays, desc: 'Plan school events with invitations, RSVPs, reminders, photo uploads, and feedback collection.' },
      { name: 'System Settings', icon: Settings, desc: 'Configure branding, academic rules, grading scales, notification preferences, and integrations.' },
      { name: 'Audit Logs', icon: Eye, desc: 'Complete immutable trail of every action -- who changed what, when, and from where.' },
      { name: 'Promotion Workflows', icon: ArrowRight, desc: 'Rule-based promotions with pass/fail criteria, grace rules, exceptions, and bulk processing.' },
      { name: 'Announcements', icon: Megaphone, desc: 'Targeted announcements to specific classes, sections, roles, or the entire school with scheduling.' },
      { name: 'Staff Directory', icon: Building, desc: 'Comprehensive staff database with qualifications, experience, designations, and documents.' },
      { name: 'Visitor Management', icon: UserCheck, desc: 'Track visitors with purpose, host, check-in/out, photo capture, and pre-approval workflows.' },
      { name: 'Global Search', icon: Search, desc: 'Instantly search across students, staff, fees, attendance, and all 77 modules from one search bar.' },
    ],
  },
  {
    key: 'communication',
    title: 'Communication Hub',
    subtitle: '9 Features',
    description:
      'Keep parents, teachers, and students connected with multi-channel notifications, instant messaging, grievance management, and structured feedback collection.',
    color: 'from-orange-500 to-orange-600',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    features: [
      { name: 'Parent-Teacher Messaging', icon: MessageCircle, desc: 'Secure direct messaging between parents and teachers with read receipts and file sharing.' },
      { name: 'Multi-Channel Notifications', icon: Bell, desc: 'Send alerts via Push, SMS, WhatsApp, and Email -- configure per event type and audience.' },
      { name: 'Announcements', icon: Megaphone, desc: 'Role-based and class-based announcements with scheduling, priority, and acknowledgment tracking.' },
      { name: 'Message Logs', icon: FileText, desc: 'Complete history of all messages with delivery status, read receipts, and cost tracking.' },
      { name: 'Feedback Collection', icon: Star, desc: 'Structured feedback forms for parents, students, and staff with analytics and trend reports.' },
      { name: 'Grievance Management', icon: AlertTriangle, desc: 'Formal grievance filing with category tagging, escalation rules, SLA tracking, and resolution.' },
      { name: 'PTM Booking', icon: Calendar, desc: 'Parents book PTM slots online. Teachers set availability. Auto-reminders before the meeting.' },
      { name: 'Daily Diary', icon: BookOpenCheck, desc: 'Digital daily diary for homework, class notes, teacher remarks, and parent acknowledgments.' },
      { name: 'WhatsApp Integration', icon: Smartphone, desc: 'Send fee reminders, attendance alerts, exam schedules, and report cards via WhatsApp.' },
    ],
  },
  {
    key: 'finance',
    title: 'Finance & Fees',
    subtitle: '8 Features',
    description:
      'Complete financial management -- design fee structures, track multi-mode payments, manage scholarships, automate reminders, handle payroll, and track every rupee of school expense.',
    color: 'from-emerald-500 to-emerald-600',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    features: [
      { name: 'Fee Structure Builder', icon: Wallet, desc: 'Design complex fee structures by class, category, installment, component, and sibling discount rules.' },
      { name: 'Payment Tracking', icon: Receipt, desc: 'Track payments via Cash, Online, Cheque, DD, and UPI with auto-reconciliation and receipt generation.' },
      { name: 'Scholarships & Concessions', icon: Percent, desc: 'Configure merit-based and need-based scholarships with multi-level approval workflows.' },
      { name: 'Defaulter Management', icon: AlertTriangle, desc: 'Auto-flag defaulters, send escalating reminders, generate legal notices, and track recovery.' },
      { name: 'Staff Payroll', icon: Banknote, desc: 'Salary structures, deductions (PF/TDS), payslip generation, and bank file creation for all staff.' },
      { name: 'Expense Tracking', icon: TrendingDown, desc: 'Record, categorize, approve, and report on all school expenses with budget vs actual comparison.' },
      { name: 'Transport Billing', icon: Truck, desc: 'Route-based transport fee calculation with distance slabs, billing, and integrated collection.' },
      { name: 'Fee Automation', icon: Cog, desc: 'Auto-generate invoices on schedule, apply late fees, send reminders, and process recurring payments.' },
    ],
  },
  {
    key: 'cocurricular',
    title: 'Co-curricular & Support',
    subtitle: '8 Features',
    description:
      'Beyond academics -- manage clubs, health records, library, inventory, galleries, certificates, alumni networks, and school-wide surveys.',
    color: 'from-pink-500 to-pink-600',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    features: [
      { name: 'Hobbies & Clubs', icon: Star, desc: 'Manage extracurricular clubs with memberships, schedules, attendance, and achievement tracking.' },
      { name: 'Health Records', icon: Heart, desc: 'Student health profiles, vaccination records, medical history, allergies, and emergency contacts.' },
      { name: 'Library Management', icon: Library, desc: 'Book catalog with ISBN lookup, issue/return, fine management, reservations, and digital library.' },
      { name: 'Inventory & Assets', icon: Package, desc: 'Track school assets, lab equipment, furniture with depreciation, maintenance, and audit trails.' },
      { name: 'Photo Gallery', icon: Image, desc: 'Event-wise photo galleries with albums, captions, tagging, and privacy controls for parents.' },
      { name: 'Certificate Generation', icon: Award, desc: 'Design custom templates and bulk-generate certificates for achievements, sports, and participation.' },
      { name: 'Alumni Network', icon: UsersRound, desc: 'Alumni database with profiles, batch records, events, mentoring programs, and fundraising tools.' },
      { name: 'Surveys & Polls', icon: BarChart, desc: 'Create surveys and polls for feedback, elections, and data collection with real-time analytics.' },
    ],
  },
  {
    key: 'operations',
    title: 'Operations & Logistics',
    subtitle: '7 Features',
    description:
      'Streamline school operations -- transport routes and tracking, hostel management, facility booking, ID cards, teacher leave management, and transfer certificates.',
    color: 'from-teal-500 to-teal-600',
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-600',
    features: [
      { name: 'Transport & Bus Tracking', icon: Bus, desc: 'Route planning, stop management, GPS tracking, driver details, and real-time parent notifications.' },
      { name: 'Hostel Management', icon: Bed, desc: 'Room allocation, bed management, mess schedules, hostel attendance, and complaint tracking.' },
      { name: 'Room & Facility Booking', icon: DoorOpen, desc: 'Book labs, auditoriums, sports facilities with calendar view, conflict detection, and approvals.' },
      { name: 'ID Card Generation', icon: BadgeCheck, desc: 'Design templates and bulk-print student and staff ID cards with photo, barcode, and QR code.' },
      { name: 'Teacher Attendance & Leave', icon: ClipboardCheck, desc: 'Track staff attendance, manage leave requests with balance tracking and approval workflows.' },
      { name: 'Substitute Assignment', icon: Repeat, desc: 'Auto-suggest substitute teachers based on availability, subject qualification, and workload.' },
      { name: 'Transfer Certificates', icon: FileBadge, desc: 'Generate TCs with auto-filled academic data, principal signature, and serial number tracking.' },
    ],
  },
  {
    key: 'dashboards',
    title: 'Role-Specific Dashboards',
    subtitle: '4 Dashboards',
    description:
      'Every stakeholder gets a personalized command center. Real-time KPIs, trends, alerts, and quick actions -- tailored to what each role needs most.',
    color: 'from-cyan-500 to-cyan-600',
    lightColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    features: [
      { name: 'Admin / Principal Dashboard', icon: Gauge, desc: 'Enrollment trends, fee collection rates, attendance percentages, staff performance, alerts, and compliance status at a glance.' },
      { name: 'Teacher Dashboard', icon: CalendarDays, desc: 'Today\'s timetable, pending submissions to grade, attendance marking, teaching progress tracker, and student performance overview.' },
      { name: 'Student Dashboard', icon: GraduationCap, desc: 'Current grades, attendance history, upcoming assignments and exams, achievement badges, and learning path progress.' },
      { name: 'Parent Dashboard', icon: Users, desc: 'Ward overview with attendance, recent grades, fee payment status, upcoming events, and quick message to teacher.' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 sm:py-28">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
            <Zap className="h-4 w-4 text-yellow-300" />
            Complete Feature List
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            77 Modules. One Platform.{' '}
            <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
              Zero Compromise.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Every feature your school needs -- built in, not bolted on.
            Explore 7 categories covering academics, administration,
            communication, finance, co-curriculars, operations, and dashboards.
          </p>

          {/* Quick stats */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { value: '77', label: 'Modules' },
              { value: '128', label: 'Database Models' },
              { value: '10', label: 'User Roles' },
              { value: '7', label: 'Categories' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
            <path
              d="M0 80L60 74.7C120 69.3 240 58.7 360 53.3C480 48 600 48 720 53.3C840 58.7 960 69.3 1080 69.3C1200 69.3 1320 58.7 1380 53.3L1440 48V80H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Feature Categories */}
      {categories.map((category, catIdx) => (
        <section
          key={category.key}
          id={category.key}
          className={`py-20 sm:py-24 ${catIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Header */}
            <div className="max-w-3xl mb-12">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${category.lightColor} ${category.textColor} text-sm font-medium mb-4`}
              >
                <Shield className="h-4 w-4" />
                {category.subtitle}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                {category.title}
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                {category.description}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.features.map((feature) => (
                <div
                  key={feature.name}
                  className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${category.lightColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className={`h-5 w-5 ${category.textColor}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {feature.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Screenshot Placeholder */}
            <div
              className={`mt-12 rounded-2xl bg-gradient-to-br ${category.color} p-8 sm:p-12 flex items-center justify-center min-h-[200px]`}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <p className="text-white/90 font-semibold text-lg">
                  {category.title} Dashboard
                </p>
                <p className="text-white/60 text-sm mt-1">
                  Interactive screenshot coming soon
                </p>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Ready to Experience All 77 Features?
          </h2>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
            Start your 30-day free trial with full access to every module.
            No credit card required. Set up your school in under a day.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white text-blue-700 font-bold text-lg hover:bg-blue-50 transition-all shadow-lg shadow-black/10"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-lg border border-white/20 hover:bg-white/20 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

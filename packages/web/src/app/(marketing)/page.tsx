'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Zap,
  Star,
  Shield,
  Check,
  GraduationCap,
  Users,
  School,
  Clock,
  CalendarDays,
  Target,
  CreditCard,
  MessageSquare,
  BarChart3,
  BookOpen,
  Bus,
  Clipboard,
  ClipboardCheck,
  UserCheck,
  FileText,
  Bell,
  Settings,
  Search,
  Upload,
  Calendar,
  Megaphone,
  Building,
  Eye,
  Globe,
  UserPlus,
  ClipboardList,
  BookMarked,
  Brain,
  Layers,
  PenTool,
  Video,
  MessageCircle,
  Trophy,
  Activity,
  Lightbulb,
  LayoutGrid,
  Award,
  Gauge,
  CheckCircle2,
  Timer,
  Sparkles,
  Heart,
  Library,
  Package,
  Image,
  ScrollText,
  UsersRound,
  BarChart,
  Home,
  MapPin,
  Bed,
  DoorOpen,
  BadgeCheck,
  Repeat,
  FileBadge,
  HelpCircle,
  Phone,
  Mail,
  Smartphone,
  Send,
  Frown,
  BookOpenCheck,
  Wallet,
  Receipt,
  Percent,
  AlertTriangle,
  Banknote,
  TrendingDown,
  Truck,
  Cog,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

const stats = [
  { value: '100+', label: 'Schools Trust Us', icon: School },
  { value: '50,000+', label: 'Students Managed', icon: Users },
  { value: '10,000+', label: 'Teachers Empowered', icon: GraduationCap },
  { value: '98%', label: 'Satisfaction Rate', icon: Star },
];

const highlightCards = [
  {
    icon: BookOpen,
    title: 'Smart Academics',
    description:
      'End-to-end academic management -- admissions, attendance, syllabus, 8-tier assessments, report cards, and personalized learning paths.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: CalendarDays,
    title: 'Intelligent Timetabling',
    description:
      'Auto-generate conflict-free timetables with teacher workload balancing, room allocation, and instant rescheduling.',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Target,
    title: 'Teaching Tracker',
    description:
      'Real-time classroom tracking with tap-to-cover substitution, syllabus progress monitoring, and teacher performance insights.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: CreditCard,
    title: 'Finance & Fees',
    description:
      'Fee structure builder, multi-mode payments (UPI/Cash/Online), scholarships, defaulter management, payroll, and expense tracking.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    description:
      'Parent-teacher messaging, push/SMS/WhatsApp/email notifications, PTM booking, grievance management, and daily diary.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description:
      '4 role-specific dashboards with KPIs, trends, alerts -- for Admin, Teacher, Student, and Parent views.',
    color: 'from-cyan-500 to-cyan-600',
  },
];

const featureCategories = [
  {
    key: 'academic',
    label: 'Academic',
    icon: BookOpen,
    features: [
      { name: 'Student Management', icon: Users, desc: 'Complete student lifecycle from enquiry to alumni with detailed profiles and records.' },
      { name: 'Admission Pipeline', icon: UserPlus, desc: 'Enquiry to Application to Enrollment -- structured multi-stage admission workflow.' },
      { name: 'Daily & Period Attendance', icon: ClipboardCheck, desc: 'Mark attendance daily or period-wise with biometric/RFID integration support.' },
      { name: 'Syllabus & Curriculum', icon: BookMarked, desc: 'Map curriculum to classes, track coverage, ensure CBSE/ICSE/State board compliance.' },
      { name: 'Smart Timetable', icon: CalendarDays, desc: 'Auto-generate timetables with conflict detection and teacher workload balancing.' },
      { name: 'LMS Content Library', icon: Library, desc: 'Upload and organize videos, documents, presentations for digital learning.' },
      { name: 'Assignments & Homework', icon: ClipboardList, desc: 'Create, distribute, collect and grade assignments with deadline tracking.' },
      { name: '8-Tier Assessments', icon: Layers, desc: 'From classwork to final exams -- 8 configurable assessment tiers for any grading scheme.' },
      { name: 'Question Bank', icon: Brain, desc: 'Categorized question repository by subject, chapter, difficulty, and Bloom\'s taxonomy.' },
      { name: 'Grading System', icon: Award, desc: 'Flexible grading with GPA, percentage, and grade-point scales for any board.' },
      { name: 'Report Cards', icon: FileText, desc: 'Generate term and annual report cards with custom templates and bulk printing.' },
      { name: 'Curriculum Compliance', icon: CheckCircle2, desc: 'Track syllabus completion against timelines, flag gaps, ensure board compliance.' },
      { name: 'Result Approval Workflow', icon: ClipboardCheck, desc: 'Multi-level result verification and approval before publication to parents.' },
      { name: 'Remedial Classes', icon: Lightbulb, desc: 'Identify struggling students and schedule targeted remedial sessions.' },
      { name: 'Grace Marks', icon: Sparkles, desc: 'Configure grace mark policies by subject, exam type, and student category.' },
      { name: 'Personalized Learning', icon: Target, desc: 'Adaptive learning paths based on student performance and learning style.' },
      { name: 'Course Modules', icon: LayoutGrid, desc: 'Structure courses into modules with sequenced content and prerequisites.' },
      { name: 'Assessment Rubrics', icon: Clipboard, desc: 'Create detailed rubrics for objective and transparent assessment criteria.' },
      { name: 'Speed Grader', icon: Gauge, desc: 'Grade submissions faster with inline comments, annotations, and quick scores.' },
      { name: 'Live Virtual Classes', icon: Video, desc: 'Conduct live online classes with screen sharing, recording, and attendance.' },
      { name: 'Discussion Forums', icon: MessageCircle, desc: 'Subject-wise discussion boards for peer-to-peer and teacher-student interaction.' },
      { name: 'Gamification', icon: Trophy, desc: 'Points, badges, and leaderboards to boost student engagement and motivation.' },
      { name: 'Teaching Tracker', icon: Activity, desc: 'Real-time tracking of which teacher is teaching what, with substitution management.' },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    icon: Settings,
    features: [
      { name: 'Multi-Role User Management', icon: Users, desc: '10 distinct roles with granular permissions -- Admin, Principal, Teacher, Student, Parent, and more.' },
      { name: 'Class & Section Management', icon: LayoutGrid, desc: 'Create and manage classes, sections, and assign class teachers with capacity tracking.' },
      { name: 'Academic Year Transitions', icon: Repeat, desc: 'Seamless year-end transitions with bulk promotion, data archival, and rollover.' },
      { name: 'Bulk Import/Export', icon: Upload, desc: 'Import students, staff, and data via CSV. Export any report to Excel or PDF.' },
      { name: 'School Calendar', icon: Calendar, desc: 'Academic calendar with holidays, events, exam dates, and PTM schedules.' },
      { name: 'Event Management', icon: CalendarDays, desc: 'Plan and manage school events with invitations, RSVPs, and notifications.' },
      { name: 'System Settings', icon: Settings, desc: 'Configure school branding, academic rules, grading scales, and notification preferences.' },
      { name: 'Audit Logs', icon: Eye, desc: 'Complete trail of who did what and when -- for accountability and compliance.' },
      { name: 'Promotion Workflows', icon: ArrowRight, desc: 'Rule-based student promotions with criteria, exceptions, and bulk processing.' },
      { name: 'Announcements', icon: Megaphone, desc: 'Broadcast announcements to specific classes, sections, or the entire school.' },
      { name: 'Staff Directory', icon: Building, desc: 'Comprehensive staff database with qualifications, designations, and contact details.' },
      { name: 'Visitor Management', icon: UserCheck, desc: 'Track school visitors with purpose, check-in/out times, and host notifications.' },
      { name: 'Global Search', icon: Search, desc: 'Instantly search across students, staff, fees, attendance, and all modules.' },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    features: [
      { name: 'Parent-Teacher Messaging', icon: MessageCircle, desc: 'Secure direct messaging between parents and teachers with read receipts.' },
      { name: 'Multi-Channel Notifications', icon: Bell, desc: 'Send alerts via Push, SMS, WhatsApp, and Email -- all from one place.' },
      { name: 'Announcements', icon: Megaphone, desc: 'Role-based and class-based announcements with scheduling and priority levels.' },
      { name: 'Message Logs', icon: FileText, desc: 'Complete history of all messages sent with delivery and read tracking.' },
      { name: 'Feedback Collection', icon: Star, desc: 'Collect structured feedback from parents, students, and staff with analytics.' },
      { name: 'Grievance Management', icon: AlertTriangle, desc: 'Formal grievance filing with tracking, escalation, and resolution workflows.' },
      { name: 'PTM Booking', icon: Calendar, desc: 'Parents book PTM slots online. Teachers manage availability and schedules.' },
      { name: 'Daily Diary', icon: BookOpenCheck, desc: 'Digital daily diary for homework, notes, and parent acknowledgments.' },
      { name: 'WhatsApp Integration', icon: Smartphone, desc: 'Send fee reminders, attendance alerts, and report cards via WhatsApp.' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: CreditCard,
    features: [
      { name: 'Fee Structure Builder', icon: Wallet, desc: 'Design complex fee structures by class, category, installment, and component.' },
      { name: 'Payment Tracking', icon: Receipt, desc: 'Track payments via Cash, Online, Cheque, and UPI with auto-reconciliation.' },
      { name: 'Scholarships & Concessions', icon: Percent, desc: 'Configure merit-based and need-based scholarships with approval workflows.' },
      { name: 'Defaulter Management', icon: AlertTriangle, desc: 'Auto-flag defaulters, send reminders, generate notices, and track collections.' },
      { name: 'Staff Payroll', icon: Banknote, desc: 'Salary structure, deductions, payslips, and bank file generation for all staff.' },
      { name: 'Expense Tracking', icon: TrendingDown, desc: 'Record, categorize, and report on all school expenses with approval chains.' },
      { name: 'Transport Billing', icon: Truck, desc: 'Route-based transport fee calculation, billing, and collection tracking.' },
      { name: 'Fee Automation', icon: Cog, desc: 'Auto-generate invoices, send reminders, apply late fees, and process recurring payments.' },
    ],
  },
  {
    key: 'cocurricular',
    label: 'Co-curricular',
    icon: Heart,
    features: [
      { name: 'Hobbies & Clubs', icon: Star, desc: 'Manage extracurricular clubs, memberships, schedules, and attendance.' },
      { name: 'Health Records', icon: Heart, desc: 'Maintain student health profiles, vaccination records, and medical history.' },
      { name: 'Library Management', icon: Library, desc: 'Book catalog, issue/return tracking, fine management, and digital library.' },
      { name: 'Inventory & Assets', icon: Package, desc: 'Track school assets, lab equipment, furniture with depreciation and maintenance.' },
      { name: 'Photo Gallery', icon: Image, desc: 'Event-wise photo galleries with albums, captions, and privacy controls.' },
      { name: 'Certificate Generation', icon: Award, desc: 'Design and bulk-generate certificates for achievements, participation, and more.' },
      { name: 'Alumni Network', icon: UsersRound, desc: 'Alumni database with profiles, events, mentoring, and fundraising tools.' },
      { name: 'Surveys & Polls', icon: BarChart, desc: 'Create surveys for feedback, voting, and data collection with analytics.' },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: Bus,
    features: [
      { name: 'Transport & Bus Tracking', icon: Bus, desc: 'Route planning, GPS tracking, driver management, and parent notifications.' },
      { name: 'Hostel Management', icon: Bed, desc: 'Room allocation, mess management, hostel attendance, and complaint tracking.' },
      { name: 'Room & Facility Booking', icon: DoorOpen, desc: 'Book labs, auditoriums, sports facilities with availability and conflict checks.' },
      { name: 'ID Card Generation', icon: BadgeCheck, desc: 'Design and bulk-print student and staff ID cards with photo and barcode.' },
      { name: 'Teacher Attendance & Leave', icon: ClipboardCheck, desc: 'Track teacher attendance, manage leave requests with approval workflows.' },
      { name: 'Substitute Assignment', icon: Repeat, desc: 'Auto-suggest substitutes based on availability, subject, and workload.' },
      { name: 'Transfer Certificates', icon: FileBadge, desc: 'Generate TC with auto-filled data, digital signatures, and tracking.' },
    ],
  },
  {
    key: 'dashboards',
    label: 'Dashboards',
    icon: BarChart3,
    features: [
      { name: 'Admin / Principal Dashboard', icon: Gauge, desc: 'KPIs, enrollment trends, fee collection, attendance rates, alerts, and staff performance at a glance.' },
      { name: 'Teacher Dashboard', icon: CalendarDays, desc: 'Today\'s schedule, pending tasks, student performance, attendance marking, and teaching progress.' },
      { name: 'Student Dashboard', icon: GraduationCap, desc: 'Grades, attendance history, upcoming assignments, achievements, and learning path progress.' },
      { name: 'Parent Dashboard', icon: Users, desc: 'Ward overview -- attendance, grades, fee status, upcoming events, and teacher messages.' },
    ],
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Setup',
    description: 'Create your school account, add branding, and configure academic settings in under 30 minutes.',
    icon: Settings,
  },
  {
    step: '02',
    title: 'Configure',
    description: 'Import students and staff via CSV, set up fee structures, create timetables, and define user roles.',
    icon: Upload,
  },
  {
    step: '03',
    title: 'Go Live',
    description: 'Invite teachers, students, and parents. Start marking attendance, collecting fees, and tracking progress.',
    icon: Zap,
  },
  {
    step: '04',
    title: 'Grow',
    description: 'Leverage analytics, automate workflows, and scale to multiple branches with confidence.',
    icon: BarChart3,
  },
];

const roles = [
  { name: 'Super Admin', desc: 'Full system control, multi-school management', icon: Shield },
  { name: 'Admin', desc: 'School-level settings, user management, reports', icon: Settings },
  { name: 'Principal', desc: 'Academic oversight, approvals, dashboards', icon: GraduationCap },
  { name: 'Vice Principal', desc: 'Discipline, timetable, day-to-day operations', icon: UserCheck },
  { name: 'Teacher', desc: 'Attendance, grades, LMS content, assignments', icon: BookOpen },
  { name: 'Class Teacher', desc: 'Section management, report cards, parent connect', icon: ClipboardList },
  { name: 'Student', desc: 'Assignments, grades, attendance, learning portal', icon: Users },
  { name: 'Parent', desc: 'Ward tracking, fees, messaging, PTM booking', icon: Home },
  { name: 'Accountant', desc: 'Fees, payroll, expenses, financial reports', icon: CreditCard },
  { name: 'Transport Manager', desc: 'Routes, drivers, tracking, billing', icon: Bus },
];

const plans = [
  {
    name: 'Starter',
    price: '199',
    period: '/student/month',
    description: 'Perfect for small schools getting started.',
    features: [
      'Up to 500 students',
      'Student & attendance management',
      'Fee management & online payments',
      'Basic timetable builder',
      'Parent portal',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    price: '349',
    period: '/student/month',
    description: 'For growing schools needing advanced automation.',
    features: [
      'Up to 2,000 students',
      'Everything in Starter',
      'Smart timetable auto-generation',
      'Teaching tracker',
      'LMS & e-learning',
      'Analytics dashboard',
      'Transport management',
      'Priority support',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '499',
    period: '/student/month',
    description: 'For large institutions and multi-branch networks.',
    features: [
      'Unlimited students',
      'Everything in Professional',
      'AI-powered analytics',
      'Custom dashboards',
      'Hostel management',
      'Multi-branch support',
      'API access',
      'Dedicated account manager',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const testimonials = [
  {
    quote:
      'GlobusLMS has completely transformed how we manage our school. The smart timetable alone saves us 20+ hours every term. Our teachers love the teaching tracker -- it has made substitute management effortless.',
    name: 'Dr. Priya Sharma',
    role: 'Principal',
    school: 'Sunrise International School, Jaipur',
  },
  {
    quote:
      'The fee management module reduced our outstanding collections by 40% in just three months. Parents appreciate the transparency and the online payment options. The analytics dashboard gives us insights we never had before.',
    name: 'Rajesh Gupta',
    role: 'Director',
    school: 'Vidya Bharati Public School, Indore',
  },
  {
    quote:
      'We evaluated five different school ERP solutions before choosing GlobusLMS. The LMS integration, combined with traditional school management, gives us the best of both worlds. Our students are more engaged than ever.',
    name: 'Anjali Mehta',
    role: 'Academic Coordinator',
    school: 'Delhi Modern Academy, New Delhi',
  },
];

const faqs = [
  {
    question: 'Can I try GlobusLMS before committing to a plan?',
    answer:
      'Absolutely! All plans come with a 30-day free trial with no credit card required. You get full Professional plan access during the trial.',
  },
  {
    question: 'How long does setup take?',
    answer:
      'Most schools are up and running within a day. Our onboarding wizard and CSV import tools make it easy to migrate your existing data.',
  },
  {
    question: 'Is GlobusLMS suitable for CBSE, ICSE, and State Board schools?',
    answer:
      'Yes! GlobusLMS supports all major Indian education boards including CBSE, ICSE, and all State Boards. The grading and curriculum modules are fully configurable.',
  },
  {
    question: 'Can parents access the system on mobile?',
    answer:
      'Yes. GlobusLMS is fully responsive and works on any device. Parents can check attendance, grades, fees, and communicate with teachers from their phone.',
  },
  {
    question: 'What kind of support do you provide?',
    answer:
      'Starter plans include email support. Professional plans get priority email and chat. Enterprise plans include a dedicated account manager and 24/7 phone support.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'All data is encrypted at rest and in transit. We use AWS cloud infrastructure with servers in India and are compliant with the DPDP Act 2023.',
  },
  {
    question: 'Can I import data from my existing system?',
    answer:
      'Yes, GlobusLMS supports import from Excel, CSV, and most popular school management systems. Our team assists with data migration during onboarding.',
  },
  {
    question: 'Do you support multi-branch schools?',
    answer:
      'Yes! The Enterprise plan includes multi-branch support with consolidated dashboards, centralized user management, and branch-level reporting.',
  },
];

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('academic');
  const activeCategory = featureCategories.find((c) => c.key === activeTab)!;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDM2YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMTgtMThjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span>77 Modules &middot; 128 Database Models &middot; 10 User Roles</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              India&apos;s Most Complete{' '}
              <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                School Management System
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Academics, admissions, timetables, fees, communication,
              transport, LMS, and analytics -- everything your school needs,
              under one roof.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold text-base hover:bg-blue-50 transition-all shadow-lg shadow-black/10"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-base border border-white/20 hover:bg-white/20 transition-all"
              >
                Watch Demo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-4 text-sm text-blue-200/70">
              30-day free trial &middot; No credit card required &middot; Setup in minutes
            </p>
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

      {/* ── Trusted By ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-10">
            Trusted by schools across India
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium mb-4">
                <Frown className="h-4 w-4" />
                The Problem
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Managing a school shouldn&apos;t be this hard
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  'Scattered data across Excel sheets, registers, and WhatsApp groups',
                  'Hours wasted on manual timetabling and attendance tracking',
                  'Fee defaults going unnoticed until end of term',
                  'No visibility into teaching progress or classroom activity',
                  'Parents left in the dark about their child\'s performance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-medium mb-4">
                <CheckCircle2 className="h-4 w-4" />
                The Solution
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                GlobusLMS brings everything under one roof
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  'One unified platform for all 77 modules -- zero data silos',
                  'Auto-generate timetables in seconds with AI-powered scheduling',
                  'Real-time fee tracking with automated reminders via WhatsApp',
                  'Live teaching tracker shows who is teaching what, right now',
                  'Parent portal with grades, attendance, and instant messaging',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights (6 cards) ── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              Platform Highlights
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Six Pillars of a Complete School Platform
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              From classroom management to financial reporting, GlobusLMS
              covers every aspect of running a modern school.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlightCards.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Explore all 77 features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Full Feature Grid (Tabbed) ── */}
      <section id="all-features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <LayoutGrid className="h-4 w-4" />
              All 77 Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Everything Your School Needs
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Browse features by category. Every feature is built-in -- no
              add-ons, no third-party plugins.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {featureCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === cat.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === cat.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {cat.features.length}
                </span>
              </button>
            ))}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeCategory.features.map((feature) => (
              <div
                key={feature.name}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-blue-600" />
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
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <Timer className="h-4 w-4" />
              Quick Start
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Go Live in 4 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              From sign-up to a fully operational school platform in under a day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, idx) => (
              <div key={step.step} className="relative text-center">
                {idx < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-blue-200" />
                )}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 mb-6">
                  <step.icon className="h-8 w-8 text-blue-600" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role-Based Access ── */}
      <section id="roles" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              10 User Roles
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              The Right Access for Every Stakeholder
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Each role sees exactly what they need -- nothing more, nothing less.
              Granular permissions ensure data security and focused workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {roles.map((role) => (
              <div
                key={role.name}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-3">
                  <role.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">{role.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <CreditCard className="h-4 w-4" />
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Plans That Grow With Your School
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              All plans include a 30-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/25 md:scale-105 border-0'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wider shadow-lg">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={`text-xl font-bold ${
                      plan.popular ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      plan.popular ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span
                    className={`text-4xl font-extrabold ${
                      plan.popular ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    &#8377;{plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.popular ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'text-blue-200' : 'text-blue-600'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.popular ? 'text-blue-50' : 'text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Compare all plans in detail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Loved by School Leaders Across India
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Hear from principals and administrators who have transformed their
              schools with GlobusLMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <blockquote className="text-gray-600 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.role}, {t.school}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left">
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-5 -mt-1">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Ready to Modernize Your School?
          </h2>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
            Join 100+ schools already using GlobusLMS. Start your 30-day free
            trial today and experience the difference.
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
              href="/login"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-lg border border-white/20 hover:bg-white/20 transition-all"
            >
              Book a Demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200/70">
            No credit card required &middot; Free onboarding support &middot; Cancel anytime
          </p>
        </div>
      </section>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, School, ClipboardCheck, UserPlus, BookOpen,
  FileText, PenTool, HelpCircle, CreditCard, CheckCircle, AlertTriangle,
  Shield, Bus, Palette, Calendar, Bell, TrendingUp,
  CalendarDays, FileEdit, ShieldCheck,
  ClipboardList, DollarSign, Siren, Zap, BarChart3,
  Printer, BookOpenCheck, Upload, Activity,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendance: number;
  totalEnquiries: number;
  totalSubjects: number;
  totalLmsContent: number;
  totalAssessments: number;
  totalQuestions: number;
  totalFeeHeads: number;
  totalPayments: number;
  totalDefaulters: number;
  totalIncidents: number;
  activeRedFlags: number;
  totalVehicles: number;
  totalRoutes: number;
  totalHobbies: number;
  totalHobbyEnrollments: number;
  totalPtmSlots: number;
  pendingNotifications: number;
  totalCourseModules: number;
  totalDiscussionForums: number;
  totalBadges: number;
  totalLearningPaths: number;
  totalRubrics: number;
  totalLiveClasses: number;
  totalAssignments: number;
  totalLibraryBooks: number;
}

interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject?: { name: string };
  class?: { name: string; section: string };
  teacher?: { firstName: string; lastName: string };
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  subject?: { name: string };
  class?: { name: string; section: string };
}

interface AttendanceSummary {
  present: number;
  absent: number;
  total: number;
}

interface WardInfo {
  id: string;
  firstName: string;
  lastName: string;
  class?: { name: string; section: string };
  attendance?: AttendanceSummary;
  assignments?: Assignment[];
}

// ─── Helpers ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  color: string;
  bg: string;
}) {
  const content = (
    <div className={`bg-card rounded-lg border p-4 flex items-center gap-4 ${href ? 'hover:shadow-md hover:border-primary/30 transition-all cursor-pointer' : ''}`}>
      <div className={`p-3 rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

// ─── Role-specific views ──────────────────────────────────────────

function ParentDashboard() {
  const [wards, setWards] = useState<WardInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWards() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent-portal/wards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWards(Array.isArray(data) ? data : [data]);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchWards();
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading ward overview...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Parent Dashboard</h1>
      {wards.length === 0 ? (
        <p className="text-muted-foreground">No ward information available.</p>
      ) : (
        <div className="space-y-6">
          {wards.map((ward) => (
            <div key={ward.id} className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">
                {ward.firstName} {ward.lastName}
                {ward.class && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    — Class {ward.class.name} {ward.class.section}
                  </span>
                )}
              </h2>
              {ward.attendance && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <StatCard label="Present" value={ward.attendance.present} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
                  <StatCard label="Absent" value={ward.attendance.absent} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
                  <StatCard label="Total Days" value={ward.attendance.total} icon={CalendarDays} color="text-blue-600" bg="bg-blue-50" />
                </div>
              )}
              {ward.assignments && ward.assignments.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 text-sm text-muted-foreground">Upcoming Assignments</h3>
                  <ul className="space-y-2">
                    {ward.assignments.slice(0, 5).map((a) => (
                      <li key={a.id} className="flex justify-between text-sm border rounded px-3 py-2">
                        <span>{a.title} {a.subject ? `— ${a.subject.name}` : ''}</span>
                        <span className="text-muted-foreground">{new Date(a.dueDate).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentDashboard() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [ttRes, asRes, atRes] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/timetable/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/my/summary`, { headers }),
        ]);

        if (ttRes.status === 'fulfilled' && ttRes.value.ok)
          setTimetable(await ttRes.value.json());
        if (asRes.status === 'fulfilled' && asRes.value.ok)
          setAssignments(await asRes.value.json());
        if (atRes.status === 'fulfilled' && atRes.value.ok)
          setAttendance(await atRes.value.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading your dashboard...</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay() - 1] || '';
  const todayClasses = timetable.filter((t) => t.day === today);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

      {/* Attendance summary */}
      {attendance && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Attendance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Present" value={attendance.present} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
            <StatCard label="Absent" value={attendance.absent} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
            <StatCard label="Total Days" value={attendance.total} icon={CalendarDays} color="text-blue-600" bg="bg-blue-50" />
          </div>
        </div>
      )}

      {/* Today's timetable */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
          Today&apos;s Classes {today ? `(${today})` : ''}
        </h2>
        {todayClasses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todayClasses.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 bg-card rounded-lg border px-4 py-3 text-sm">
                <span className="text-muted-foreground w-32">{entry.startTime} – {entry.endTime}</span>
                <span className="font-medium">{entry.subject?.name || '—'}</span>
                {entry.teacher && (
                  <span className="text-muted-foreground ml-auto">
                    {entry.teacher.firstName} {entry.teacher.lastName}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming assignments */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Upcoming Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No assignments pending.</p>
        ) : (
          <div className="space-y-2">
            {assignments.slice(0, 8).map((a) => (
              <div key={a.id} className="flex justify-between bg-card rounded-lg border px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{a.title}</span>
                  {a.subject && <span className="ml-2 text-muted-foreground">{a.subject.name}</span>}
                </div>
                <span className="text-muted-foreground">{new Date(a.dueDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<{ markedToday: number; total: number } | null>(null);
  const [compliance, setCompliance] = useState<{ pending: number; approved: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [ttRes, asRes, atRes, cRes] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/timetable/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/my/summary`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/my/summary`, { headers }),
        ]);

        if (ttRes.status === 'fulfilled' && ttRes.value.ok)
          setTimetable(await ttRes.value.json());
        if (asRes.status === 'fulfilled' && asRes.value.ok)
          setAssignments(await asRes.value.json());
        if (atRes.status === 'fulfilled' && atRes.value.ok)
          setAttendance(await atRes.value.json());
        if (cRes.status === 'fulfilled' && cRes.value.ok)
          setCompliance(await cRes.value.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading teacher dashboard...</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay() - 1] || '';
  const todayClasses = timetable.filter((t) => t.day === today);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {attendance && (
          <>
            <StatCard label="Attendance Marked Today" value={attendance.markedToday ?? 0} icon={ClipboardCheck} color="text-green-600" bg="bg-green-50" />
            <StatCard label="Total Students" value={attendance.total ?? 0} icon={GraduationCap} color="text-blue-600" bg="bg-blue-50" />
          </>
        )}
        {compliance && (
          <>
            <StatCard label="Pending Compliance" value={compliance.pending ?? 0} icon={ShieldCheck} color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="Approved Compliance" value={compliance.approved ?? 0} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
          </>
        )}
        <StatCard label="My Assignments" value={assignments.length} icon={FileEdit} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="My Classes" value={new Set(timetable.map((t) => t.class?.name || '')).size} icon={School} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Today's schedule */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
          Today&apos;s Schedule {today ? `(${today})` : ''}
        </h2>
        {todayClasses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todayClasses.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 bg-card rounded-lg border px-4 py-3 text-sm">
                <span className="text-muted-foreground w-32">{entry.startTime} – {entry.endTime}</span>
                <span className="font-medium">{entry.subject?.name || '—'}</span>
                {entry.class && (
                  <span className="text-muted-foreground">
                    Class {entry.class.name} {entry.class.section}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent assignments to grade */}
      {assignments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Recent Assignments</h2>
          <div className="space-y-2">
            {assignments.slice(0, 5).map((a) => (
              <div key={a.id} className="flex justify-between bg-card rounded-lg border px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{a.title}</span>
                  {a.class && (
                    <span className="ml-2 text-muted-foreground">
                      Class {a.class.name} {a.class.section}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground">{new Date(a.dueDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; email?: string };
}

const QUICK_ACTIONS = [
  { label: 'Mark Attendance', href: '/attendance', icon: ClipboardCheck, bg: 'bg-blue-50', color: 'text-blue-600' },
  { label: 'Add Student', href: '/students?action=add', icon: UserPlus, bg: 'bg-green-50', color: 'text-green-600' },
  { label: 'New Enquiry', href: '/admission', icon: BookOpenCheck, bg: 'bg-cyan-50', color: 'text-cyan-600' },
  { label: 'Record Payment', href: '/fees', icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  { label: 'Create Assessment', href: '/assessments', icon: PenTool, bg: 'bg-violet-50', color: 'text-violet-600' },
  { label: 'Upload Content', href: '/lms', icon: Upload, bg: 'bg-purple-50', color: 'text-purple-600' },
  { label: 'Log Incident', href: '/discipline', icon: Siren, bg: 'bg-red-50', color: 'text-red-600' },
  { label: 'Check Defaulters', href: '/fee-automation', icon: Zap, bg: 'bg-orange-50', color: 'text-orange-600' },
  { label: 'View Analytics', href: '/analytics', icon: BarChart3, bg: 'bg-indigo-50', color: 'text-indigo-600' },
  { label: 'Generate Report', href: '/reports', icon: Printer, bg: 'bg-teal-50', color: 'text-teal-600' },
];

function QuickActionsWidget() {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:shadow-sm transition-shadow bg-card"
          >
            <div className={`p-3 rounded-lg ${action.bg}`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentActivityWidget() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/v1/audit/logs?limit=10', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(Array.isArray(data) ? data : (data.logs || []));
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-muted-foreground">Recent Activity</h2>
      </div>
      <div className="bg-card rounded-lg border divide-y">
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">Loading activity...</div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">No recent activity.</div>
        ) : (
          logs.map((log) => {
            const name = log.user
              ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email || 'System'
              : 'System';
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                  <Activity className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{name}</span>
                    {' — '}
                    <span className="text-muted-foreground">{log.action} {log.entity}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { setError('No auth token. Please log in again.'); return; }
        const res = await fetch('/api/v1/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setStats(await res.json());
        } else if (res.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        } else {
          setError(`API returned ${res.status}`);
        }
      } catch (e: any) {
        setError(`Failed to load: ${e?.message || 'unknown error'}`);
      }
    }
    fetchStats();
  }, []);

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!stats) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  const sections = [
    {
      title: 'Foundation',
      cards: [
        { label: 'Students', value: stats.totalStudents, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', href: '/students' },
        { label: 'Teachers', value: stats.totalTeachers, icon: Users, color: 'text-green-600', bg: 'bg-green-50', href: '/staff-directory' },
        { label: 'Classes & Sections', value: stats.totalClasses, icon: School, color: 'text-purple-600', bg: 'bg-purple-50', href: '/classes' },
        { label: "Today's Attendance", value: stats.todayAttendance, icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50', href: '/attendance' },
        { label: 'Enquiries', value: stats.totalEnquiries, icon: UserPlus, color: 'text-cyan-600', bg: 'bg-cyan-50', href: '/admission' },
        { label: 'Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/syllabus' },
      ],
    },
    {
      title: 'Academic Core',
      cards: [
        { label: 'LMS Content', value: stats.totalLmsContent, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', href: '/lms' },
        { label: 'Assessments', value: stats.totalAssessments, icon: PenTool, color: 'text-red-600', bg: 'bg-red-50', href: '/assessments' },
        { label: 'Questions', value: stats.totalQuestions, icon: HelpCircle, color: 'text-violet-600', bg: 'bg-violet-50', href: '/question-bank' },
      ],
    },
    {
      title: 'Operations',
      cards: [
        { label: 'Fee Heads', value: stats.totalFeeHeads, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/fees' },
        { label: 'Payments Made', value: stats.totalPayments, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', href: '/fees' },
        { label: 'Defaulters', value: stats.totalDefaulters, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', href: '/fee-automation' },
        { label: 'Incidents', value: stats.totalIncidents, icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50', href: '/discipline' },
        { label: 'Red Flags', value: stats.activeRedFlags, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', href: '/discipline' },
        { label: 'Buses', value: stats.totalVehicles, icon: Bus, color: 'text-blue-600', bg: 'bg-blue-50', href: '/bus' },
        { label: 'Routes', value: stats.totalRoutes, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50', href: '/bus' },
      ],
    },
    {
      title: 'Enrichment',
      cards: [
        { label: 'Hobbies', value: stats.totalHobbies, icon: Palette, color: 'text-pink-600', bg: 'bg-pink-50', href: '/hobbies' },
        { label: 'Hobby Enrollments', value: stats.totalHobbyEnrollments, icon: GraduationCap, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', href: '/hobbies' },
        { label: 'PTM Slots', value: stats.totalPtmSlots, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', href: '/communication' },
        { label: 'Pending Notifications', value: stats.pendingNotifications, icon: Bell, color: 'text-sky-600', bg: 'bg-sky-50', href: '/notifications' },
      ],
    },
    {
      title: 'LMS & Learning',
      cards: [
        { label: 'Course Modules', value: stats.totalCourseModules, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/course-modules' },
        { label: 'Assignments', value: stats.totalAssignments, icon: FileEdit, color: 'text-violet-600', bg: 'bg-violet-50', href: '/assignments' },
        { label: 'Discussion Forums', value: stats.totalDiscussionForums, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', href: '/discussions' },
        { label: 'Learning Paths', value: stats.totalLearningPaths, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/learning-paths' },
        { label: 'Rubrics', value: stats.totalRubrics, icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50', href: '/rubrics' },
        { label: 'Live Classes', value: stats.totalLiveClasses, icon: CalendarDays, color: 'text-red-600', bg: 'bg-red-50', href: '/live-classes' },
        { label: 'Badges', value: stats.totalBadges, icon: Shield, color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/gamification' },
        { label: 'Library Books', value: stats.totalLibraryBooks, icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50', href: '/library' },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {sections.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{section.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {section.cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </div>
      ))}
      <QuickActionsWidget />
      <RecentActivityWidget />
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────

const TEACHER_ROLES = ['CLASS_TEACHER', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'IT_ADMIN', 'DIRECTOR'];

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole: string = user.role || '';
    setRole(userRole);

    // Redirect parent to parent portal if it exists, otherwise fall through to inline view
    if (userRole === 'PARENT') {
      // We render inline — no redirect needed; handled by ParentDashboard component
    }
  }, [router]);

  if (role === null) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (role === 'PARENT') return <ParentDashboard />;
  if (role === 'STUDENT') return <StudentDashboard />;
  if (TEACHER_ROLES.includes(role)) return <TeacherDashboard />;
  if (ADMIN_ROLES.includes(role) || role === 'ACCOUNTANT' || role === 'TRANSPORT_MANAGER' || role === 'HOBBY_COORDINATOR') {
    return <AdminDashboard />;
  }

  // Default fallback
  return <AdminDashboard />;
}

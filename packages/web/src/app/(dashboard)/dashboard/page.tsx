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
  Clock, Award, Target, BookMarked, Star, Trophy,
  AlertCircle, ArrowUpRight, ArrowDownRight,
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

interface AdminStats {
  kpi: {
    totalStudents: number;
    studentTrend: number;
    totalTeachers: number;
    todayAttendancePercent: number;
    feeCollectedThisMonth: number;
  };
  attendanceTrend: { date: string; percentage: number }[];
  feeSummary: {
    collected: number;
    pending: number;
    defaulterCount: number;
  };
  alerts: {
    id: string;
    type: 'INCIDENT' | 'GRIEVANCE';
    title: string;
    severity: string;
    status: string;
    createdAt: string;
  }[];
  quickStats: {
    totalSections: number;
    totalSubjects: number;
    totalLibraryBooks: number;
    totalHobbies: number;
    upcomingEvents: number;
  };
  teacherCompliance: {
    totalPlans: number;
    delivered: number;
    percent: number;
  };
}

interface TeacherStats {
  todaySchedule: {
    id: string;
    startTime: string;
    endTime: string;
    subject: string;
    className: string;
    section: string;
    room: string;
    type: string;
  }[];
  attendanceStatus: { marked: number; total: number };
  pendingTasks: {
    assignmentsToGrade: number;
    assessmentsToReview: number;
    totalAssignments: number;
  };
  subjectPerformance: { subject: string; average: number }[];
  recentSubmissions: {
    id: string;
    assignmentTitle: string;
    subject: string;
    studentId: string;
    submittedAt: string;
    status: string;
  }[];
  teachingProgress: {
    totalPlans: number;
    delivered: number;
    percent: number;
  };
}

interface StudentStats {
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    percent: number;
  };
  subjectGrades: { subject: string; percentage: number; assessments: number }[];
  deadlines: {
    id: string;
    title: string;
    type: 'ASSIGNMENT' | 'ASSESSMENT';
    subject: string;
    dueDate: string;
  }[];
  achievements: {
    badgeCount: number;
    totalPoints: number;
    rank: number | null;
    level: number;
  };
  todaySchedule: {
    id: string;
    startTime: string;
    endTime: string;
    subject: string;
    room: string;
    type: string;
  }[];
  learningProgress: {
    moduleItems: number;
    completed: number;
    percent: number;
    paths: {
      title: string;
      completedSteps: number;
      totalSteps: number;
      status: string;
    }[];
  };
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

function apiUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}${path}`;
}

async function fetchApi<T>(path: string): Promise<T | null> {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(apiUrl(path), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
  } catch {
    // silently fail
  }
  return null;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  href,
  trend,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  color: string;
  bg: string;
  trend?: number;
}) {
  const content = (
    <div className={`bg-card rounded-lg border p-4 flex items-center gap-4 ${href ? 'hover:shadow-md hover:border-primary/30 transition-all cursor-pointer' : ''}`}>
      <div className={`p-3 rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {trend !== undefined && trend !== 0 && (
            <span className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function ProgressBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    MINOR: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-yellow-100 text-yellow-700',
    MODERATE: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-orange-100 text-orange-700',
    SERIOUS: 'bg-red-100 text-red-700',
    HIGH: 'bg-red-100 text-red-700',
    CRITICAL: 'bg-red-200 text-red-800',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[severity] || 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  );
}

function daysUntil(dateStr: string): string {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days`;
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
  const [enhanced, setEnhanced] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [ttRes, asRes, atRes, enhRes] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/timetable/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/my/summary`, { headers }),
          fetch(apiUrl('/dashboard/student-stats'), { headers }),
        ]);

        if (ttRes.status === 'fulfilled' && ttRes.value.ok)
          setTimetable(await ttRes.value.json());
        if (asRes.status === 'fulfilled' && asRes.value.ok)
          setAssignments(await asRes.value.json());
        if (atRes.status === 'fulfilled' && atRes.value.ok)
          setAttendance(await atRes.value.json());
        if (enhRes.status === 'fulfilled' && enhRes.value.ok)
          setEnhanced(await enhRes.value.json());
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

  const attendancePercent = enhanced?.attendance?.percent ?? (
    attendance && attendance.total > 0
      ? Math.round((attendance.present / attendance.total) * 100)
      : 0
  );
  const attendanceColor = attendancePercent >= 75 ? 'text-green-600' : attendancePercent >= 50 ? 'text-yellow-600' : 'text-red-600';
  const attendanceBg = attendancePercent >= 75 ? 'bg-green-500' : attendancePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

      {/* My Attendance - Enhanced */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">My Attendance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <StatCard label="Present" value={enhanced?.attendance?.present ?? attendance?.present ?? 0} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Absent" value={enhanced?.attendance?.absent ?? attendance?.absent ?? 0} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
          <StatCard label="Late" value={enhanced?.attendance?.late ?? 0} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
          <div className="bg-card rounded-lg border p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${attendancePercent >= 75 ? 'bg-green-50' : attendancePercent >= 50 ? 'bg-yellow-50' : 'bg-red-50'}`}>
              <Target className={`h-5 w-5 ${attendanceColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Attendance %</p>
              <p className={`text-2xl font-bold ${attendanceColor}`}>{attendancePercent}%</p>
              <ProgressBar value={attendancePercent} max={100} color={attendanceBg} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview - Subject grades as horizontal bars */}
      {enhanced?.subjectGrades && enhanced.subjectGrades.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Performance Overview</h2>
          <div className="bg-card rounded-lg border p-4 space-y-3">
            {enhanced.subjectGrades.map((sg) => (
              <div key={sg.subject} className="flex items-center gap-3">
                <span className="text-sm font-medium w-28 truncate" title={sg.subject}>{sg.subject}</span>
                <div className="flex-1 bg-muted rounded-full h-5 relative">
                  <div
                    className={`h-5 rounded-full ${sg.percentage >= 75 ? 'bg-green-500' : sg.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, sg.percentage)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                    {sg.percentage}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right">{sg.assessments} tests</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {enhanced?.deadlines && enhanced.deadlines.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Upcoming Deadlines</h2>
          <div className="space-y-2">
            {enhanced.deadlines.map((d) => {
              const countdown = daysUntil(d.dueDate);
              const isUrgent = countdown === 'Today' || countdown === 'Tomorrow' || countdown === 'Overdue';
              return (
                <div key={d.id} className="flex items-center justify-between bg-card rounded-lg border px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${d.type === 'ASSIGNMENT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {d.type === 'ASSIGNMENT' ? 'HW' : 'EXAM'}
                    </span>
                    <div>
                      <span className="font-medium">{d.title}</span>
                      <span className="ml-2 text-muted-foreground">{d.subject}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{new Date(d.dueDate).toLocaleDateString()}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {countdown}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Achievements */}
      {enhanced?.achievements && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">My Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Badges" value={enhanced.achievements.badgeCount} icon={Award} color="text-yellow-600" bg="bg-yellow-50" />
            <StatCard label="Total Points" value={enhanced.achievements.totalPoints} icon={Star} color="text-amber-600" bg="bg-amber-50" />
            <StatCard label="Level" value={enhanced.achievements.level} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Rank" value={enhanced.achievements.rank ?? '—'} icon={Trophy} color="text-purple-600" bg="bg-purple-50" />
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
          Today&apos;s Schedule {today ? `(${today})` : ''}
        </h2>
        {(enhanced?.todaySchedule && enhanced.todaySchedule.length > 0) ? (
          <div className="space-y-2">
            {enhanced.todaySchedule.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 bg-card rounded-lg border px-4 py-3 text-sm">
                <span className="text-muted-foreground w-32">{entry.startTime} – {entry.endTime}</span>
                <span className="font-medium">{entry.subject}</span>
                {entry.room && <span className="text-muted-foreground ml-auto">Room: {entry.room}</span>}
                <span className={`text-xs px-2 py-0.5 rounded ${entry.type === 'BREAK' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                  {entry.type}
                </span>
              </div>
            ))}
          </div>
        ) : todayClasses.length > 0 ? (
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
        ) : (
          <p className="text-muted-foreground text-sm">No classes scheduled for today.</p>
        )}
      </div>

      {/* Learning Progress */}
      {enhanced?.learningProgress && (enhanced.learningProgress.moduleItems > 0 || enhanced.learningProgress.paths.length > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Learning Progress</h2>
          <div className="bg-card rounded-lg border p-4 space-y-4">
            {enhanced.learningProgress.moduleItems > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Course Modules</span>
                  <span className="text-muted-foreground">{enhanced.learningProgress.completed}/{enhanced.learningProgress.moduleItems} completed</span>
                </div>
                <ProgressBar value={enhanced.learningProgress.completed} max={enhanced.learningProgress.moduleItems} color="bg-indigo-500" />
              </div>
            )}
            {enhanced.learningProgress.paths.map((path) => (
              <div key={path.title}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{path.title}</span>
                  <span className="text-muted-foreground">{path.completedSteps}/{path.totalSteps} steps</span>
                </div>
                <ProgressBar value={path.completedSteps} max={path.totalSteps} color="bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming assignments (original, as fallback) */}
      {(!enhanced?.deadlines || enhanced.deadlines.length === 0) && assignments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Upcoming Assignments</h2>
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
        </div>
      )}
    </div>
  );
}

function TeacherDashboard() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<{ markedToday: number; total: number } | null>(null);
  const [compliance, setCompliance] = useState<{ pending: number; approved: number } | null>(null);
  const [enhanced, setEnhanced] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [ttRes, asRes, atRes, cRes, enhRes] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/timetable/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/my/summary`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/my/summary`, { headers }),
          fetch(apiUrl('/dashboard/teacher-stats'), { headers }),
        ]);

        if (ttRes.status === 'fulfilled' && ttRes.value.ok)
          setTimetable(await ttRes.value.json());
        if (asRes.status === 'fulfilled' && asRes.value.ok)
          setAssignments(await asRes.value.json());
        if (atRes.status === 'fulfilled' && atRes.value.ok)
          setAttendance(await atRes.value.json());
        if (cRes.status === 'fulfilled' && cRes.value.ok)
          setCompliance(await cRes.value.json());
        if (enhRes.status === 'fulfilled' && enhRes.value.ok)
          setEnhanced(await enhRes.value.json());
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

      {/* Quick stats row */}
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
        <StatCard label="My Assignments" value={enhanced?.pendingTasks?.totalAssignments ?? assignments.length} icon={FileEdit} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="My Classes" value={new Set(timetable.map((t) => t.class?.name || '')).size} icon={School} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Attendance Status - Enhanced */}
      {enhanced?.attendanceStatus && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Attendance Status</h2>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Marked for {enhanced.attendanceStatus.marked}/{enhanced.attendanceStatus.total} classes today
              </span>
              <span className={`text-sm font-semibold ${enhanced.attendanceStatus.marked >= enhanced.attendanceStatus.total ? 'text-green-600' : 'text-orange-600'}`}>
                {enhanced.attendanceStatus.total > 0
                  ? Math.round((enhanced.attendanceStatus.marked / enhanced.attendanceStatus.total) * 100)
                  : 0}%
              </span>
            </div>
            <ProgressBar
              value={enhanced.attendanceStatus.marked}
              max={enhanced.attendanceStatus.total}
              color={enhanced.attendanceStatus.marked >= enhanced.attendanceStatus.total ? 'bg-green-500' : 'bg-orange-500'}
            />
          </div>
        </div>
      )}

      {/* My Classes Today - Enhanced */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
          My Classes Today {today ? `(${today})` : ''}
        </h2>
        {(enhanced?.todaySchedule && enhanced.todaySchedule.length > 0) ? (
          <div className="space-y-2">
            {enhanced.todaySchedule.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 bg-card rounded-lg border px-4 py-3 text-sm">
                <span className="text-muted-foreground w-32">{entry.startTime} – {entry.endTime}</span>
                <span className="font-medium">{entry.subject}</span>
                <span className="text-muted-foreground">
                  Class {entry.className} {entry.section}
                </span>
                {entry.room && <span className="text-muted-foreground ml-auto">Room: {entry.room}</span>}
                <span className={`text-xs px-2 py-0.5 rounded ${entry.type === 'BREAK' ? 'bg-orange-100 text-orange-700' : entry.type === 'LAB' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {entry.type}
                </span>
              </div>
            ))}
          </div>
        ) : todayClasses.length > 0 ? (
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
        ) : (
          <p className="text-muted-foreground text-sm">No classes scheduled for today.</p>
        )}
      </div>

      {/* Pending Tasks */}
      {enhanced?.pendingTasks && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Pending Tasks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Assignments to Grade" value={enhanced.pendingTasks.assignmentsToGrade} icon={FileEdit} color="text-orange-600" bg="bg-orange-50" href="/assignments" />
            <StatCard label="Assessments to Review" value={enhanced.pendingTasks.assessmentsToReview} icon={ClipboardList} color="text-red-600" bg="bg-red-50" href="/assessments" />
            <StatCard label="Total Assignments" value={enhanced.pendingTasks.totalAssignments} icon={BookOpen} color="text-blue-600" bg="bg-blue-50" href="/assignments" />
          </div>
        </div>
      )}

      {/* Student Performance by Subject */}
      {enhanced?.subjectPerformance && enhanced.subjectPerformance.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">My Students Performance</h2>
          <div className="bg-card rounded-lg border p-4 space-y-3">
            {enhanced.subjectPerformance.map((sp) => (
              <div key={sp.subject} className="flex items-center gap-3">
                <span className="text-sm font-medium w-28 truncate" title={sp.subject}>{sp.subject}</span>
                <div className="flex-1 bg-muted rounded-full h-5 relative">
                  <div
                    className={`h-5 rounded-full ${sp.average >= 75 ? 'bg-green-500' : sp.average >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, sp.average)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                    {sp.average}% avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Progress */}
      {enhanced?.teachingProgress && enhanced.teachingProgress.totalPlans > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Teaching Progress</h2>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Lesson Plans: {enhanced.teachingProgress.delivered}/{enhanced.teachingProgress.totalPlans} delivered
              </span>
              <span className={`text-sm font-semibold ${enhanced.teachingProgress.percent >= 80 ? 'text-green-600' : enhanced.teachingProgress.percent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {enhanced.teachingProgress.percent}%
              </span>
            </div>
            <ProgressBar
              value={enhanced.teachingProgress.delivered}
              max={enhanced.teachingProgress.totalPlans}
              color={enhanced.teachingProgress.percent >= 80 ? 'bg-green-500' : enhanced.teachingProgress.percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
            />
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      {enhanced?.recentSubmissions && enhanced.recentSubmissions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Recent Submissions (Needs Grading)</h2>
          <div className="space-y-2">
            {enhanced.recentSubmissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-card rounded-lg border px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{s.assignmentTitle}</span>
                  <span className="ml-2 text-muted-foreground">{s.subject}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{s.status}</span>
                  <span className="text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original recent assignments fallback */}
      {(!enhanced?.recentSubmissions || enhanced.recentSubmissions.length === 0) && assignments.length > 0 && (
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
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { setError('No auth token. Please log in again.'); return; }
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, adminRes] = await Promise.allSettled([
          fetch('/api/v1/dashboard/stats', { headers }),
          fetch(apiUrl('/dashboard/admin-stats'), { headers }),
        ]);

        if (statsRes.status === 'fulfilled') {
          if (statsRes.value.ok) {
            setStats(await statsRes.value.json());
          } else if (statsRes.value.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          } else {
            setError(`API returned ${statsRes.value.status}`);
          }
        }

        if (adminRes.status === 'fulfilled' && adminRes.value.ok) {
          setAdminStats(await adminRes.value.json());
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* KPI Row */}
      {adminStats?.kpi && (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Students"
              value={adminStats.kpi.totalStudents}
              icon={GraduationCap}
              color="text-blue-600"
              bg="bg-blue-50"
              href="/students"
              trend={adminStats.kpi.studentTrend}
            />
            <StatCard
              label="Total Teachers"
              value={adminStats.kpi.totalTeachers}
              icon={Users}
              color="text-green-600"
              bg="bg-green-50"
              href="/staff-directory"
            />
            <div className="bg-card rounded-lg border p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${adminStats.kpi.todayAttendancePercent >= 75 ? 'bg-green-50' : 'bg-orange-50'}`}>
                <ClipboardCheck className={`h-5 w-5 ${adminStats.kpi.todayAttendancePercent >= 75 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Today&apos;s Attendance</p>
                <p className="text-2xl font-bold">{adminStats.kpi.todayAttendancePercent}%</p>
                <ProgressBar
                  value={adminStats.kpi.todayAttendancePercent}
                  max={100}
                  color={adminStats.kpi.todayAttendancePercent >= 75 ? 'bg-green-500' : 'bg-orange-500'}
                />
              </div>
            </div>
            <StatCard
              label="Fee Collection (Month)"
              value={`₹${adminStats.kpi.feeCollectedThisMonth.toLocaleString('en-IN')}`}
              icon={CreditCard}
              color="text-emerald-600"
              bg="bg-emerald-50"
              href="/fees"
            />
          </div>
        </div>
      )}

      {/* Attendance Trend Chart + Fee Collection Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Trend Bar Chart */}
        {adminStats?.attendanceTrend && (
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">Attendance Trend (Last 7 Days)</h2>
            <div className="flex items-end gap-2 h-40">
              {adminStats.attendanceTrend.map((day) => {
                const barColor = day.percentage >= 75 ? 'bg-green-500' : day.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                const dateLabel = new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' });
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">{day.percentage}%</span>
                    <div className="w-full bg-muted rounded-t relative" style={{ height: '120px' }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t ${barColor} transition-all`}
                        style={{ height: `${Math.max(2, (day.percentage / 100) * 120)}px` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{dateLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fee Collection Summary */}
        {adminStats?.feeSummary && (
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">Fee Collection Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Collected</p>
                    <p className="text-lg font-bold text-green-600">₹{adminStats.feeSummary.collected.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold text-red-600">₹{adminStats.feeSummary.pending.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
              {/* Visual ratio bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Collection Ratio</span>
                  <span>{adminStats.feeSummary.collected + adminStats.feeSummary.pending > 0
                    ? Math.round((adminStats.feeSummary.collected / (adminStats.feeSummary.collected + adminStats.feeSummary.pending)) * 100)
                    : 0}%</span>
                </div>
                <div className="w-full h-3 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-green-500 rounded-full"
                    style={{
                      width: `${adminStats.feeSummary.collected + adminStats.feeSummary.pending > 0
                        ? (adminStats.feeSummary.collected / (adminStats.feeSummary.collected + adminStats.feeSummary.pending)) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">
                  <span className="font-semibold text-orange-600">{adminStats.feeSummary.defaulterCount}</span>
                  <span className="text-muted-foreground"> active defaulters</span>
                </span>
                <Link href="/fee-automation" className="ml-auto text-xs text-primary hover:underline">View all</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Alerts + Teacher Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Alerts */}
        {adminStats?.alerts && adminStats.alerts.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Recent Alerts</h2>
            <div className="space-y-2">
              {adminStats.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 border rounded-lg px-3 py-2">
                  <div className={`p-1.5 rounded-full mt-0.5 ${alert.type === 'INCIDENT' ? 'bg-red-100' : 'bg-orange-100'}`}>
                    {alert.type === 'INCIDENT' ? (
                      <Siren className="h-3 w-3 text-red-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{alert.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teacher Compliance */}
        {adminStats?.teacherCompliance && (
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Teacher Compliance</h2>
            <div className="flex items-center gap-6">
              {/* Circular-style indicator using divs */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <div className="w-24 h-24 rounded-full border-8 border-muted" />
                <div
                  className="absolute inset-0 w-24 h-24 rounded-full border-8 border-transparent"
                  style={{
                    borderTopColor: adminStats.teacherCompliance.percent >= 80 ? '#22c55e' : adminStats.teacherCompliance.percent >= 50 ? '#eab308' : '#ef4444',
                    borderRightColor: adminStats.teacherCompliance.percent >= 25 ? (adminStats.teacherCompliance.percent >= 80 ? '#22c55e' : adminStats.teacherCompliance.percent >= 50 ? '#eab308' : '#ef4444') : 'transparent',
                    borderBottomColor: adminStats.teacherCompliance.percent >= 50 ? (adminStats.teacherCompliance.percent >= 80 ? '#22c55e' : '#eab308') : 'transparent',
                    borderLeftColor: adminStats.teacherCompliance.percent >= 75 ? '#22c55e' : 'transparent',
                    transform: `rotate(${(adminStats.teacherCompliance.percent / 100) * 360 - 90}deg)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{adminStats.teacherCompliance.percent}%</span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Lesson Plans</span>
                  <span className="font-medium">{adminStats.teacherCompliance.totalPlans}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivered</span>
                  <span className="font-medium text-green-600">{adminStats.teacherCompliance.delivered}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-orange-600">{adminStats.teacherCompliance.totalPlans - adminStats.teacherCompliance.delivered}</span>
                </div>
                <ProgressBar
                  value={adminStats.teacherCompliance.delivered}
                  max={adminStats.teacherCompliance.totalPlans}
                  color={adminStats.teacherCompliance.percent >= 80 ? 'bg-green-500' : adminStats.teacherCompliance.percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      {adminStats?.quickStats && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Quick Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <StatCard label="Classes" value={stats.totalClasses} icon={School} color="text-purple-600" bg="bg-purple-50" href="/classes" />
            <StatCard label="Sections" value={adminStats.quickStats.totalSections} icon={BookMarked} color="text-indigo-600" bg="bg-indigo-50" href="/classes" />
            <StatCard label="Subjects" value={adminStats.quickStats.totalSubjects} icon={BookOpen} color="text-blue-600" bg="bg-blue-50" href="/syllabus" />
            <StatCard label="Library Books" value={adminStats.quickStats.totalLibraryBooks} icon={BookOpen} color="text-teal-600" bg="bg-teal-50" href="/library" />
            <StatCard label="Active Hobbies" value={adminStats.quickStats.totalHobbies} icon={Palette} color="text-pink-600" bg="bg-pink-50" href="/hobbies" />
            <StatCard label="Upcoming Events" value={adminStats.quickStats.upcomingEvents} icon={Calendar} color="text-amber-600" bg="bg-amber-50" href="/events" />
          </div>
        </div>
      )}

      {/* Original sections (collapsed under an expandable, or just shown below) */}
      <details className="mb-8">
        <summary className="text-lg font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors mb-3">
          Detailed Module Stats
        </summary>
        <div className="space-y-8 mt-4">
          {[
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
          ].map((section) => (
            <div key={section.title}>
              <h3 className="text-base font-semibold mb-3 text-muted-foreground">{section.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {section.cards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

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

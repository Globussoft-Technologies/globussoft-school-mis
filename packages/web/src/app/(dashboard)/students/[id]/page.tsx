'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  Palette,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

interface Guardian {
  id: string;
  relation: string;
  name: string;
  phone: string;
  email?: string;
  occupation?: string;
}

interface Student {
  id: string;
  admissionNo: string;
  rollNo?: number;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  class: { id: string; name: string; grade: number };
  section: { id: string; name: string };
  guardians: Guardian[];
}

interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  excused: number;
  percentage: number;
}

interface Grade {
  id: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  gradeLabel: string;
  subject: { name: string; code: string };
  assessment: { title: string; type: string };
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: string;
  fileUrl?: string;
  uploadedAt?: string;
}

interface HobbyEnrollment {
  id: string;
  hobby: { name: string; category: string };
  status: string;
  enrolledAt: string;
}

type TabId = 'profile' | 'attendance' | 'academics' | 'documents' | 'activities' | 'timeline';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'academics', label: 'Academics', icon: BookOpen },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'activities', label: 'Activities', icon: Palette },
  { id: 'timeline', label: 'Timeline', icon: Activity },
];

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function AttendanceDot({ status }: { status: string }) {
  if (status === 'PRESENT') return <div className="h-3 w-3 rounded-full bg-green-500 title" title="Present" />;
  if (status === 'ABSENT') return <div className="h-3 w-3 rounded-full bg-red-500" title="Absent" />;
  if (status === 'LATE') return <div className="h-3 w-3 rounded-full bg-yellow-400" title="Late" />;
  return <div className="h-3 w-3 rounded-full bg-muted" title="No data" />;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<{ date: string; status: string }[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hobbies, setHobbies] = useState<HobbyEnrollment[]>([]);
  const [timeline, setTimeline] = useState<{ items: any[]; total: number } | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const base = process.env.NEXT_PUBLIC_API_URL;
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  useEffect(() => {
    if (!studentId) return;
    async function loadStudent() {
      setLoading(true);
      setError('');
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${base}/students/${studentId}`, { headers });
        if (!res.ok) throw new Error(`Failed to load student (${res.status})`);
        const data = await res.json();
        setStudent(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load student');
      } finally {
        setLoading(false);
      }
    }
    loadStudent();
  }, [studentId]);

  useEffect(() => {
    if (!studentId || activeTab !== 'attendance') return;
    async function loadAttendance() {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const endDate = new Date().toISOString().split('T')[0];
      const startDate30 = new Date();
      startDate30.setDate(startDate30.getDate() - 30);
      const startDate = startDate30.toISOString().split('T')[0];

      try {
        const [summaryRes, recordsRes] = await Promise.all([
          fetch(`${base}/attendance/student/${studentId}/summary?startDate=${startDate}&endDate=${endDate}`, { headers }),
          fetch(`${base}/attendance/class?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}`, { headers }),
        ]);
        if (summaryRes.ok) setAttendanceSummary(await summaryRes.json());
        if (recordsRes.ok) {
          const recs = await recordsRes.json();
          setAttendanceRecords(Array.isArray(recs) ? recs : []);
        }
      } catch {}
    }
    loadAttendance();
  }, [studentId, activeTab]);

  useEffect(() => {
    if (!studentId || activeTab !== 'academics') return;
    async function loadGrades() {
      const token = getToken();
      try {
        const res = await fetch(`${base}/grading/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setGrades(await res.json());
      } catch {}
    }
    loadGrades();
  }, [studentId, activeTab]);

  useEffect(() => {
    if (!studentId || activeTab !== 'documents') return;
    async function loadDocuments() {
      const token = getToken();
      try {
        const res = await fetch(`${base}/documents?studentId=${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setDocuments(await res.json());
      } catch {}
    }
    loadDocuments();
  }, [studentId, activeTab]);

  useEffect(() => {
    if (!studentId || activeTab !== 'activities') return;
    async function loadHobbies() {
      const token = getToken();
      try {
        const res = await fetch(`${base}/hobby/portfolio/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setHobbies(await res.json());
      } catch {}
    }
    loadHobbies();
  }, [studentId, activeTab]);

  useEffect(() => {
    if (!studentId || activeTab !== 'timeline') return;
    async function loadTimeline() {
      setTimelineLoading(true);
      const token = getToken();
      try {
        const res = await fetch(`${base}/activity-log/student/${studentId}?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setTimeline(await res.json());
      } catch {}
      finally { setTimelineLoading(false); }
    }
    loadTimeline();
  }, [studentId, activeTab]);

  // ─── Subject-wise grade aggregation ───────────────────────────
  const subjectGrades = grades.reduce<Record<string, { name: string; code: string; grades: Grade[] }>>((acc, g) => {
    if (!acc[g.subject.code]) acc[g.subject.code] = { name: g.subject.name, code: g.subject.code, grades: [] };
    acc[g.subject.code].grades.push(g);
    return acc;
  }, {});

  const subjectRows = Object.values(subjectGrades).map((s) => {
    const avg = s.grades.reduce((sum, g) => sum + g.percentage, 0) / s.grades.length;
    const best = s.grades.reduce((b, g) => (g.percentage > b.percentage ? g : b), s.grades[0]);
    return { ...s, avg: Math.round(avg), bestGrade: best?.gradeLabel };
  });

  const overallAvg = subjectRows.length > 0
    ? Math.round(subjectRows.reduce((s, r) => s + r.avg, 0) / subjectRows.length)
    : 0;

  // ─── Build last 30 days calendar data ─────────────────────────
  const calendarDays: { date: string; status: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const rec = attendanceRecords.find((r) => r.date?.startsWith(dateStr));
    calendarDays.push({ date: dateStr, status: rec?.status || '' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading student profile...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-600 font-medium">{error || 'Student not found'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">
            {student.user.firstName} {student.user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {student.admissionNo} · {student.class.name} {student.section.name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/40 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-card shadow font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Profile Tab ──────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo + basic */}
          <div className="bg-card rounded-lg border p-6 flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
              {student.user.firstName.charAt(0)}{student.user.lastName.charAt(0)}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{student.user.firstName} {student.user.lastName}</h2>
              <p className="text-sm text-muted-foreground">{student.admissionNo}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                {student.class.name} · {student.section.name}
              </span>
            </div>
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium truncate max-w-[160px]">{student.user.email}</span>
              </div>
              {student.user.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{student.user.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roll No</span>
                <span className="font-medium">{student.rollNo || '-'}</span>
              </div>
            </div>
          </div>

          {/* Personal details */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Personal Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="font-medium">{formatDate(student.dateOfBirth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium">{student.gender.charAt(0) + student.gender.slice(1).toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blood Group</span>
                <span className="font-medium">{student.bloodGroup || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium">{student.class.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Section</span>
                <span className="font-medium">{student.section.name}</span>
              </div>
              <hr className="my-3" />
              <h4 className="text-xs font-semibold text-muted-foreground">Address</h4>
              {student.addressLine1 ? (
                <p className="text-sm leading-relaxed">
                  {[student.addressLine1, student.addressLine2, student.city, student.state, student.pincode]
                    .filter(Boolean).join(', ')}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">No address on record</p>
              )}
            </div>
          </div>

          {/* Guardians */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Guardians</h3>
            {student.guardians.length === 0 ? (
              <p className="text-muted-foreground text-sm">No guardians on record</p>
            ) : (
              <div className="space-y-4">
                {student.guardians.map((g) => (
                  <div key={g.id} className="p-3 bg-muted/40 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{g.name}</span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        {g.relation.charAt(0) + g.relation.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="text-muted-foreground space-y-0.5">
                      <div>{g.phone}</div>
                      {g.email && <div>{g.email}</div>}
                      {g.occupation && <div>{g.occupation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Attendance Tab ───────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {attendanceSummary && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{attendanceSummary.percentage}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Attendance Rate</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle className="h-6 w-6" />{attendanceSummary.present}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Present</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-700 flex items-center justify-center gap-1">
                    <XCircle className="h-6 w-6" />{attendanceSummary.absent}
                  </div>
                  <div className="text-xs text-red-600 mt-1">Absent</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-700 flex items-center justify-center gap-1">
                    <Clock className="h-6 w-6" />{attendanceSummary.late}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">Late</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-card border rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Attendance Percentage</span>
                  <span className="font-semibold">{attendanceSummary.percentage}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${attendanceSummary.percentage >= 75 ? 'bg-green-500' : attendanceSummary.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${attendanceSummary.percentage}%` }}
                  />
                </div>
                {attendanceSummary.percentage < 75 && (
                  <p className="text-xs text-red-600 mt-2">
                    Below 75% attendance threshold
                  </p>
                )}
              </div>
            </>
          )}

          {/* Calendar grid – last 30 days */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4">Last 30 Days</h3>
            <div className="grid grid-cols-10 gap-1.5">
              {calendarDays.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-0.5" title={`${day.date}: ${day.status || 'No data'}`}>
                  <AttendanceDot status={day.status} />
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />Present</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />Absent</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block" />Late</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted inline-block" />No data</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Academics Tab ────────────────────────────────────────── */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          {/* Overall */}
          {subjectRows.length > 0 && (
            <div className="bg-card border rounded-lg p-4 flex gap-6 items-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{overallAvg}%</div>
                <div className="text-xs text-muted-foreground">Overall Average</div>
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${overallAvg}%` }}
                />
              </div>
            </div>
          )}

          {/* Subject table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Subject</th>
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">Assessments</th>
                  <th className="text-left p-3 font-medium">Avg %</th>
                  <th className="text-left p-3 font-medium">Best Grade</th>
                </tr>
              </thead>
              <tbody>
                {subjectRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No grades recorded yet.</td>
                  </tr>
                ) : (
                  subjectRows.map((row) => (
                    <tr key={row.code} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{row.name}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{row.code}</td>
                      <td className="p-3 text-muted-foreground">{row.grades.length}</td>
                      <td className="p-3">
                        <span className={`font-semibold ${row.avg >= 75 ? 'text-green-600' : row.avg >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {row.avg}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold">
                          {row.bestGrade || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Recent grades */}
          {grades.length > 0 && (
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="text-sm font-semibold">Recent Grades</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Assessment</th>
                    <th className="text-left p-3 font-medium">Subject</th>
                    <th className="text-left p-3 font-medium">Marks</th>
                    <th className="text-left p-3 font-medium">%</th>
                    <th className="text-left p-3 font-medium">Grade</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.slice(0, 10).map((g) => (
                    <tr key={g.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">{g.assessment.title}</td>
                      <td className="p-3 text-muted-foreground">{g.subject.name}</td>
                      <td className="p-3">{g.marksObtained}/{g.maxMarks}</td>
                      <td className="p-3">
                        <span className={g.percentage >= 75 ? 'text-green-600 font-medium' : g.percentage >= 50 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                          {Math.round(g.percentage)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold">
                          {g.gradeLabel}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(g.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Documents Tab ────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No documents uploaded for this student.
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Document</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Uploaded</th>
                    <th className="text-left p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{d.name}</td>
                      <td className="p-3 text-muted-foreground">{d.type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.status === 'VERIFIED' ? 'bg-green-50 text-green-700 border border-green-200' :
                          d.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                          d.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{d.uploadedAt ? formatDate(d.uploadedAt) : '-'}</td>
                      <td className="p-3">
                        {d.fileUrl ? (
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-primary text-xs hover:underline">View</a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Activities Tab ───────────────────────────────────────── */}
      {activeTab === 'activities' && (
        <div>
          {hobbies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hobby enrollments found for this student.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hobbies.map((h) => (
                <div key={h.id} className="bg-card border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{h.hobby?.name || 'Hobby'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      h.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                      h.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{h.hobby?.category}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enrolled: {formatDate(h.enrolledAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Timeline Tab ─────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div>
          {timelineLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading timeline...</div>
          ) : !timeline || timeline.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No activity log entries found for this student.</div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">{timeline.total} activity entries</p>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {timeline.items.map((entry: any) => {
                    const typeStyles: Record<string, { dot: string; badge: string }> = {
                      GRADE:      { dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
                      ATTENDANCE: { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
                      INCIDENT:   { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
                      AWARD:      { dot: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                      ENROLLMENT: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
                      ASSESSMENT: { dot: 'bg-cyan-500',   badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                      LEAVE:      { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
                      HOBBY:      { dot: 'bg-pink-500',   badge: 'bg-pink-50 text-pink-700 border-pink-200' },
                      HEALTH:     { dot: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-700 border-teal-200' },
                      PROMOTION:  { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                      TRANSFER:   { dot: 'bg-gray-500',   badge: 'bg-gray-50 text-gray-700 border-gray-200' },
                      OTHER:      { dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border-gray-200' },
                    };
                    const style = typeStyles[entry.type] || typeStyles.OTHER;
                    return (
                      <div key={entry.id} className="flex gap-4 items-start relative">
                        {/* Date column */}
                        <div className="w-20 text-right flex-shrink-0 pt-0.5">
                          <span className="text-xs text-muted-foreground leading-tight">
                            {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                          <br />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(entry.date).getFullYear()}
                          </span>
                        </div>
                        {/* Dot */}
                        <div className={`h-3 w-3 rounded-full flex-shrink-0 mt-1 z-10 border-2 border-background ${style.dot}`} />
                        {/* Content */}
                        <div className="flex-1 bg-card border rounded-lg p-3 pb-3">
                          <div className="flex items-start gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${style.badge}`}>
                              {entry.type}
                            </span>
                            <span className="font-medium text-sm">{entry.title}</span>
                          </div>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

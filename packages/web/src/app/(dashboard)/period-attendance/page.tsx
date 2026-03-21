'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ClassOption { id: string; name: string; grade: number; }
interface SectionOption { id: string; name: string; }
interface StudentRow {
  id: string;
  admissionNo: string;
  rollNo?: number;
  user: { firstName: string; lastName: string };
  class: { name: string };
  section: { name: string };
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  period: number;
  status: string;
}

interface PeriodStat {
  period: number;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE'] as const;

function statusColor(s: string) {
  if (s === 'PRESENT') return 'text-green-600 bg-green-50';
  if (s === 'ABSENT') return 'text-red-600 bg-red-50';
  if (s === 'LATE') return 'text-yellow-600 bg-yellow-50';
  return 'text-muted-foreground bg-muted';
}

function statusIcon(s: string) {
  if (s === 'PRESENT') return <CheckCircle className="h-4 w-4 inline mr-1" />;
  if (s === 'ABSENT') return <XCircle className="h-4 w-4 inline mr-1" />;
  if (s === 'LATE') return <Clock className="h-4 w-4 inline mr-1" />;
  return null;
}

export default function PeriodAttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<number>(1);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [existing, setExisting] = useState<AttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'mark' | 'summary'>('mark');
  const [summary, setSummary] = useState<{ periodSummary: PeriodStat[] } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_URL;
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  useEffect(() => {
    const token = getToken();
    fetch(`${base}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setClasses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return; }
    const token = getToken();
    fetch(`${base}/sections?classId=${classId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setSections).catch(() => setSections([]));
  }, [classId]);

  const fetchStudents = useCallback(async () => {
    if (!classId || !sectionId) { setStudents([]); return; }
    const token = getToken();
    const res = await fetch(`${base}/students?classId=${classId}&sectionId=${sectionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setStudents(await res.json());
  }, [classId, sectionId]);

  const fetchExisting = useCallback(async () => {
    if (!classId || !sectionId || !date) return;
    const token = getToken();
    const params = new URLSearchParams({ classId, sectionId, date, period: String(period) });
    const res = await fetch(`${base}/period-attendance/class?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: AttendanceRecord[] = await res.json();
      setExisting(data);
      const map: Record<string, string> = {};
      data.forEach((r) => { map[r.studentId] = r.status; });
      setAttendance(map);
    }
  }, [classId, sectionId, date, period]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchExisting(); }, [fetchExisting]);

  // Default all students to PRESENT when students load and no existing data
  useEffect(() => {
    if (students.length > 0 && existing.length === 0) {
      const map: Record<string, string> = {};
      students.forEach(s => { map[s.id] = 'PRESENT'; });
      setAttendance(map);
    }
  }, [students, existing]);

  async function handleMarkAll(status: string) {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendance(map);
  }

  async function handleSubmit() {
    if (!classId || !sectionId || !date || students.length === 0) {
      setError('Select class, section and date first.');
      return;
    }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const token = getToken();
      const records = students.map(s => ({
        studentId: s.id,
        date,
        period,
        status: attendance[s.id] || 'PRESENT',
      }));
      const res = await fetch(`${base}/period-attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ records }),
      });
      if (res.ok) {
        setSuccess(`Attendance marked for Period ${period} on ${date}`);
        fetchExisting();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.message ?? `Error ${res.status}`);
      }
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  }

  async function fetchSummary() {
    if (!classId || !sectionId) return;
    setSummaryLoading(true);
    const token = getToken();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startDate = start.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({ classId, sectionId, startDate, endDate });
    const res = await fetch(`${base}/period-attendance/summary?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSummary(await res.json());
    setSummaryLoading(false);
  }

  useEffect(() => {
    if (viewMode === 'summary') fetchSummary();
  }, [viewMode, classId, sectionId]);

  const presentCount = students.filter(s => attendance[s.id] === 'PRESENT').length;
  const absentCount = students.filter(s => attendance[s.id] === 'ABSENT').length;
  const lateCount = students.filter(s => attendance[s.id] === 'LATE').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Period-wise Attendance</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('mark')}
            className={`px-4 py-2 rounded-md text-sm ${viewMode === 'mark' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-md text-sm ${viewMode === 'summary' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Class</label>
          <select value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); }}
            className="border rounded-md px-3 py-2 text-sm min-w-[140px]">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Section</label>
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!classId}
            className="border rounded-md px-3 py-2 text-sm min-w-[120px] disabled:opacity-50">
            <option value="">Select section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Period</label>
          <select value={period} onChange={e => setPeriod(Number(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm">
            {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'mark' && (
        <>
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{success}</div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
          )}

          {students.length > 0 && (
            <>
              {/* Stats bar */}
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-4 py-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-700">{presentCount}</span>
                  <span className="text-green-600">Present</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700">{absentCount}</span>
                  <span className="text-red-600">Absent</span>
                </div>
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-md px-4 py-2 text-sm">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">{lateCount}</span>
                  <span className="text-yellow-600">Late</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mb-4">
                <span className="text-sm text-muted-foreground mr-2 self-center">Mark all:</span>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => handleMarkAll(s)}
                    className={`px-3 py-1 rounded text-xs font-medium border ${statusColor(s)}`}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Student list */}
              <div className="bg-card rounded-lg border overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Roll</th>
                      <th className="text-left p-3 font-medium">Admission No</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">{s.rollNo || '-'}</td>
                        <td className="p-3 font-mono text-xs">{s.admissionNo}</td>
                        <td className="p-3 font-medium">{s.user.firstName} {s.user.lastName}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {STATUS_OPTIONS.map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`status-${s.id}`}
                                  value={opt}
                                  checked={attendance[s.id] === opt}
                                  onChange={() => setAttendance(prev => ({ ...prev, [s.id]: opt }))}
                                  className="accent-primary"
                                />
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(opt)}`}>
                                  {opt.charAt(0) + opt.slice(1).toLowerCase()}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSubmit} disabled={submitting}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-60">
                  {submitting ? 'Saving...' : `Mark Attendance — Period ${period}`}
                </button>
              </div>
            </>
          )}

          {classId && sectionId && students.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No students found for selected class/section.</div>
          )}

          {(!classId || !sectionId) && (
            <div className="text-center py-12 text-muted-foreground">Select a class and section to mark attendance.</div>
          )}
        </>
      )}

      {viewMode === 'summary' && (
        <div>
          {summaryLoading && <div className="text-center py-8 text-muted-foreground">Loading summary...</div>}
          {!summaryLoading && summary && (
            <>
              <h2 className="text-lg font-semibold mb-4">Period-wise Summary (Last 30 days)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {summary.periodSummary.map(p => (
                  <div key={p.period} className="bg-card border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Period {p.period}</div>
                    <div className="text-2xl font-bold text-primary">{p.percentage}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {p.present} present / {p.total} total
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!summaryLoading && !summary && classId && sectionId && (
            <div className="text-center py-8 text-muted-foreground">No data available for selected class/section.</div>
          )}
          {(!classId || !sectionId) && (
            <div className="text-center py-12 text-muted-foreground">Select a class and section to view summary.</div>
          )}
        </div>
      )}
    </div>
  );
}

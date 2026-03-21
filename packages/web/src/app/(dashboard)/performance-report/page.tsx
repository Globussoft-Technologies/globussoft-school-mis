'use client';

import { useState, useEffect, useCallback } from 'react';
import { Printer, BarChart2, Users, Search } from 'lucide-react';

const base = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
}

async function apiFetch(path: string) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

interface SubjectPerf {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  gradeLabel: string;
}

interface StudentReport {
  student: {
    id: string;
    admissionNo: string;
    name: string;
    class: string;
    grade: number;
    section: string;
    rollNo: number | null;
    gender: string;
    dateOfBirth: string;
    guardian: { name: string; relation: string; phone: string } | null;
    academicSession: string;
  };
  performance: {
    subjectPerformance: SubjectPerf[];
    totalObtained: number;
    totalMax: number;
    overallPercentage: number;
    overallGrade: string;
    rank: number;
    totalStudentsInClass: number;
    strengths: string[];
    weaknesses: string[];
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendancePercentage: number;
  };
  hobbies: Array<{ name: string; category: string; level: string; status: string }>;
  discipline: { incidentCount: number; recentIncidents: any[] };
  reportCards: any[];
}

interface StudentSummary {
  studentId: string;
  admissionNo: string;
  name: string;
  section: string;
  rollNo: number | null;
  percentage: number;
  gradeLabel: string;
  attendancePercentage: number;
  rank: number;
}

interface ClassReport {
  class: { id: string; name: string; grade: number };
  totalStudents: number;
  averagePercentage: number;
  topPerformers: StudentSummary[];
  bottomPerformers: StudentSummary[];
  students: StudentSummary[];
}

function gradeColor(label: string) {
  if (label === 'A+' || label === 'A') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (label === 'B+' || label === 'B') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (label === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (label === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

export default function PerformanceReportPage() {
  const [mode, setMode] = useState<'student' | 'class'>('student');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string; grade: number }>>([]);
  const [studentReport, setStudentReport] = useState<StudentReport | null>(null);
  const [classReport, setClassReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/classes')
      .then((data) => setClasses(data))
      .catch(() => {});
  }, []);

  async function generate() {
    setError('');
    setStudentReport(null);
    setClassReport(null);
    if (mode === 'student' && !studentId.trim()) {
      setError('Please enter a student ID');
      return;
    }
    if (mode === 'class' && !classId) {
      setError('Please select a class');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'student') {
        const data = await apiFetch(`/performance-report/student/${studentId.trim()}`);
        setStudentReport(data);
      } else {
        const data = await apiFetch(`/performance-report/class/${classId}`);
        setClassReport(data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Performance Report</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate detailed academic performance reports</p>
        </div>
        {(studentReport || classReport) && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 border rounded-md px-4 py-2 text-sm hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="border rounded-lg p-4 bg-card print:hidden space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode('student'); setStudentReport(null); setClassReport(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'student' ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Search className="h-4 w-4" />
            Student Report
          </button>
          <button
            onClick={() => { setMode('class'); setStudentReport(null); setClassReport(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'class' ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Users className="h-4 w-4" />
            Class Report
          </button>
        </div>

        <div className="flex gap-3">
          {mode === 'student' ? (
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter Student ID (UUID)"
              className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>
              ))}
            </select>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <BarChart2 className="h-4 w-4" />
            )}
            Generate
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</div>
        )}
      </div>

      {/* Student Report */}
      {studentReport && (
        <div className="space-y-6 print:space-y-4">
          {/* Header card */}
          <div className="border rounded-lg p-6 bg-card print:border-0 print:p-0">
            <div className="text-center mb-4 print:mb-2">
              <h2 className="text-xl font-bold print:text-2xl">Student Performance Report</h2>
              <p className="text-muted-foreground text-sm">Academic Year: {studentReport.student.academicSession}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground">Student Name</div>
                <div className="font-semibold text-sm">{studentReport.student.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Admission No</div>
                <div className="font-semibold text-sm">{studentReport.student.admissionNo}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Class & Section</div>
                <div className="font-semibold text-sm">{studentReport.student.class} — {studentReport.student.section}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Roll No</div>
                <div className="font-semibold text-sm">{studentReport.student.rollNo ?? 'N/A'}</div>
              </div>
              {studentReport.student.guardian && (
                <div>
                  <div className="text-xs text-muted-foreground">Guardian</div>
                  <div className="font-semibold text-sm">{studentReport.student.guardian.name} ({studentReport.student.guardian.relation})</div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-card text-center">
              <div className="text-3xl font-bold text-primary">{studentReport.performance.overallPercentage}%</div>
              <div className="text-xs text-muted-foreground mt-1">Overall Score</div>
            </div>
            <div className="border rounded-lg p-4 bg-card text-center">
              <div className={`inline-block text-2xl font-bold px-3 py-1 rounded-full ${gradeColor(studentReport.performance.overallGrade)}`}>
                {studentReport.performance.overallGrade}
              </div>
              <div className="text-xs text-muted-foreground mt-2">Overall Grade</div>
            </div>
            <div className="border rounded-lg p-4 bg-card text-center">
              <div className="text-3xl font-bold">#{studentReport.performance.rank}</div>
              <div className="text-xs text-muted-foreground mt-1">Class Rank / {studentReport.performance.totalStudentsInClass}</div>
            </div>
            <div className="border rounded-lg p-4 bg-card text-center">
              <div className="text-3xl font-bold text-blue-600">{studentReport.attendance.attendancePercentage}%</div>
              <div className="text-xs text-muted-foreground mt-1">Attendance</div>
            </div>
          </div>

          {/* Subject Performance Table */}
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-sm">Subject-wise Performance</div>
            {studentReport.performance.subjectPerformance.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">No grade data available</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Subject</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Code</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">Obtained</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">Max</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">%</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.performance.subjectPerformance.map((s) => (
                    <tr key={s.subjectId} className="border-t">
                      <td className="px-4 py-2 font-medium">{s.subjectName}</td>
                      <td className="px-4 py-2 text-muted-foreground">{s.subjectCode}</td>
                      <td className="px-4 py-2 text-right">{s.totalObtained}</td>
                      <td className="px-4 py-2 text-right">{s.totalMax}</td>
                      <td className="px-4 py-2 text-right">{s.percentage}%</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor(s.gradeLabel)}`}>
                          {s.gradeLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30 font-semibold">
                    <td className="px-4 py-2" colSpan={2}>Total</td>
                    <td className="px-4 py-2 text-right">{studentReport.performance.totalObtained}</td>
                    <td className="px-4 py-2 text-right">{studentReport.performance.totalMax}</td>
                    <td className="px-4 py-2 text-right">{studentReport.performance.overallPercentage}%</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor(studentReport.performance.overallGrade)}`}>
                        {studentReport.performance.overallGrade}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Attendance Bar */}
          <div className="border rounded-lg p-4 bg-card">
            <div className="font-semibold text-sm mb-3">Attendance Summary</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${studentReport.attendance.attendancePercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium min-w-[48px]">{studentReport.attendance.attendancePercentage}%</span>
            </div>
            <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
              <span>Total Days: <strong className="text-foreground">{studentReport.attendance.totalDays}</strong></span>
              <span>Present: <strong className="text-green-600">{studentReport.attendance.presentDays}</strong></span>
              <span>Absent: <strong className="text-red-500">{studentReport.attendance.absentDays}</strong></span>
              <span>Late: <strong className="text-amber-500">{studentReport.attendance.lateDays}</strong></span>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="font-semibold text-sm mb-2 text-green-600">Strengths (≥80%)</div>
              {studentReport.performance.strengths.length === 0 ? (
                <p className="text-sm text-muted-foreground">None identified</p>
              ) : (
                <ul className="space-y-1">
                  {studentReport.performance.strengths.map((s) => (
                    <li key={s} className="text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="font-semibold text-sm mb-2 text-red-500">Areas for Improvement (&lt;50%)</div>
              {studentReport.performance.weaknesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">None — great performance!</p>
              ) : (
                <ul className="space-y-1">
                  {studentReport.performance.weaknesses.map((s) => (
                    <li key={s} className="text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Hobbies */}
          {studentReport.hobbies.length > 0 && (
            <div className="border rounded-lg p-4 bg-card">
              <div className="font-semibold text-sm mb-2">Co-curricular Activities</div>
              <div className="flex flex-wrap gap-2">
                {studentReport.hobbies.map((h, i) => (
                  <span key={i} className="text-xs border rounded-full px-3 py-1">
                    {h.name} <span className="text-muted-foreground">({h.level})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Discipline */}
          {studentReport.discipline.incidentCount > 0 && (
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
              <div className="font-semibold text-sm mb-1 text-orange-700 dark:text-orange-400">
                Discipline Note
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                {studentReport.discipline.incidentCount} discipline incident(s) recorded this session.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Class Report */}
      {classReport && (
        <div className="space-y-6 print:space-y-4">
          <div className="border rounded-lg p-6 bg-card text-center print:border-0">
            <h2 className="text-xl font-bold">Class Performance Report</h2>
            <p className="text-muted-foreground text-sm">{classReport.class.name} (Grade {classReport.class.grade})</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 bg-card text-center">
              <div className="text-3xl font-bold">{classReport.totalStudents}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Students</div>
            </div>
            <div className="border rounded-lg p-4 bg-card text-center">
              <div className="text-3xl font-bold text-primary">{classReport.averagePercentage}%</div>
              <div className="text-xs text-muted-foreground mt-1">Class Average</div>
            </div>
            <div className="border rounded-lg p-4 bg-card text-center">
              <div className="text-3xl font-bold text-green-600">
                {classReport.topPerformers[0]?.percentage ?? 0}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Top Score</div>
            </div>
          </div>

          {/* Top Performers */}
          {classReport.topPerformers.length > 0 && (
            <div className="border rounded-lg p-4 bg-card">
              <div className="font-semibold text-sm mb-3 text-green-600">Top Performers</div>
              <div className="space-y-2">
                {classReport.topPerformers.map((s) => (
                  <div key={s.studentId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                      #{s.rank}
                    </span>
                    <span className="flex-1 text-sm font-medium">{s.name}</span>
                    <span className="text-sm text-muted-foreground">{s.section}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor(s.gradeLabel)}`}>
                      {s.gradeLabel}
                    </span>
                    <span className="text-sm font-semibold min-w-[52px] text-right">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full ranking table */}
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-sm">Class Ranking</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Rank</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Adm No</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Section</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">Score</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground">Grade</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {classReport.students.map((s) => (
                    <tr key={s.studentId} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-2 font-bold text-muted-foreground">#{s.rank}</td>
                      <td className="px-4 py-2 font-medium">{s.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{s.admissionNo}</td>
                      <td className="px-4 py-2">{s.section}</td>
                      <td className="px-4 py-2 text-right">{s.percentage}%</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor(s.gradeLabel)}`}>
                          {s.gradeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{s.attendancePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

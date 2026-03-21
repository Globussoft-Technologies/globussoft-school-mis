'use client';

import { useEffect, useState } from 'react';

interface ClassItem { id: string; name: string; }

interface GradeRow {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  marks?: number;
  maxMarks?: number;
  percentage?: number;
  grade?: string;
  gradePoint?: number;
}

const gradeScale = [
  { label: 'A1', range: '91–100%', points: 10, color: 'text-green-700' },
  { label: 'A2', range: '81–90%',  points: 9,  color: 'text-green-600' },
  { label: 'B1', range: '71–80%',  points: 8,  color: 'text-blue-600' },
  { label: 'B2', range: '61–70%',  points: 7,  color: 'text-blue-500' },
  { label: 'C1', range: '51–60%',  points: 6,  color: 'text-yellow-600' },
  { label: 'C2', range: '41–50%',  points: 5,  color: 'text-yellow-500' },
  { label: 'D',  range: '33–40%',  points: 4,  color: 'text-orange-600' },
  { label: 'E',  range: '<33%',    points: 0,  color: 'text-red-600' },
];

export default function GradingPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    fetch('/api/v1/classes', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setGrades([]); return; }
    setLoading(true);
    setError('');
    const url = `/api/v1/grading/class?classId=${selectedClassId}${subjectId ? `&subjectId=${subjectId}` : ''}`;
    fetch(url, { headers: headers() })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(data => {
        setGrades(Array.isArray(data) ? data : data.grades ?? data.students ?? data.data ?? []);
        setLoading(false);
      })
      .catch(err => { setError(`Failed to load grades: ${err.message}`); setLoading(false); });
  }, [selectedClassId, subjectId]);

  const avg = grades.length > 0 && grades.some(g => g.percentage != null)
    ? Math.round(grades.reduce((s, g) => s + (g.percentage ?? 0), 0) / grades.filter(g => g.percentage != null).length)
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Grading</h1>

      {/* Grade Scale Reference */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
        {gradeScale.map(g => (
          <div key={g.label} className="bg-card rounded-lg border p-3 text-center">
            <p className={`text-lg font-bold ${g.color}`}>{g.label}</p>
            <p className="text-xs text-muted-foreground">{g.range}</p>
            <p className="text-xs text-muted-foreground">{g.points} pts</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Subject ID (optional)</label>
          <input
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            placeholder="Enter subject ID"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        {avg !== null && (
          <div className="text-sm text-muted-foreground">
            Class Avg: <span className="font-bold text-foreground">{avg}%</span>
          </div>
        )}
      </div>

      {/* Grades Table */}
      <div className="bg-card rounded-lg border">
        {error && <div className="p-4 text-sm text-red-600 bg-red-50 border-b">{error}</div>}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading grades...</div>
        ) : grades.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {selectedClassId ? 'No grade data found.' : 'Select a class to view grades.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Roll No.</th>
                  <th className="text-right px-4 py-3 font-medium">Marks</th>
                  <th className="text-right px-4 py-3 font-medium">Percentage</th>
                  <th className="text-center px-4 py-3 font-medium">Grade</th>
                  <th className="text-center px-4 py-3 font-medium">Grade Point</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(row => (
                  <tr key={row.studentId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.studentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.rollNumber ?? '--'}</td>
                    <td className="px-4 py-3 text-right">
                      {row.marks != null
                        ? `${row.marks}${row.maxMarks != null ? ` / ${row.maxMarks}` : ''}`
                        : '--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.percentage != null ? `${row.percentage.toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.grade ? (
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                          {row.grade}
                        </span>
                      ) : '--'}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {row.gradePoint ?? '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface RemedialEnrollment {
  id: string;
  studentId: string;
  subjectId: string;
  assessmentId: string;
  originalScore: number;
  maxMarks: number;
  enrolledAt: string;
  status: string;
  remedialScore?: number;
  remedialMaxMarks?: number;
  completedAt?: string;
  teacherId?: string;
  remarks?: string;
  originalPercentage?: number;
  remedialPercentage?: number;
  improvementDelta?: number;
}

const STATUS_STYLES: Record<string, string> = {
  ENROLLED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  SKIPPED: 'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function DeltaBadge({ delta }: { delta?: number | null }) {
  if (delta == null) return <span className="text-muted-foreground text-xs">—</span>;
  const color = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500';
  return (
    <span className={`text-sm font-semibold ${color}`}>
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}

export default function RemedialPage() {
  const [enrollments, setEnrollments] = useState<RemedialEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [scoreForm, setScoreForm] = useState<{ id: string; score: string; maxMarks: string; remarks: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const fetchEnrollments = () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (filterSubject) params.set('subjectId', filterSubject);
    if (filterStatus) params.set('status', filterStatus);
    fetch(`/api/v1/remedial?${params}`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEnrollments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load remedial enrollments'); setLoading(false); });
  };

  useEffect(() => { fetchEnrollments(); }, [filterSubject, filterStatus]);

  const handleRecordScore = async () => {
    if (!scoreForm) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/remedial/${scoreForm.id}/score`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          score: parseFloat(scoreForm.score),
          maxMarks: parseFloat(scoreForm.maxMarks),
          remarks: scoreForm.remarks || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setScoreForm(null);
      fetchEnrollments();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // Summary stats
  const total = enrollments.length;
  const completed = enrollments.filter(e => e.status === 'COMPLETED').length;
  const withDelta = enrollments.filter(e => e.improvementDelta != null && e.improvementDelta !== undefined);
  const avgImprovement = withDelta.length
    ? (withDelta.reduce((s, e) => s + (e.improvementDelta ?? 0), 0) / withDelta.length).toFixed(1)
    : null;

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Remedial Program</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Enrolled</p>
          <p className="text-3xl font-bold text-blue-600">{total}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{completed}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Improvement</p>
          <p className={`text-3xl font-bold ${avgImprovement && parseFloat(avgImprovement) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {avgImprovement != null ? `+${avgImprovement}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          placeholder="Filter by Subject ID"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background w-48"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background w-44"
        >
          <option value="">All Statuses</option>
          {['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      {/* Record Score Modal */}
      {scoreForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Record Remedial Score</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Score Obtained</label>
                <input
                  type="number"
                  value={scoreForm.score}
                  onChange={e => setScoreForm(f => f ? { ...f, score: e.target.value } : null)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="e.g. 35"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Max Marks</label>
                <input
                  type="number"
                  value={scoreForm.maxMarks}
                  onChange={e => setScoreForm(f => f ? { ...f, maxMarks: e.target.value } : null)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Remarks (optional)</label>
                <input
                  value={scoreForm.remarks}
                  onChange={e => setScoreForm(f => f ? { ...f, remarks: e.target.value } : null)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Any observations…"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setScoreForm(null)} className="px-3 py-2 text-sm border rounded-md hover:bg-muted">Cancel</button>
              <button
                onClick={handleRecordScore}
                disabled={!scoreForm.score || !scoreForm.maxMarks || saving}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Score'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : enrollments.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center text-muted-foreground">
          No remedial enrollments found.
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-3 font-semibold">Student ID</th>
                <th className="px-4 py-3 font-semibold">Subject ID</th>
                <th className="px-4 py-3 font-semibold">Original Score</th>
                <th className="px-4 py-3 font-semibold">Remedial Score</th>
                <th className="px-4 py-3 font-semibold">Improvement</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Enrolled</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments.map(e => {
                const origPct = e.originalPercentage ?? ((e.originalScore / e.maxMarks) * 100);
                const remPct = e.remedialPercentage ??
                  (e.remedialScore != null && e.remedialMaxMarks != null
                    ? (e.remedialScore / e.remedialMaxMarks) * 100
                    : null);
                const delta = e.improvementDelta ?? (remPct != null ? remPct - origPct : null);
                return (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{e.studentId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-mono text-xs">{e.subjectId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-red-600">{e.originalScore}/{e.maxMarks}</span>
                      <span className="text-xs text-muted-foreground ml-1">({origPct.toFixed(1)}%)</span>
                    </td>
                    <td className="px-4 py-3">
                      {e.remedialScore != null && e.remedialMaxMarks != null
                        ? <><span className="font-medium text-green-600">{e.remedialScore}/{e.remedialMaxMarks}</span>
                          <span className="text-xs text-muted-foreground ml-1">({remPct?.toFixed(1)}%)</span></>
                        : <span className="text-muted-foreground text-xs">Not taken</span>
                      }
                    </td>
                    <td className="px-4 py-3"><DeltaBadge delta={delta} /></td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmt(e.enrolledAt)}</td>
                    <td className="px-4 py-3">
                      {(e.status === 'ENROLLED' || e.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => setScoreForm({ id: e.id, score: '', maxMarks: String(e.maxMarks), remarks: '' })}
                          className="px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                        >
                          Record Score
                        </button>
                      )}
                      {e.status === 'COMPLETED' && (
                        <span className="text-xs text-green-600">Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

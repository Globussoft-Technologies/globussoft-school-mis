'use client';

import { useEffect, useState } from 'react';

interface GraceMark {
  id: string;
  studentId: string;
  subjectId: string;
  assessmentId?: string;
  marks: number;
  reason: string;
  approvedBy: string;
  term?: string;
  createdAt: string;
}

const REASON_STYLES: Record<string, string> = {
  SPORTS: 'bg-blue-100 text-blue-700',
  MEDICAL: 'bg-red-100 text-red-700',
  EXTRAORDINARY: 'bg-purple-100 text-purple-700',
  POLICY: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-600',
};

const REASONS = ['SPORTS', 'MEDICAL', 'EXTRAORDINARY', 'POLICY', 'OTHER'];

function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${REASON_STYLES[reason] ?? 'bg-gray-100 text-gray-600'}`}>
      {reason}
    </span>
  );
}

const emptyForm = {
  studentId: '',
  subjectId: '',
  assessmentId: '',
  marks: '',
  reason: 'SPORTS',
  approvedBy: '',
  term: '',
};

export default function GraceMarksPage() {
  const [marks, setMarks] = useState<GraceMark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const fetchMarks = () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (filterSubject) params.set('subjectId', filterSubject);
    fetch(`/api/v1/grace-marks?${params}`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        let all: GraceMark[] = Array.isArray(data) ? data : [];
        if (filterReason) all = all.filter(m => m.reason === filterReason);
        setMarks(all);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load grace marks'); setLoading(false); });
  };

  useEffect(() => { fetchMarks(); }, [filterSubject, filterReason]);

  const handleCreate = async () => {
    setFormError('');
    if (!form.studentId || !form.subjectId || !form.marks || !form.approvedBy) {
      setFormError('Student ID, Subject ID, Marks, and Approved By are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/grace-marks', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          studentId: form.studentId,
          subjectId: form.subjectId,
          assessmentId: form.assessmentId || undefined,
          marks: parseFloat(form.marks),
          reason: form.reason,
          approvedBy: form.approvedBy,
          term: form.term || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      setShowForm(false);
      setForm(emptyForm);
      fetchMarks();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Grace Marks</h1>
        <button
          onClick={() => { setShowForm(true); setFormError(''); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + Award Grace Marks
        </button>
      </div>

      {/* Award Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Award Grace Marks</h2>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 mb-3 text-sm">{formError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Student ID *</label>
                <input
                  value={form.studentId}
                  onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Student UUID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Subject ID *</label>
                <input
                  value={form.subjectId}
                  onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Subject UUID"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Assessment ID (optional)</label>
                <input
                  value={form.assessmentId}
                  onChange={e => setForm(f => ({ ...f, assessmentId: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Assessment UUID"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Grace Marks *</label>
                  <input
                    type="number"
                    value={form.marks}
                    onChange={e => setForm(f => ({ ...f, marks: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="e.g. 3"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Term (optional)</label>
                  <select
                    value={form.term}
                    onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">—</option>
                    <option value="TERM_1">Term 1</option>
                    <option value="TERM_2">Term 2</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reason *</label>
                <select
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Approved By *</label>
                <input
                  value={form.approvedBy}
                  onChange={e => setForm(f => ({ ...f, approvedBy: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Principal / Coordinator name"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm border rounded-md hover:bg-muted">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Award Marks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          placeholder="Filter by Subject ID"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background w-48"
        />
        <select
          value={filterReason}
          onChange={e => setFilterReason(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background w-44"
        >
          <option value="">All Reasons</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : marks.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center text-muted-foreground">
          No grace marks found. Award some to get started.
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-3 font-semibold">Student ID</th>
                <th className="px-4 py-3 font-semibold">Subject ID</th>
                <th className="px-4 py-3 font-semibold">Grace Marks</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Term</th>
                <th className="px-4 py-3 font-semibold">Approved By</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {marks.map(m => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{m.studentId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs">{m.subjectId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-primary text-base">+{m.marks}</span>
                  </td>
                  <td className="px-4 py-3"><ReasonBadge reason={m.reason} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{m.term?.replace('_', ' ') ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.approvedBy}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

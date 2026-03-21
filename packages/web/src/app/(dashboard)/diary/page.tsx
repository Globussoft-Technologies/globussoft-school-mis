'use client';

import { useEffect, useState } from 'react';

interface DiaryEntry {
  id: string;
  studentId?: string;
  classId?: string;
  sectionId?: string;
  date: string;
  type: string;
  subject?: string;
  content: string;
  createdBy: string;
  isPublished: boolean;
  createdAt: string;
}

interface ClassItem { id: string; name: string; }

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  HOMEWORK:  { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  CLASSWORK: { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  NOTE:      { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
  REMINDER:  { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
  CIRCULAR:  { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
};

function typeMeta(type: string) {
  return TYPE_COLORS[type] ?? { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' };
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: 'HOMEWORK',
    subject: '',
    content: '',
    classId: '',
    sectionId: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    isPublished: true,
  });

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });
  const jsonHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });
  const base = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

  useEffect(() => {
    fetch(`${base}/classes`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadEntries();
  }, [selectedClassId, selectedDate]);

  function loadEntries() {
    setLoading(true);
    let url = `${base}/diary?date=${selectedDate}`;
    if (selectedClassId) url += `&classId=${selectedClassId}`;
    fetch(url, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.content.trim()) { setFormError('Content is required'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`${base}/diary`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          ...form,
          classId: form.classId || undefined,
          sectionId: form.sectionId || undefined,
          studentId: form.studentId || undefined,
          subject: form.subject || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      setShowForm(false);
      setForm({ type: 'HOMEWORK', subject: '', content: '', classId: '', sectionId: '', studentId: '', date: new Date().toISOString().split('T')[0], isPublished: true });
      loadEntries();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this diary entry?')) return;
    await fetch(`${base}/diary/${id}`, { method: 'DELETE', headers: headers() });
    loadEntries();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Student Diary</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="bg-card rounded-lg border p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">New Diary Entry</h2>
          {formError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {['HOMEWORK', 'CLASSWORK', 'NOTE', 'REMINDER', 'CIRCULAR'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject (optional)</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Mathematics"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class (optional)</label>
              <select
                value={form.classId}
                onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">All classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
                placeholder="Enter the diary entry content..."
                className="w-full border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                  className="rounded"
                />
                Publish immediately
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Entry'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-sm">Loading entries...</div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm bg-card rounded-lg border">
          No diary entries for {selectedDate}{selectedClassId ? ' in this class' : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const meta = typeMeta(entry.type);
            return (
              <div
                key={entry.id}
                className={`rounded-lg border p-4 ${meta.bg} ${meta.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
                        {entry.type}
                      </span>
                      {entry.subject && (
                        <span className="text-xs text-muted-foreground font-medium">{entry.subject}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {!entry.isPublished && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Draft</span>
                      )}
                    </div>
                    <p className={`text-sm ${meta.text}`}>{entry.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-red-500 hover:text-red-700 shrink-0 mt-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

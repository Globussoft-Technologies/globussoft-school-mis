'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ExamScheduleEntry {
  id: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  invigilatorId?: string;
}

interface ExamSchedule {
  id: string;
  name: string;
  type: string;
  classId: string;
  academicSessionId: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  entries?: ExamScheduleEntry[];
  _count?: { entries: number };
}

const typeColors: Record<string, string> = {
  MID_TERM: 'bg-orange-100 text-orange-700',
  FINAL_EXAM: 'bg-red-100 text-red-700',
  UNIT_TEST: 'bg-blue-100 text-blue-700',
  MONTHLY_TEST: 'bg-purple-100 text-purple-700',
};

const statusColors: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
};

const EXAM_TYPES = ['MID_TERM', 'FINAL_EXAM', 'UNIT_TEST', 'MONTHLY_TEST'];
const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED'];

const EMPTY_ENTRY = {
  subjectId: '',
  date: '',
  startTime: '',
  endTime: '',
  room: '',
};

const EMPTY_FORM = {
  name: '',
  type: 'MID_TERM',
  classId: '',
  academicSessionId: '',
  startDate: '',
  endDate: '',
  status: 'UPCOMING',
  entries: [{ ...EMPTY_ENTRY }],
};

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ExamSchedulePage() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<ExamSchedule | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`${apiUrl}/exam-schedules?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSchedules(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filterType, filterStatus]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const fetchScheduleDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedSchedule(null);
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiUrl}/exam-schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpandedSchedule(data);
        setExpandedId(id);
      }
    } catch {
      // silent
    }
  };

  const handleEntryChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = form.entries.map((e, i) =>
      i === index ? { ...e, [field]: value } : e,
    );
    setForm((f) => ({ ...f, entries: updated }));
  };

  const addEntry = () => {
    setForm((f) => ({ ...f, entries: [...f.entries, { ...EMPTY_ENTRY }] }));
  };

  const removeEntry = (index: number) => {
    setForm((f) => ({
      ...f,
      entries: f.entries.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        ...form,
        entries: form.entries.filter(
          (en) => en.subjectId && en.date && en.startTime && en.endTime,
        ),
      };
      const res = await fetch(`${apiUrl}/exam-schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create exam schedule');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchSchedules();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam schedule? All entries will be removed.')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiUrl}/exam-schedules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (expandedId === id) {
          setExpandedId(null);
          setExpandedSchedule(null);
        }
        fetchSchedules();
      }
    } catch {
      // silent
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Exam Schedule</h1>
            <p className="text-sm text-muted-foreground">
              Manage examination timetables and entries
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setError('');
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Exam Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Types</option>
          {EXAM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Create Exam Schedule</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Schedule Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Class 10 Mid-Term Exam 2025"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Exam Type *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Class ID *</label>
                  <input
                    required
                    value={form.classId}
                    onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                    placeholder="Class UUID"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Academic Session ID *</label>
                  <input
                    required
                    value={form.academicSessionId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, academicSessionId: e.target.value }))
                    }
                    placeholder="Session UUID"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    required
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Entries */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Exam Entries</label>
                  <button
                    type="button"
                    onClick={addEntry}
                    className="text-xs flex items-center gap-1 text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Entry
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {form.entries.map((entry, i) => (
                    <div
                      key={i}
                      className="border rounded-md p-3 bg-muted/30 grid grid-cols-2 gap-2 relative"
                    >
                      <button
                        type="button"
                        onClick={() => removeEntry(i)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <div className="col-span-2">
                        <label className="block text-xs text-muted-foreground mb-0.5">
                          Subject ID
                        </label>
                        <input
                          value={entry.subjectId}
                          onChange={(e) => handleEntryChange(i, 'subjectId', e.target.value)}
                          placeholder="Subject UUID"
                          className="w-full border rounded px-2 py-1 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-0.5">
                          Date
                        </label>
                        <input
                          type="date"
                          value={entry.date}
                          onChange={(e) => handleEntryChange(i, 'date', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-0.5">
                          Room
                        </label>
                        <input
                          value={entry.room}
                          onChange={(e) => handleEntryChange(i, 'room', e.target.value)}
                          placeholder="e.g. Room 101"
                          className="w-full border rounded px-2 py-1 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-0.5">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => handleEntryChange(i, 'startTime', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-0.5">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => handleEntryChange(i, 'endTime', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading exam schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No exam schedules found.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Create the first one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="border rounded-lg bg-card overflow-hidden">
              {/* Schedule Row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm">{schedule.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        typeColors[schedule.type] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {schedule.type.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColors[schedule.status] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {schedule.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(schedule.startDate)} — {formatDate(schedule.endDate)}
                    {schedule._count !== undefined && (
                      <span className="ml-2">
                        · {schedule._count.entries} entr
                        {schedule._count.entries === 1 ? 'y' : 'ies'}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => fetchScheduleDetail(schedule.id)}
                    className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground border rounded px-2 py-1"
                  >
                    {expandedId === schedule.id ? (
                      <>
                        <ChevronUp className="h-3 w-3" /> Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" /> View
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="text-muted-foreground hover:text-red-500 p-1"
                    title="Delete schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Entries */}
              {expandedId === schedule.id && expandedSchedule && (
                <div className="border-t bg-muted/20 p-4">
                  {expandedSchedule.entries && expandedSchedule.entries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left pb-2 pr-3">Subject ID</th>
                            <th className="text-left pb-2 pr-3">Date</th>
                            <th className="text-left pb-2 pr-3">Time</th>
                            <th className="text-left pb-2 pr-3">Room</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expandedSchedule.entries.map((entry) => (
                            <tr key={entry.id} className="border-b last:border-0">
                              <td className="py-1.5 pr-3 font-mono text-[11px] truncate max-w-[120px]">
                                {entry.subjectId}
                              </td>
                              <td className="py-1.5 pr-3">{formatDate(entry.date)}</td>
                              <td className="py-1.5 pr-3">
                                {entry.startTime} – {entry.endTime}
                              </td>
                              <td className="py-1.5 pr-3 text-muted-foreground">
                                {entry.room ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No entries added yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

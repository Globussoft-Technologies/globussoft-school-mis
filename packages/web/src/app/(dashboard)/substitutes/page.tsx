'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  UserCog,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SubstituteAssignment {
  id: string;
  originalTeacherId: string;
  substituteTeacherId: string;
  date: string;
  classId: string;
  sectionId?: string;
  subjectId?: string;
  reason?: string;
  status: 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  assignedBy: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ASSIGNED: <Clock className="h-3.5 w-3.5" />,
  ACCEPTED: <CheckCircle className="h-3.5 w-3.5" />,
  COMPLETED: <CheckCircle className="h-3.5 w-3.5" />,
  CANCELLED: <XCircle className="h-3.5 w-3.5" />,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const EMPTY_FORM = {
  originalTeacherId: '',
  substituteTeacherId: '',
  classId: '',
  sectionId: '',
  subjectId: '',
  date: new Date().toISOString().split('T')[0],
  reason: '',
};

export default function SubstitutesPage() {
  const [assignments, setAssignments] = useState<SubstituteAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; firstName: string; lastName: string; role: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = dateFilter ? `?date=${dateFilter}` : '';
      const res = await fetch(`${API}/substitutes${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  async function fetchSuggestions() {
    if (!form.date) return;
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `${API}/substitutes/suggestions?date=${form.date}&startTime=09:00&endTime=10:00`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      setSuggestions(data.suggestedSubstitutes || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/substitutes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          originalTeacherId: form.originalTeacherId,
          substituteTeacherId: form.substituteTeacherId,
          classId: form.classId,
          sectionId: form.sectionId || undefined,
          subjectId: form.subjectId || undefined,
          date: form.date,
          reason: form.reason || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setSuggestions([]);
        fetchAssignments();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, action: 'accept' | 'complete' | 'cancel') {
    setActioningId(id);
    try {
      await fetch(`${API}/substitutes/${id}/${action}`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      fetchAssignments();
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Substitute Teacher Management</h1>
            <p className="text-sm text-muted-foreground">Assign and track substitute teachers for absent staff</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setSuggestions([]); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Assign Substitute
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3 bg-card border rounded-lg p-4">
        <label className="text-sm font-medium text-muted-foreground">Filter by date:</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm"
        />
        <button
          onClick={() => setDateFilter('')}
          className="text-xs text-muted-foreground underline"
        >
          Show all
        </button>
      </div>

      {/* Assign Substitute Form */}
      {showForm && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Assign Substitute Teacher</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Original Teacher ID *</label>
              <input
                required
                value={form.originalTeacherId}
                onChange={(e) => setForm({ ...form, originalTeacherId: e.target.value })}
                placeholder="Teacher ID"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class ID *</label>
              <input
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                placeholder="Class ID"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section ID</label>
              <input
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                placeholder="Section ID (optional)"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject ID</label>
              <input
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                placeholder="Subject ID (optional)"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Reason for absence (optional)"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Suggestions Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <label className="block text-sm font-medium">Substitute Teacher ID *</label>
                <button
                  type="button"
                  onClick={fetchSuggestions}
                  disabled={!form.date || loadingSuggestions}
                  className="flex items-center gap-1.5 text-xs text-primary border border-primary rounded px-2 py-1 hover:bg-primary/5 disabled:opacity-50"
                >
                  <Users className="h-3.5 w-3.5" />
                  {loadingSuggestions ? 'Loading...' : 'Get Suggestions'}
                </button>
              </div>
              {suggestions.length > 0 && (
                <div className="mb-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-2">Available teachers on {form.date}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, substituteTeacherId: t.id })}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          form.substituteTeacherId === t.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white border-gray-300 hover:border-primary'
                        }`}
                      >
                        {t.firstName} {t.lastName} ({t.role})
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                required
                value={form.substituteTeacherId}
                onChange={(e) => setForm({ ...form, substituteTeacherId: e.target.value })}
                placeholder="Substitute Teacher ID"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Assigning...' : 'Assign'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setSuggestions([]); }}
                className="px-5 py-2 rounded-md text-sm border hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            {dateFilter ? `Substitutions on ${formatDate(dateFilter)}` : 'All Substitution Assignments'}
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No substitute assignments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Original Teacher</th>
                  <th className="text-left px-4 py-3 font-medium">Substitute</th>
                  <th className="text-left px-4 py-3 font-medium">Class</th>
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {a.originalTeacherId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {a.substituteTeacherId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{a.classId}</td>
                    <td className="px-4 py-3 text-xs">{a.subjectId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">
                      {a.reason || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}
                      >
                        {STATUS_ICONS[a.status]}
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {a.status === 'ASSIGNED' && (
                          <button
                            disabled={actioningId === a.id}
                            onClick={() => updateStatus(a.id, 'accept')}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 disabled:opacity-50"
                          >
                            Accept
                          </button>
                        )}
                        {(a.status === 'ACCEPTED') && (
                          <button
                            disabled={actioningId === a.id}
                            onClick={() => updateStatus(a.id, 'complete')}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                        {(a.status === 'ASSIGNED' || a.status === 'ACCEPTED') && (
                          <button
                            disabled={actioningId === a.id}
                            onClick={() => updateStatus(a.id, 'cancel')}
                            className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
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

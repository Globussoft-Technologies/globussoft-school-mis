'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertOctagon, Plus, X, UserCheck, CheckCircle, Filter } from 'lucide-react';

interface Grievance {
  id: string;
  ticketNumber: string;
  submittedBy: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  closedAt?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  REOPENED: 'bg-purple-100 text-purple-700',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-800 font-bold',
};

const categoryColors: Record<string, string> = {
  ACADEMIC: 'bg-indigo-100 text-indigo-700',
  ADMINISTRATIVE: 'bg-cyan-100 text-cyan-700',
  INFRASTRUCTURE: 'bg-yellow-100 text-yellow-700',
  BULLYING: 'bg-red-100 text-red-700',
  FEE: 'bg-green-100 text-green-700',
  TRANSPORT: 'bg-purple-100 text-purple-700',
  HOSTEL: 'bg-pink-100 text-pink-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const categories = ['ACADEMIC','ADMINISTRATIVE','INFRASTRUCTURE','BULLYING','FEE','TRANSPORT','HOSTEL','OTHER'];
const priorities = ['LOW','MEDIUM','HIGH','CRITICAL'];
const statuses = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED','REOPENED'];

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Grievance | null>(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [showSubmit, setShowSubmit] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [saving, setSaving] = useState(false);

  const [submitForm, setSubmitForm] = useState({
    category: 'ACADEMIC', subject: '', description: '', priority: 'MEDIUM',
  });
  const [resolution, setResolution] = useState('');
  const [assignee, setAssignee] = useState('');

  const base = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (filterPriority) params.set('priority', filterPriority);

      const [gRes, sRes] = await Promise.all([
        fetch(`${base}/grievances?${params}`, { headers }),
        fetch(`${base}/grievances/stats`, { headers }),
      ]);
      if (gRes.ok) setGrievances(await gRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch {}
    setLoading(false);
  }, [base, filterStatus, filterCategory, filterPriority]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function submitGrievance() {
    setSaving(true);
    try {
      const res = await fetch(`${base}/grievances`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submitForm),
      });
      if (res.ok) {
        setShowSubmit(false);
        setSubmitForm({ category: 'ACADEMIC', subject: '', description: '', priority: 'MEDIUM' });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit grievance');
      }
    } catch {}
    setSaving(false);
  }

  async function resolveGrievance() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${base}/grievances/${selected.id}/resolve`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ resolution }),
      });
      if (res.ok) {
        setShowResolve(false);
        setResolution('');
        setSelected(null);
        fetchData();
      }
    } catch {}
    setSaving(false);
  }

  async function assignGrievance() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${base}/grievances/${selected.id}/assign`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ assignedTo: assignee }),
      });
      if (res.ok) {
        setShowAssign(false);
        setAssignee('');
        setSelected(null);
        fetchData();
      }
    } catch {}
    setSaving(false);
  }

  async function closeGrievance(id: string) {
    if (!confirm('Close this grievance?')) return;
    try {
      const res = await fetch(`${base}/grievances/${id}/close`, { method: 'PATCH', headers });
      if (res.ok) { setSelected(null); fetchData(); }
    } catch {}
  }

  async function reopenGrievance(id: string) {
    try {
      const res = await fetch(`${base}/grievances/${id}/reopen`, { method: 'PATCH', headers });
      if (res.ok) { setSelected(null); fetchData(); }
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertOctagon className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Grievance Management</h1>
            <p className="text-sm text-muted-foreground">Submit and track complaints and grievances</p>
          </div>
        </div>
        <button
          onClick={() => setShowSubmit(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Submit Grievance
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-600 font-medium">Open</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{stats.open}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-600 font-medium">In Progress</p>
            <p className="text-3xl font-bold text-amber-700 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium">Resolved</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-medium">Closed</p>
            <p className="text-3xl font-bold text-gray-700 mt-1">{stats.closed}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">All Priorities</option>
          {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterStatus || filterCategory || filterPriority) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterPriority(''); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grievance List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading grievances...</div>
      ) : grievances.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No grievances found. Submit one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {grievances.map((g) => (
            <div
              key={g.id}
              onClick={() => setSelected(g)}
              className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{g.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${categoryColors[g.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {g.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColors[g.priority] ?? 'bg-gray-100 text-gray-700'}`}>
                      {g.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[g.status] ?? 'bg-gray-100'}`}>
                      {g.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{g.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.description}</p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 text-right">
                  <div>{new Date(g.createdAt).toLocaleDateString()}</div>
                  {g.assignedTo && (
                    <div className="mt-1 flex items-center gap-1 justify-end">
                      <UserCheck className="h-3 w-3" />
                      <span className="truncate max-w-[80px]">{g.assignedTo.slice(0, 8)}…</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grievance Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
              <h2 className="text-lg font-bold">{selected.ticketNumber}</h2>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded font-medium ${categoryColors[selected.category] ?? 'bg-gray-100'}`}>{selected.category}</span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${priorityColors[selected.priority] ?? 'bg-gray-100'}`}>{selected.priority}</span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[selected.status] ?? 'bg-gray-100'}`}>{selected.status.replace('_', ' ')}</span>
              </div>
              <div>
                <h3 className="font-semibold">{selected.subject}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
              </div>
              {selected.assignedTo && (
                <div className="text-sm">
                  <span className="font-medium">Assigned to: </span>
                  <span className="text-muted-foreground">{selected.assignedTo}</span>
                </div>
              )}
              {selected.resolution && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                  <p className="text-sm">{selected.resolution}</p>
                  {selected.resolvedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Resolved on {new Date(selected.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Submitted: {new Date(selected.createdAt).toLocaleString()}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {!selected.assignedTo && selected.status === 'OPEN' && (
                  <button
                    onClick={() => { setShowAssign(true); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Assign
                  </button>
                )}
                {['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(selected.status) && (
                  <button
                    onClick={() => { setShowResolve(true); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Resolve
                  </button>
                )}
                {selected.status === 'RESOLVED' && (
                  <button
                    onClick={() => closeGrievance(selected.id)}
                    className="text-xs px-3 py-1.5 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                  >
                    Close
                  </button>
                )}
                {['RESOLVED', 'CLOSED'].includes(selected.status) && (
                  <button
                    onClick={() => reopenGrievance(selected.id)}
                    className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Grievance Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Submit Grievance</h2>
              <button onClick={() => setShowSubmit(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Category *</label>
                  <select
                    value={submitForm.category}
                    onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Priority</label>
                  <select
                    value={submitForm.priority}
                    onChange={(e) => setSubmitForm({ ...submitForm, priority: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Subject *</label>
                <input
                  value={submitForm.subject}
                  onChange={(e) => setSubmitForm({ ...submitForm, subject: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Description *</label>
                <textarea
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  rows={4}
                  placeholder="Provide detailed information about your grievance..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowSubmit(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button
                  onClick={submitGrievance}
                  disabled={saving || !submitForm.subject || !submitForm.description}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Resolve Grievance</h2>
              <button onClick={() => setShowResolve(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Ticket: <span className="font-mono font-bold">{selected.ticketNumber}</span>
              </p>
              <div>
                <label className="text-xs font-medium block mb-1">Resolution *</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  rows={4}
                  placeholder="Describe how the grievance was resolved..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowResolve(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button
                  onClick={resolveGrievance}
                  disabled={saving || !resolution}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                >
                  {saving ? 'Resolving...' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Assign Grievance</h2>
              <button onClick={() => setShowAssign(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Ticket: <span className="font-mono font-bold">{selected.ticketNumber}</span>
              </p>
              <div>
                <label className="text-xs font-medium block mb-1">Assign to (User ID or Name) *</label>
                <input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Enter user ID or name"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAssign(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button
                  onClick={assignGrievance}
                  disabled={saving || !assignee}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                >
                  {saving ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

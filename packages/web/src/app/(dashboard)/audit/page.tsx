'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface PaginatedLogs {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Constants ───────────────────────────────────────────────────

const ACTION_OPTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'APPROVE', 'REJECT',
];

const ENTITY_OPTIONS = [
  'Student', 'Attendance', 'Payment', 'Incident', 'User', 'Syllabus',
  'Assignment', 'Compliance', 'Exam', 'LmsContent', 'Timetable', 'Fees',
];

// ─── Action badge colours ─────────────────────────────────────────

function actionBadgeClass(action: string): string {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    case 'LOGIN': return 'bg-emerald-100 text-emerald-800';
    case 'LOGOUT': return 'bg-gray-100 text-gray-700';
    case 'APPROVE': return 'bg-teal-100 text-teal-800';
    case 'REJECT': return 'bg-orange-100 text-orange-800';
    case 'VIEW': return 'bg-slate-100 text-slate-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// ─── Page component ───────────────────────────────────────────────

export default function AuditLogsPage() {
  const router = useRouter();

  // Filters
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Data
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [router]);

  // ─── Fetch ────────────────────────────────────────────────────
  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (entity) params.set('entity', entity);
        if (action) params.set('action', action);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (userSearch) params.set('userId', userSearch);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/audit/logs?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result: PaginatedLogs = await res.json();
        setLogs(result.data);
        setMeta(result.meta);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    },
    [entity, action, startDate, endDate, userSearch],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchLogs(1);
  }

  function formatDetails(details: unknown): string {
    if (!details) return '—';
    if (typeof details === 'string') return details;
    try {
      const str = JSON.stringify(details);
      return str.length > 80 ? str.slice(0, 80) + '…' : str;
    } catch {
      return '—';
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="bg-card border rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {/* Entity filter */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Entity</label>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm bg-background"
          >
            <option value="">All entities</option>
            {ENTITY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Action filter */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm bg-background"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm bg-background"
          />
        </div>

        {/* End date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm bg-background"
          />
        </div>

        {/* User ID search */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
          <input
            type="text"
            placeholder="User UUID"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm bg-background"
          />
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded px-3 py-1.5 text-sm font-medium hover:opacity-90"
          >
            Search
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-2 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Results summary */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${meta.total} records`}
        </p>
        <div className="flex gap-2">
          <button
            disabled={meta.page <= 1 || loading}
            onClick={() => fetchLogs(meta.page - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-muted"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-sm text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages || loading}
            onClick={() => fetchLogs(meta.page + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-muted"
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">User ID</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entity</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entity ID</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Details</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs truncate max-w-[120px]">
                    {log.userId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${actionBadgeClass(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{log.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                    {log.entityId || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                    {formatDetails(log.details)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {log.ipAddress || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={meta.page <= 1 || loading}
            onClick={() => fetchLogs(meta.page - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-muted"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages || loading}
            onClick={() => fetchLogs(meta.page + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-muted"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

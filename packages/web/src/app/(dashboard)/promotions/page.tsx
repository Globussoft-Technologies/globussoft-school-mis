'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowUpCircle, RefreshCw, ChevronDown } from 'lucide-react';

interface PromotionRecord {
  id: string;
  status: string;
  overallPercentage: number | null;
  remarks: string | null;
  student: {
    id: string;
    admissionNo: string;
    user: { firstName: string; lastName: string };
    class: { name: string; grade: number };
    section: { name: string };
  };
}

interface Class {
  id: string;
  name: string;
  grade: number;
}

interface AcademicSession {
  id: string;
  name: string;
  status: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROMOTED: 'bg-green-100 text-green-700',
  RETAINED: 'bg-red-100 text-red-700',
  DETAINED: 'bg-gray-100 text-gray-700',
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Load supporting data
  useEffect(() => {
    const headers = getHeaders();
    Promise.all([
      fetch('/api/v1/classes', { headers }),
      fetch('/api/v1/academic-sessions', { headers }),
    ]).then(async ([clsRes, sessRes]) => {
      if (clsRes.ok) {
        const d = await clsRes.json();
        setClasses(Array.isArray(d) ? d : d.data ?? []);
      }
      if (sessRes.ok) {
        const d = await sessRes.json();
        const list: AcademicSession[] = Array.isArray(d) ? d : d.data ?? [];
        setSessions(list);
        const active = list.find((s) => s.status === 'ACTIVE');
        if (active) setSelectedSession(active.id);
      }
    });
  }, []);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass) params.set('classId', selectedClass);
      if (selectedSession) params.set('academicSessionId', selectedSession);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/v1/promotions?${params}`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setPromotions(Array.isArray(d) ? d : d.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSession, statusFilter]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const generatePromotions = async () => {
    if (!selectedClass || !selectedSession) {
      showMessage('Please select a class and academic session first', 'error');
      return;
    }
    setActionLoading('generate');
    try {
      const res = await fetch('/api/v1/promotions/generate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ classId: selectedClass, academicSessionId: selectedSession }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message || 'Promotions generated successfully', 'success');
        loadPromotions();
      } else {
        showMessage(data.message || 'Failed to generate promotions', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const processPromotion = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/promotions/${id}/process`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showMessage(`Student marked as ${status.toLowerCase()}`, 'success');
        loadPromotions();
      } else {
        const d = await res.json();
        showMessage(d.message || 'Failed to process promotion', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const bulkPromote = async () => {
    if (!selectedClass || !selectedSession) {
      showMessage('Please select a class and academic session first', 'error');
      return;
    }
    setActionLoading('bulk');
    try {
      const res = await fetch('/api/v1/promotions/bulk-process', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ classId: selectedClass, academicSessionId: selectedSession }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(`${data.message} — Promoted: ${data.promoted}, Retained: ${data.retained}`, 'success');
        loadPromotions();
      } else {
        showMessage(data.message || 'Bulk process failed', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = promotions.filter((p) => p.status === 'PENDING').length;
  const eligibleCount = promotions.filter(
    (p) => p.status === 'PENDING' && p.overallPercentage != null && p.overallPercentage >= 33,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowUpCircle className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Student Promotions</h1>
            <p className="text-sm text-muted-foreground">Year-end promotion workflow</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generatePromotions}
            disabled={actionLoading === 'generate'}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading === 'generate' ? 'animate-spin' : ''}`} />
            Generate Promotions
          </button>
          <button
            onClick={bulkPromote}
            disabled={actionLoading === 'bulk' || eligibleCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Bulk Promote All Eligible ({eligibleCount})
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-card border rounded-lg p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background min-w-[160px]"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Academic Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background min-w-[160px]"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROMOTED">Promoted</option>
            <option value="RETAINED">Retained</option>
            <option value="DETAINED">Detained</option>
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['PENDING', 'PROMOTED', 'RETAINED', 'DETAINED'] as const).map((s) => {
          const count = promotions.filter((p) => p.status === s).length;
          return (
            <div key={s} className="bg-card border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[s]}`}>{s}</span>
            </div>
          );
        })}
      </div>

      {/* Promotions Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading promotions...</div>
          ) : promotions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No promotions found. Select a class and session, then click &quot;Generate Promotions&quot;.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Admission No</th>
                  <th className="text-left px-4 py-3 font-medium">Current Class</th>
                  <th className="text-left px-4 py-3 font-medium">Percentage</th>
                  <th className="text-left px-4 py-3 font-medium">Suggested</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promotions.map((p) => {
                  const pct = p.overallPercentage;
                  const suggested = pct == null ? 'N/A' : pct >= 33 ? 'PROMOTED' : 'RETAINED';
                  return (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        {p.student?.user?.firstName ?? ''} {p.student?.user?.lastName ?? p.studentId?.substring(0, 8) ?? ''}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.student?.admissionNo ?? '--'}</td>
                      <td className="px-4 py-3">
                        {p.student?.class?.name ?? p.fromClassId?.substring(0, 8) ?? '--'} – {p.student?.section?.name ?? ''}
                      </td>
                      <td className="px-4 py-3">
                        {pct != null ? (
                          <span
                            className={`font-medium ${pct >= 33 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No grades</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {suggested !== 'N/A' && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${statusColors[suggested]}`}
                          >
                            {suggested}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status]}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => processPromotion(p.id, 'PROMOTED')}
                              disabled={actionLoading === p.id}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Promote
                            </button>
                            <button
                              onClick={() => processPromotion(p.id, 'RETAINED')}
                              disabled={actionLoading === p.id}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Retain
                            </button>
                          </div>
                        )}
                        {p.status !== 'PENDING' && p.remarks && (
                          <span className="text-xs text-muted-foreground italic">{p.remarks}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Percent, Plus, X, CheckCircle, XCircle } from 'lucide-react';

interface Concession {
  id: string;
  studentId: string;
  feeHeadId: string;
  type: string;
  discountPercent: number | null;
  discountAmount: number | null;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  createdAt: string;
  student: {
    admissionNo: string;
    user: { firstName: string; lastName: string };
    class: { name: string };
    section: { name: string };
  };
  feeHead: { name: string; amount: number };
}

interface Student {
  id: string;
  admissionNo: string;
  user: { firstName: string; lastName: string };
}

interface FeeHead {
  id: string;
  name: string;
  amount: number;
}

const typeColors: Record<string, string> = {
  SCHOLARSHIP: 'bg-purple-100 text-purple-700',
  SIBLING: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-indigo-100 text-indigo-700',
  MERIT: 'bg-green-100 text-green-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  studentId: '',
  feeHeadId: '',
  type: 'SCHOLARSHIP',
  reason: '',
  discountType: 'percent' as 'percent' | 'amount',
  discountPercent: '',
  discountAmount: '',
};

export default function ConcessionsPage() {
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    const headers = getHeaders();
    Promise.all([
      fetch('/api/v1/students', { headers }),
      fetch('/api/v1/fees/heads', { headers }),
    ]).then(async ([stuRes, fhRes]) => {
      if (stuRes.ok) {
        const d = await stuRes.json();
        setStudents(Array.isArray(d) ? d : d.data ?? []);
      }
      if (fhRes.ok) {
        const d = await fhRes.json();
        setFeeHeads(Array.isArray(d) ? d : d.data ?? []);
      }
    });
  }, []);

  const loadConcessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/v1/concessions?${params}`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setConcessions(Array.isArray(d) ? d : d.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    loadConcessions();
  }, [loadConcessions]);

  const handleCreate = async () => {
    if (!form.studentId || !form.feeHeadId || !form.reason) {
      showMsg('Student, fee head, and reason are required', 'error');
      return;
    }
    if (form.discountType === 'percent' && !form.discountPercent) {
      showMsg('Please enter a discount percentage', 'error');
      return;
    }
    if (form.discountType === 'amount' && !form.discountAmount) {
      showMsg('Please enter a discount amount', 'error');
      return;
    }

    setActionLoading('create');
    try {
      const body: Record<string, unknown> = {
        studentId: form.studentId,
        feeHeadId: form.feeHeadId,
        type: form.type,
        reason: form.reason,
      };
      if (form.discountType === 'percent') {
        body.discountPercent = parseFloat(form.discountPercent);
      } else {
        body.discountAmount = parseFloat(form.discountAmount);
      }

      const res = await fetch('/api/v1/concessions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showMsg('Concession request created successfully', 'success');
        setShowForm(false);
        setForm(EMPTY_FORM);
        loadConcessions();
      } else {
        const d = await res.json();
        showMsg(d.message || 'Failed to create concession', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/concessions/${id}/approve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showMsg(`Concession ${status.toLowerCase()}`, 'success');
        loadConcessions();
      } else {
        const d = await res.json();
        showMsg(d.message || 'Action failed', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Concessions & Scholarships</h1>
            <p className="text-sm text-muted-foreground">Manage fee concession requests and approvals</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Concession
        </button>
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

      {/* New Concession Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Concession Request</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                >
                  <option value="">Search student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName} ({s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Fee Head</label>
                <select
                  value={form.feeHeadId}
                  onChange={(e) => setForm({ ...form, feeHeadId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                >
                  <option value="">Select fee head...</option>
                  {feeHeads.map((fh) => (
                    <option key={fh.id} value={fh.id}>
                      {fh.name} (₹{fh.amount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                >
                  <option value="SCHOLARSHIP">Scholarship</option>
                  <option value="SIBLING">Sibling Discount</option>
                  <option value="STAFF">Staff Ward</option>
                  <option value="MERIT">Merit Based</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value="percent"
                      checked={form.discountType === 'percent'}
                      onChange={() => setForm({ ...form, discountType: 'percent', discountAmount: '' })}
                    />
                    Percentage (%)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value="amount"
                      checked={form.discountType === 'amount'}
                      onChange={() => setForm({ ...form, discountType: 'amount', discountPercent: '' })}
                    />
                    Fixed Amount (₹)
                  </label>
                </div>
              </div>

              {form.discountType === 'percent' ? (
                <div>
                  <label className="text-sm font-medium">Discount Percentage</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Reason</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Reason for concession..."
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={actionLoading === 'create'}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create Request'}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-card border rounded-lg p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          >
            <option value="">All Types</option>
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="SIBLING">Sibling</option>
            <option value="STAFF">Staff</option>
            <option value="MERIT">Merit</option>
            <option value="OTHER">Other</option>
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
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : concessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No concessions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Class</th>
                  <th className="text-left px-4 py-3 font-medium">Fee Head</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Discount</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {concessions.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {c.student.user.firstName} {c.student.user.lastName}
                      <div className="text-xs text-muted-foreground">{c.student.admissionNo}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.student.class.name} – {c.student.section.name}
                    </td>
                    <td className="px-4 py-3">{c.feeHead.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[c.type] ?? 'bg-gray-100 text-gray-700'}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.discountPercent != null ? (
                        <span className="font-medium">{c.discountPercent}%</span>
                      ) : c.discountAmount != null ? (
                        <span className="font-medium">₹{c.discountAmount}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                      {c.reason ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(c.id, 'APPROVED')}
                            disabled={actionLoading === c.id}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprove(c.id, 'REJECTED')}
                            disabled={actionLoading === c.id}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  CalendarOff,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
} from 'lucide-react';

interface StudentLeave {
  id: string;
  studentId: string;
  appliedBy: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
  APPROVED: <CheckCircle className="h-4 w-4 text-green-600" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
};

const LEAVE_TYPES = ['SICK', 'FAMILY', 'VACATION', 'OTHER'];

function formatLeaveType(type: string) {
  return type[0] + type.slice(1).toLowerCase();
}

function daysBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff;
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<StudentLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [studentIdFilter, setStudentIdFilter] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({
    studentId: '',
    type: 'SICK',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function loadLeaves() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (studentIdFilter) params.set('studentId', studentIdFilter);
      const res = await fetch(`${base}/student-leaves?${params}`, {
        headers: getHeaders(),
      });
      if (res.ok) setLeaves(await res.json());
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaves();
  }, [statusFilter, studentIdFilter]);

  async function handleApprove(id: string, status: 'APPROVED' | 'REJECTED') {
    setApprovingId(id + status);
    try {
      const res = await fetch(`${base}/student-leaves/${id}/approve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage({ text: `Leave ${status.toLowerCase()}.`, ok: true });
        await loadLeaves();
      } else {
        setMessage({ text: 'Action failed.', ok: false });
      }
    } catch {
      setMessage({ text: 'Network error.', ok: false });
    } finally {
      setApprovingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/student-leaves`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(applyForm),
      });
      if (res.ok) {
        setMessage({ text: 'Leave application submitted.', ok: true });
        setApplyForm({ studentId: '', type: 'SICK', startDate: '', endDate: '', reason: '' });
        setShowApplyForm(false);
        await loadLeaves();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ text: err.message || 'Submission failed.', ok: false });
      }
    } catch {
      setMessage({ text: 'Network error.', ok: false });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarOff className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Leave Requests</h1>
        </div>
        <button
          onClick={() => setShowApplyForm(!showApplyForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Apply for Leave
        </button>
      </div>

      {/* Flash message */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-md text-sm ${
            message.ok
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Apply Form */}
      {showApplyForm && (
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Apply for Student Leave</h2>
          <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                placeholder="Student ID"
                value={applyForm.studentId}
                onChange={(e) => setApplyForm((f) => ({ ...f, studentId: e.target.value }))}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Leave Type</label>
              <select
                value={applyForm.type}
                onChange={(e) => setApplyForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatLeaveType(t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={applyForm.startDate}
                onChange={(e) => setApplyForm((f) => ({ ...f, startDate: e.target.value }))}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={applyForm.endDate}
                onChange={(e) => setApplyForm((f) => ({ ...f, endDate: e.target.value }))}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea
                placeholder="Reason for leave..."
                value={applyForm.reason}
                onChange={(e) => setApplyForm((f) => ({ ...f, reason: e.target.value }))}
                required
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-50">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Student ID:</label>
          <input
            type="text"
            placeholder="Filter by student..."
            value={studentIdFilter}
            onChange={(e) => setStudentIdFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Leave Applications ({leaves.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No leave applications found.
          </div>
        ) : (
          <div className="divide-y">
            {leaves.map((leave) => (
              <div key={leave.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {statusIcons[leave.status]}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          Student: <span className="font-mono text-xs">{leave.studentId}</span>
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[leave.status]}`}
                        >
                          {leave.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {formatLeaveType(leave.type)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(leave.startDate).toLocaleDateString()} &ndash;{' '}
                        {new Date(leave.endDate).toLocaleDateString()} &bull;{' '}
                        {daysBetween(leave.startDate, leave.endDate)} day
                        {daysBetween(leave.startDate, leave.endDate) !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm mt-1">{leave.reason}</p>
                      {leave.remarks && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          Remarks: {leave.remarks}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied: {new Date(leave.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {leave.status === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(leave.id, 'APPROVED')}
                        disabled={approvingId === leave.id + 'APPROVED'}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded hover:bg-green-100 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(leave.id, 'REJECTED')}
                        disabled={approvingId === leave.id + 'REJECTED'}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

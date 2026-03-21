'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Clock, XCircle, ChevronRight } from 'lucide-react';

interface ResultPublication {
  id: string;
  classId: string;
  subjectId: string;
  academicSessionId: string;
  term: string;
  status: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const PIPELINE_STAGES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function Pipeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = PIPELINE_STAGES.indexOf(currentStatus);
  const isRejected = currentStatus === 'REJECTED';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PIPELINE_STAGES.map((stage, i) => {
        const done = !isRejected && currentIdx > i;
        const active = !isRejected && currentIdx === i;
        return (
          <div key={stage} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              done ? 'bg-green-100 text-green-700' :
              active ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? <CheckCircle className="h-3 w-3" /> :
               active ? <Clock className="h-3 w-3" /> :
               <Circle className="h-3 w-3" />}
              {stage.replace('_', ' ')}
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <ChevronRight className="h-3 w-3 text-gray-300" />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="h-3 w-3" /> REJECTED
        </div>
      )}
    </div>
  );
}

export default function ResultWorkflowPage() {
  const [records, setRecords] = useState<ResultPublication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ResultPublication | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submitForm, setSubmitForm] = useState({
    classId: '', subjectId: '', sessionId: '', term: 'TERM_1', submittedBy: '',
  });

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const fetchRecords = () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (filterClass) params.set('classId', filterClass);
    if (filterStatus) params.set('status', filterStatus);
    if (filterTerm) params.set('term', filterTerm);
    fetch(`/api/v1/result-workflow?${params}`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setRecords(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load records'); setLoading(false); });
  };

  useEffect(() => { fetchRecords(); }, [filterClass, filterStatus, filterTerm]);

  const doAction = async (url: string, method: string, body?: object) => {
    const res = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? `HTTP ${res.status}`);
    }
    return res.json();
  };

  const handleSubmit = async () => {
    setActionLoading('submit');
    try {
      await doAction('/api/v1/result-workflow/submit', 'POST', submitForm);
      setShowSubmitForm(false);
      setSubmitForm({ classId: '', subjectId: '', sessionId: '', term: 'TERM_1', submittedBy: '' });
      fetchRecords();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setActionLoading(null); }
  };

  const handleReview = async (id: string, status: 'UNDER_REVIEW' | 'REJECTED') => {
    setActionLoading(id);
    try {
      await doAction(`/api/v1/result-workflow/${id}/review`, 'PATCH', {
        reviewedBy: 'Coordinator',
        status,
        remarks: reviewRemarks,
      });
      setShowRejectForm(null);
      setReviewRemarks('');
      fetchRecords();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setActionLoading(null); }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await doAction(`/api/v1/result-workflow/${id}/approve`, 'PATCH', { approvedBy: 'Principal' });
      fetchRecords();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setActionLoading(null); }
  };

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      await doAction(`/api/v1/result-workflow/${id}/publish`, 'PATCH');
      fetchRecords();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await doAction(`/api/v1/result-workflow/${id}/reject`, 'PATCH', {
        rejectionReason: rejectReason,
        rejectedBy: 'Coordinator',
      });
      setShowRejectForm(null);
      setRejectReason('');
      fetchRecords();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setActionLoading(null); }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Result Publication Workflow</h1>
        <button
          onClick={() => setShowSubmitForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + Submit Results
        </button>
      </div>

      {/* Pipeline legend */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Publication Pipeline</p>
        <Pipeline currentStatus="PUBLISHED" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          placeholder="Filter by Class ID"
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background w-44"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background w-44"
        >
          <option value="">All Statuses</option>
          {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={filterTerm}
          onChange={e => setFilterTerm(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background w-44"
        >
          <option value="">All Terms</option>
          <option value="TERM_1">Term 1</option>
          <option value="TERM_2">Term 2</option>
          <option value="ANNUAL">Annual</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Submit Results for Review</h2>
            <div className="space-y-3">
              {(['classId', 'subjectId', 'sessionId', 'submittedBy'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 capitalize">
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    value={submitForm[field]}
                    onChange={e => setSubmitForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Term</label>
                <select
                  value={submitForm.term}
                  onChange={e => setSubmitForm(f => ({ ...f, term: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="TERM_1">Term 1</option>
                  <option value="TERM_2">Term 2</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowSubmitForm(false)} className="px-3 py-2 text-sm border rounded-md hover:bg-muted">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={actionLoading === 'submit'}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading === 'submit' ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Form Modal */}
      {showRejectForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Reject / Send Back</h2>
            <textarea
              rows={3}
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowRejectForm(null)} className="px-3 py-2 text-sm border rounded-md hover:bg-muted">Cancel</button>
              <button
                onClick={() => handleReject(showRejectForm)}
                disabled={!rejectReason || actionLoading === showRejectForm}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === showRejectForm ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Status Timeline</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <Pipeline currentStatus={selectedRecord.status} />
            <div className="mt-4 space-y-3">
              {[
                { label: 'Submitted', at: selectedRecord.submittedAt, by: selectedRecord.submittedBy },
                { label: 'Reviewed', at: selectedRecord.reviewedAt, by: selectedRecord.reviewedBy, remarks: selectedRecord.reviewRemarks },
                { label: 'Approved', at: selectedRecord.approvedAt, by: selectedRecord.approvedBy },
                { label: 'Published', at: selectedRecord.publishedAt },
              ].filter(t => t.at).map((t, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{fmt(t.at)}{t.by ? ` by ${t.by}` : ''}</p>
                    {t.remarks && <p className="text-xs text-muted-foreground italic">{t.remarks}</p>}
                  </div>
                </div>
              ))}
              {selectedRecord.status === 'REJECTED' && (
                <div className="flex gap-3 items-start">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Rejected</p>
                    {selectedRecord.rejectionReason && (
                      <p className="text-xs text-muted-foreground">{selectedRecord.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : records.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center text-muted-foreground">
          No result publications found.
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-3 font-semibold">Class ID</th>
                <th className="px-4 py-3 font-semibold">Subject ID</th>
                <th className="px-4 py-3 font-semibold">Term</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Pipeline</th>
                <th className="px-4 py-3 font-semibold">Last Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{r.classId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.subjectId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{r.term.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedRecord(r)} className="text-xs text-primary underline">
                      View Timeline
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(r.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {r.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => handleReview(r.id, 'UNDER_REVIEW')}
                            disabled={actionLoading === r.id}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => { setShowRejectForm(r.id); setRejectReason(''); }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'UNDER_REVIEW' && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={actionLoading === r.id}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handlePublish(r.id)}
                          disabled={actionLoading === r.id}
                          className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50"
                        >
                          Publish
                        </button>
                      )}
                      {r.status === 'REJECTED' && (
                        <span className="px-2 py-1 text-xs text-muted-foreground">Returned to Teacher</span>
                      )}
                      {r.status === 'PUBLISHED' && (
                        <span className="px-2 py-1 text-xs text-emerald-700">Live</span>
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
  );
}

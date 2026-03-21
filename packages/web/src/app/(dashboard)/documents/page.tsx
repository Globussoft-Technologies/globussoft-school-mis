'use client';

import { useEffect, useState } from 'react';
import {
  FolderOpen,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  Trash2,
  ShieldCheck,
  Search,
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'BIRTH_CERTIFICATE',
  'TRANSFER_CERTIFICATE',
  'AADHAAR',
  'PHOTO',
  'MEDICAL',
  'REPORT_CARD',
  'CONSENT_FORM',
  'ADDRESS_PROOF',
  'OTHER',
];

interface DocumentItem {
  id: string;
  studentId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
}

interface ChecklistItem {
  type: string;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED';
  document: DocumentItem | null;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  VERIFIED: 'bg-green-100 text-green-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <XCircle className="h-4 w-4 text-gray-400" />,
  SUBMITTED: <Clock className="h-4 w-4 text-yellow-500" />,
  VERIFIED: <CheckCircle className="h-4 w-4 text-green-600" />,
};

function formatDocType(type: string) {
  return type
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}

export default function DocumentsPage() {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [activeStudentId, setActiveStudentId] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    type: 'BIRTH_CERTIFICATE',
    fileName: '',
    fileUrl: '',
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function loadData(studentId: string) {
    if (!studentId.trim()) return;
    setLoading(true);
    try {
      const [docsRes, checklistRes] = await Promise.all([
        fetch(`${base}/documents?studentId=${studentId}`, { headers: getHeaders() }),
        fetch(`${base}/documents/checklist?studentId=${studentId}`, { headers: getHeaders() }),
      ]);
      if (docsRes.ok) setDocuments(await docsRes.json());
      if (checklistRes.ok) setChecklist(await checklistRes.json());
    } catch {
      // network error handled silently
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setActiveStudentId(studentIdInput.trim());
  }

  useEffect(() => {
    if (activeStudentId) {
      loadData(activeStudentId);
    }
  }, [activeStudentId]);

  async function handleVerify(docId: string) {
    setVerifyingId(docId);
    try {
      const res = await fetch(`${base}/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setMessage({ text: 'Document verified successfully.', ok: true });
        await loadData(activeStudentId);
      } else {
        setMessage({ text: 'Failed to verify document.', ok: false });
      }
    } catch {
      setMessage({ text: 'Network error.', ok: false });
    } finally {
      setVerifyingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`${base}/documents/${docId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setMessage({ text: 'Document deleted.', ok: true });
        await loadData(activeStudentId);
      } else {
        setMessage({ text: 'Failed to delete document.', ok: false });
      }
    } catch {
      setMessage({ text: 'Network error.', ok: false });
    } finally {
      setDeletingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!activeStudentId) {
      setMessage({ text: 'Search for a student first.', ok: false });
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(`${base}/documents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          studentId: activeStudentId,
          type: uploadForm.type,
          fileName: uploadForm.fileName,
          fileUrl: uploadForm.fileUrl,
          notes: uploadForm.notes || undefined,
        }),
      });
      if (res.ok) {
        setMessage({ text: 'Document uploaded successfully.', ok: true });
        setUploadForm({ type: 'BIRTH_CERTIFICATE', fileName: '', fileUrl: '', notes: '' });
        setShowUploadForm(false);
        await loadData(activeStudentId);
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ text: err.message || 'Upload failed.', ok: false });
      }
    } catch {
      setMessage({ text: 'Network error.', ok: false });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const submittedCount = checklist.filter((c) => c.status !== 'PENDING').length;
  const verifiedCount = checklist.filter((c) => c.status === 'VERIFIED').length;
  const pendingCount = checklist.filter((c) => c.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Document Management</h1>
        </div>
        {activeStudentId && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Flash message */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-md text-sm ${
            message.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter Student ID..."
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Search
          </button>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Document Type</label>
              <select
                value={uploadForm.type}
                onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatDocType(t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">File Name</label>
              <input
                type="text"
                placeholder="e.g. birth_certificate.pdf"
                value={uploadForm.fileName}
                onChange={(e) => setUploadForm((f) => ({ ...f, fileName: e.target.value }))}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">File URL</label>
              <input
                type="text"
                placeholder="https://s3.example.com/docs/..."
                value={uploadForm.fileUrl}
                onChange={(e) => setUploadForm((f) => ({ ...f, fileUrl: e.target.value }))}
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="Any notes..."
                value={uploadForm.notes}
                onChange={(e) => setUploadForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats + Checklist */}
      {activeStudentId && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Submitted</p>
              <p className="text-2xl font-bold text-yellow-600">{submittedCount}</p>
              <p className="text-xs text-muted-foreground">of {checklist.length} required</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Verified</p>
              <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-500">{pendingCount}</p>
            </div>
          </div>

          {/* Document Checklist */}
          <div className="bg-card rounded-lg border mb-6">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Document Checklist</h2>
              <p className="text-sm text-muted-foreground">
                Student ID: <span className="font-mono text-xs">{activeStudentId}</span>
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : (
              <div className="divide-y">
                {checklist.map((item) => (
                  <div key={item.type} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusIcons[item.status]}
                      <div>
                        <p className="text-sm font-medium">{formatDocType(item.type)}</p>
                        {item.document && (
                          <p className="text-xs text-muted-foreground">
                            {item.document.fileName}
                            {item.document.verifiedAt &&
                              ` · Verified ${new Date(item.document.verifiedAt).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[item.status]}`}
                      >
                        {item.status}
                      </span>
                      {item.document && !item.document.verified && (
                        <button
                          onClick={() => handleVerify(item.document!.id)}
                          disabled={verifyingId === item.document.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verify
                        </button>
                      )}
                      {item.document && (
                        <button
                          onClick={() => handleDelete(item.document!.id)}
                          disabled={deletingId === item.document.id}
                          className="text-xs p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No checklist data found for this student.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* All Uploaded Documents */}
          {documents.length > 0 && (
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="font-semibold">All Documents ({documents.length})</h2>
              </div>
              <div className="divide-y">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{formatDocType(doc.type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileName} &bull;{' '}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground italic">{doc.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          doc.verified ? statusColors.VERIFIED : statusColors.SUBMITTED
                        }`}
                      >
                        {doc.verified ? 'VERIFIED' : 'SUBMITTED'}
                      </span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2 py-1 border rounded hover:bg-muted"
                      >
                        View
                      </a>
                      {!doc.verified && (
                        <button
                          onClick={() => handleVerify(doc.id)}
                          disabled={verifyingId === doc.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-xs p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state if no search */}
      {!activeStudentId && (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Enter a Student ID to view documents</p>
        </div>
      )}
    </div>
  );
}

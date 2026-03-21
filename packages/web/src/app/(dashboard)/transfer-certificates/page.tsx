'use client';

import { useEffect, useState } from 'react';
import { FileOutput, Plus, Printer, XCircle, CheckCircle, X } from 'lucide-react';

interface TC {
  id: string;
  tcNumber: string;
  dateOfIssue: string;
  reasonForLeaving: string;
  lastClassAttended: string;
  lastExamPassed?: string;
  conductAndCharacter: string;
  generalRemarks?: string;
  issuedBy: string;
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
  student?: {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    section: string;
  };
}

interface PrintData {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  tcNumber: string;
  dateOfIssue: string;
  studentName: string;
  admissionNo: string;
  dateOfBirth: string | null;
  gender: string;
  class: string;
  reasonForLeaving: string;
  lastExamPassed: string;
  conductAndCharacter: string;
  generalRemarks: string;
  issuedBy: string;
  status: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  ISSUED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function TransferCertificatesPage() {
  const [tcs, setTcs] = useState<TC[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ studentId: '', reasonForLeaving: '', issuedBy: '' });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  async function loadTcs() {
    setLoading(true);
    try {
      const url = statusFilter
        ? `${base}/transfer-certificates?status=${statusFilter}`
        : `${base}/transfer-certificates`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) setTcs(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadTcs(); }, [statusFilter]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.reasonForLeaving || !form.issuedBy) return;
    setSaving(true);
    try {
      const res = await fetch(`${base}/transfer-certificates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ studentId: '', reasonForLeaving: '', issuedBy: '' });
        loadTcs();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to generate TC');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleIssue(id: string) {
    if (!confirm('Issue this TC? The student will be marked inactive.')) return;
    setActionLoading(id + '-issue');
    try {
      const res = await fetch(`${base}/transfer-certificates/${id}/issue`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) loadTcs();
      else { const e = await res.json(); alert(e.message || 'Failed'); }
    } catch { alert('Network error'); }
    setActionLoading(null);
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this TC?')) return;
    setActionLoading(id + '-cancel');
    try {
      const res = await fetch(`${base}/transfer-certificates/${id}/cancel`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) loadTcs();
      else { const e = await res.json(); alert(e.message || 'Failed'); }
    } catch { alert('Network error'); }
    setActionLoading(null);
  }

  async function handlePrint(id: string) {
    try {
      const res = await fetch(`${base}/transfer-certificates/${id}/print`, { headers: getHeaders() });
      if (res.ok) setPrintData(await res.json());
    } catch { alert('Failed to load print data'); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileOutput className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Transfer Certificates</h1>
            <p className="text-sm text-muted-foreground">Generate and manage student TCs</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Generate TC
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'DRAFT', 'ISSUED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">TC Number</th>
              <th className="text-left px-4 py-3 font-medium">Student</th>
              <th className="text-left px-4 py-3 font-medium">Class</th>
              <th className="text-left px-4 py-3 font-medium">Reason</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : tcs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No transfer certificates found</td></tr>
            ) : (
              tcs.map((tc) => (
                <tr key={tc.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium text-primary">{tc.tcNumber}</td>
                  <td className="px-4 py-3">
                    {tc.student ? (
                      <div>
                        <div className="font-medium">{tc.student.name}</div>
                        <div className="text-xs text-muted-foreground">{tc.student.admissionNo}</div>
                      </div>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{tc.lastClassAttended}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <span className="truncate block text-xs text-muted-foreground">{tc.reasonForLeaving}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(tc.dateOfIssue).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tc.status]}`}>
                      {tc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {tc.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleIssue(tc.id)}
                            disabled={actionLoading === tc.id + '-issue'}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {actionLoading === tc.id + '-issue' ? '...' : 'Issue'}
                          </button>
                          <button
                            onClick={() => handleCancel(tc.id)}
                            disabled={actionLoading === tc.id + '-cancel'}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handlePrint(tc.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Printer className="h-3 w-3" /> Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate TC Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Generate Transfer Certificate</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student ID *</label>
                <input
                  type="text"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  placeholder="Enter student ID"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Leaving *</label>
                <textarea
                  value={form.reasonForLeaving}
                  onChange={(e) => setForm({ ...form, reasonForLeaving: e.target.value })}
                  placeholder="e.g., Parent relocation, Admission elsewhere..."
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issued By *</label>
                <input
                  type="text"
                  value={form.issuedBy}
                  onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
                  placeholder="Principal / Authorised Signatory"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Generating...' : 'Generate TC'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b print:hidden">
              <h2 className="text-lg font-semibold">Transfer Certificate Preview</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm"
                >
                  <Printer className="h-4 w-4" /> Print
                </button>
                <button onClick={() => setPrintData(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-8 font-serif text-sm">
              {/* TC Document */}
              <div className="text-center mb-6 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wide">{printData.schoolName}</h1>
                {printData.schoolAddress && <p className="text-sm mt-1">{printData.schoolAddress}</p>}
                {printData.schoolPhone && <p className="text-sm">Phone: {printData.schoolPhone}</p>}
                <h2 className="text-xl font-bold mt-4 underline">TRANSFER CERTIFICATE</h2>
              </div>

              <div className="flex justify-between mb-6">
                <div><strong>TC No:</strong> {printData.tcNumber}</div>
                <div><strong>Date:</strong> {new Date(printData.dateOfIssue).toLocaleDateString('en-IN')}</div>
              </div>

              <table className="w-full text-sm mb-6">
                <tbody className="space-y-2">
                  {[
                    ['Student Name', printData.studentName],
                    ['Admission No', printData.admissionNo],
                    ['Date of Birth', printData.dateOfBirth ? new Date(printData.dateOfBirth).toLocaleDateString('en-IN') : '—'],
                    ['Gender', printData.gender],
                    ['Last Class Attended', printData.class],
                    ['Last Exam Passed', printData.lastExamPassed],
                    ['Reason for Leaving', printData.reasonForLeaving],
                    ['Conduct & Character', printData.conductAndCharacter],
                    ['General Remarks', printData.generalRemarks || '—'],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-dashed">
                      <td className="py-2 pr-4 font-semibold w-48">{label}</td>
                      <td className="py-2">: {value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between mt-12 pt-8">
                <div className="text-center">
                  <div className="border-t border-black w-40 pt-1">Date &amp; Seal</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-black w-48 pt-1">
                    {printData.issuedBy}<br />
                    <span className="text-xs">(Authorised Signatory)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center mt-8 text-gray-500 italic">
                This is a computer-generated Transfer Certificate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Medal, Printer, XCircle, Plus, X, Award } from 'lucide-react';

interface Certificate {
  id: string;
  studentId: string;
  type: string;
  title: string;
  description: string | null;
  issuedDate: string;
  issuedBy: string;
  serialNumber: string;
  status: string;
  createdAt: string;
}

interface PrintData {
  certificate: Certificate;
  student: {
    id: string;
    admissionNo: string;
    name: string;
    class: string;
    section: string;
  } | null;
  printData: {
    schoolName: string;
    studentName: string;
    certificateType: string;
    title: string;
    description: string | null;
    serialNumber: string;
    issuedDate: string;
    issuedBy: string;
    status: string;
    templateData: any;
  };
}

interface Student {
  id: string;
  admissionNo: string;
  user: { firstName: string; lastName: string };
  class: { name: string };
}

interface AcademicSession {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  grade: number;
}

const CERT_TYPES = [
  'MERIT',
  'PARTICIPATION',
  'SPORTS',
  'ACHIEVEMENT',
  'ATTENDANCE',
  'CONDUCT',
  'CUSTOM',
];

const STATUS_COLORS: Record<string, string> = {
  ISSUED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  REVOKED: 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  MERIT: 'bg-yellow-100 text-yellow-700',
  PARTICIPATION: 'bg-blue-100 text-blue-700',
  SPORTS: 'bg-orange-100 text-orange-700',
  ACHIEVEMENT: 'bg-purple-100 text-purple-700',
  ATTENDANCE: 'bg-teal-100 text-teal-700',
  CONDUCT: 'bg-indigo-100 text-indigo-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMeritBulk, setShowMeritBulk] = useState(false);
  const [showAttendanceBulk, setShowAttendanceBulk] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [form, setForm] = useState({
    studentId: '',
    type: 'MERIT',
    title: '',
    description: '',
  });

  const [meritForm, setMeritForm] = useState({
    classId: '',
    academicSessionId: '',
    topN: 3,
  });

  const [attendanceForm, setAttendanceForm] = useState({
    classId: '',
    minPercentage: 90,
  });

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  }

  async function loadCertificates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const q = params.toString() ? `?${params}` : '';
      const res = await fetch(`${base}/certificates${q}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setCertificates(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  async function loadStudents() {
    try {
      const res = await fetch(`${base}/students?limit=200`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : data.data || []);
      }
    } catch {}
  }

  async function loadClasses() {
    try {
      const res = await fetch(`${base}/classes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  async function loadSessions() {
    try {
      const res = await fetch(`${base}/academic-sessions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  useEffect(() => {
    loadCertificates();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadStudents();
    loadClasses();
    loadSessions();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed');
      }
      setShowForm(false);
      setForm({ studentId: '', type: 'MERIT', title: '', description: '' });
      loadCertificates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMeritBulk(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/certificates/merit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(meritForm),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed');
      }
      const data = await res.json();
      alert(`Generated ${data.generated} merit certificates!`);
      setShowMeritBulk(false);
      loadCertificates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttendanceBulk(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/certificates/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(attendanceForm),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed');
      }
      const data = await res.json();
      alert(`Generated ${data.generated} attendance certificates!`);
      setShowAttendanceBulk(false);
      loadCertificates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Are you sure you want to revoke this certificate?')) return;
    try {
      await fetch(`${base}/certificates/${id}/revoke`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      loadCertificates();
    } catch {}
  }

  async function handlePrint(id: string) {
    try {
      const res = await fetch(`${base}/certificates/${id}/print`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setPrintData(await res.json());
    } catch {}
  }

  function doPrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Medal className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Certificates</h1>
            <p className="text-muted-foreground text-sm">Generate and manage student certificates</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAttendanceBulk(true)}
            className="border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted"
          >
            Bulk Attendance Certs
          </button>
          <button
            onClick={() => setShowMeritBulk(true)}
            className="border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted"
          >
            Bulk Merit Certs
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Generate Certificate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Status</option>
          <option value="ISSUED">Issued</option>
          <option value="DRAFT">Draft</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Types</option>
          {CERT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{certificates.length} records</span>
      </div>

      {/* Certificates Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No certificates found.</div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium">Serial No.</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Issued Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{cert.serialNumber}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        TYPE_COLORS[cert.type] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cert.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{cert.title}</td>
                  <td className="px-4 py-3">
                    {new Date(cert.issuedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[cert.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrint(cert.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Print Certificate"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      {cert.status !== 'REVOKED' && (
                        <button
                          onClick={() => handleRevoke(cert.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Revoke"
                        >
                          <XCircle className="h-4 w-4" />
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

      {/* Generate Certificate Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Generate Certificate</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName} ({s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {CERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="e.g. Certificate of Achievement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
                  placeholder="Certificate description..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Generate'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Merit Modal */}
      {showMeritBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Bulk Merit Certificates</h2>
              <button onClick={() => setShowMeritBulk(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleMeritBulk} className="p-6 space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select
                  value={meritForm.classId}
                  onChange={(e) => setMeritForm({ ...meritForm, classId: e.target.value })}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Academic Session</label>
                <select
                  value={meritForm.academicSessionId}
                  onChange={(e) => setMeritForm({ ...meritForm, academicSessionId: e.target.value })}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select Session</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Top N Students</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={meritForm.topN}
                  onChange={(e) => setMeritForm({ ...meritForm, topN: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Generate Merit Certs'}
                </button>
                <button type="button" onClick={() => setShowMeritBulk(false)} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {showAttendanceBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Bulk Attendance Certificates</h2>
              <button onClick={() => setShowAttendanceBulk(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAttendanceBulk} className="p-6 space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select
                  value={attendanceForm.classId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, classId: e.target.value })}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Attendance %</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={attendanceForm.minPercentage}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, minPercentage: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">Students with attendance at or above this % will receive a certificate</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Generate Attendance Certs'}
                </button>
                <button type="button" onClick={() => setShowAttendanceBulk(false)} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
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
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b print:hidden">
              <h2 className="text-lg font-semibold">Certificate Preview</h2>
              <div className="flex gap-2">
                <button
                  onClick={doPrint}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" /> Print
                </button>
                <button onClick={() => setPrintData(null)} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Layout */}
            <div id="certificate-print" className="p-8 text-center space-y-4">
              {/* Header */}
              <div className="border-4 border-double border-primary/60 p-8 rounded-lg">
                <div className="mb-6">
                  <Award className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h1 className="text-2xl font-bold text-primary uppercase tracking-widest">
                    {printData.printData.schoolName}
                  </h1>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase">
                    Certificate of {printData.printData.certificateType.toLowerCase().replace(/_/g, ' ')}
                  </p>
                </div>

                <div className="border-t border-b py-6 my-6">
                  <p className="text-sm text-muted-foreground mb-1">This is to certify that</p>
                  <h2 className="text-3xl font-bold mb-2">{printData.printData.studentName}</h2>
                  {printData.student && (
                    <p className="text-sm text-muted-foreground">
                      {printData.student.class} - {printData.student.section} | Admission No: {printData.student.admissionNo}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{printData.printData.title}</h3>
                  {printData.printData.description && (
                    <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                      {printData.printData.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t text-sm">
                  <div className="text-left">
                    <div className="font-semibold">Issued Date</div>
                    <div className="text-muted-foreground">
                      {new Date(printData.printData.issuedDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">Serial Number</div>
                    <div className="text-muted-foreground font-mono">{printData.printData.serialNumber}</div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t flex justify-between items-end">
                  <div className="text-center">
                    <div className="border-t border-foreground/30 pt-2 mt-8 text-xs text-muted-foreground">
                      Principal&apos;s Signature
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-foreground/30 pt-2 mt-8 text-xs text-muted-foreground">
                      Class Teacher&apos;s Signature
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Status: {printData.printData.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

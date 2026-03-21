'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

interface Enquiry {
  id: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  classAppliedFor: string;
  status: string;
  source: string;
  createdAt: string;
}

interface Application {
  id: string;
  formNumber: string;
  studentFirstName: string;
  studentLastName: string;
  classAppliedFor: string;
  status: string;
  createdAt: string;
  enquiry: {
    studentName: string;
    parentName: string;
    parentPhone: string;
  };
}

interface AdmissionStats {
  totalEnquiries: number;
  totalApplications: number;
  enrolledCount: number;
  rejectedCount: number;
  conversionFunnel: {
    enquiryToApplicationPct: number;
    applicationToEnrolledPct: number;
    overallConversionPct: number;
  };
}

interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

// ─── Status Colors ────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  ENQUIRY: 'bg-blue-100 text-blue-700',
  APPLICATION: 'bg-yellow-100 text-yellow-700',
  ENTRANCE_TEST: 'bg-purple-100 text-purple-700',
  INTERVIEW: 'bg-indigo-100 text-indigo-700',
  OFFER: 'bg-green-100 text-green-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  ENROLLED: 'bg-teal-100 text-teal-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-700',
};

const PIPELINE_STAGES = [
  'APPLICATION',
  'ENTRANCE_TEST',
  'INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'ENROLLED',
  'REJECTED',
  'WITHDRAWN',
];

const EMPTY_ENQUIRY_FORM = {
  studentName: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  classAppliedFor: '',
  source: 'WALK_IN',
  notes: '',
};

const EMPTY_APP_FORM = {
  studentFirstName: '',
  studentLastName: '',
  dateOfBirth: '',
  gender: 'MALE',
  previousSchool: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
};

// ─── Component ────────────────────────────────────────────────────

export default function AdmissionPage() {
  const [activeTab, setActiveTab] = useState<'enquiries' | 'applications' | 'enrolled'>('enquiries');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<AdmissionStats | null>(null);

  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState('');

  const [enquiryForm, setEnquiryForm] = useState(EMPTY_ENQUIRY_FORM);
  const [appForm, setAppForm] = useState(EMPTY_APP_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [academicSessionId, setAcademicSessionId] = useState('');

  // Process dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  // ─── Fetch helpers ──────────────────────────────────────────

  const fetchEnquiries = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admission/enquiries`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (res.ok) setEnquiries(await res.json());
    } catch { /* API not available */ }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admission/applications`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (res.ok) setApplications(await res.json());
    } catch { /* API not available */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admission/stats`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (res.ok) setStats(await res.json());
    } catch { /* API not available */ }
  }, []);

  useEffect(() => {
    fetchEnquiries();
    fetchApplications();
    fetchStats();
  }, [fetchEnquiries, fetchApplications, fetchStats]);

  // Fetch current academic session
  useEffect(() => {
    if (academicSessionId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic-sessions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((sessions: AcademicSession[]) => {
        const current = sessions.find((s) => s.isCurrent) ?? sessions[0];
        if (current) setAcademicSessionId(current.id);
      })
      .catch(() => {});
  }, [academicSessionId]);

  // ─── Submit handlers ─────────────────────────────────────────

  async function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, string> = {
        studentName: enquiryForm.studentName,
        parentName: enquiryForm.parentName,
        parentPhone: enquiryForm.parentPhone,
        classAppliedFor: enquiryForm.classAppliedFor,
        source: enquiryForm.source,
        academicSessionId,
      };
      if (enquiryForm.parentEmail) payload.parentEmail = enquiryForm.parentEmail;
      if (enquiryForm.notes) payload.notes = enquiryForm.notes;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admission/enquiries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        setShowEnquiryForm(false);
        setEnquiryForm(EMPTY_ENQUIRY_FORM);
        setSuccessMsg('Enquiry submitted successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchEnquiries();
        fetchStats();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAppSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        enquiryId: selectedEnquiryId,
        studentFirstName: appForm.studentFirstName,
        studentLastName: appForm.studentLastName,
        dateOfBirth: appForm.dateOfBirth,
        gender: appForm.gender,
        previousSchool: appForm.previousSchool || undefined,
        addressLine1: appForm.addressLine1 || undefined,
        city: appForm.city || undefined,
        state: appForm.state || undefined,
        pincode: appForm.pincode || undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admission/applications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        setShowAppForm(false);
        setAppForm(EMPTY_APP_FORM);
        setSelectedEnquiryId('');
        setSuccessMsg('Application created successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchApplications();
        fetchEnquiries();
        fetchStats();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function processApplication(appId: string, status: string) {
    setProcessingId(appId);
    setOpenDropdown(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admission/applications/${appId}/process`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      if (res.ok) {
        setSuccessMsg(`Application moved to ${status}.`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchApplications();
        fetchStats();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error.');
    } finally {
      setProcessingId(null);
    }
  }

  async function enrollStudent(appId: string) {
    setProcessingId(appId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admission/applications/${appId}/enroll`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Student enrolled! Admission No: ${data.admissionNo}`);
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchApplications();
        fetchStats();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error.');
    } finally {
      setProcessingId(null);
    }
  }

  function openCreateApp(enquiryId: string) {
    setSelectedEnquiryId(enquiryId);
    setShowAppForm(true);
    setError('');
  }

  const enrolledApplications = applications.filter((a) => a.status === 'ENROLLED');

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div onClick={() => setOpenDropdown(null)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admissions</h1>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEnquiryForm((v) => !v);
            setError('');
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm"
        >
          {showEnquiryForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showEnquiryForm ? 'Cancel' : 'New Enquiry'}
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* ── Funnel Stats ─────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Enquiries</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalEnquiries}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Applications</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalApplications}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.conversionFunnel.enquiryToApplicationPct}% of enquiries
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Enrolled</p>
            <p className="text-2xl font-bold text-teal-600">{stats.enrolledCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.conversionFunnel.overallConversionPct}% overall
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
          </div>
        </div>
      )}

      {/* Funnel visual */}
      {stats && (
        <div className="bg-card border rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold mb-3">Admission Funnel</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              Enquiries ({stats.totalEnquiries})
            </span>
            <span className="text-muted-foreground text-xs">→ {stats.conversionFunnel.enquiryToApplicationPct}%</span>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
              Applications ({stats.totalApplications})
            </span>
            <span className="text-muted-foreground text-xs">→ {stats.conversionFunnel.applicationToEnrolledPct}%</span>
            <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
              Enrolled ({stats.enrolledCount})
            </span>
          </div>
        </div>
      )}

      {/* ── New Enquiry Form ──────────────────────────────────── */}
      {showEnquiryForm && (
        <div
          className="bg-card rounded-lg border p-6 mb-6 animate-in slide-in-from-top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4">New Admission Enquiry</h2>
          {!academicSessionId && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-sm">
              Could not load academic session.
            </div>
          )}
          <form onSubmit={handleEnquirySubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student Name *</label>
                <input
                  required
                  name="studentName"
                  value={enquiryForm.studentName}
                  onChange={(e) => setEnquiryForm((p) => ({ ...p, studentName: e.target.value }))}
                  placeholder="Full name of student"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parent / Guardian Name *</label>
                <input
                  required
                  name="parentName"
                  value={enquiryForm.parentName}
                  onChange={(e) => setEnquiryForm((p) => ({ ...p, parentName: e.target.value }))}
                  placeholder="Parent name"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parent Phone *</label>
                <input
                  required
                  name="parentPhone"
                  value={enquiryForm.parentPhone}
                  onChange={(e) => setEnquiryForm((p) => ({ ...p, parentPhone: e.target.value }))}
                  placeholder="+91 9999999999"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parent Email</label>
                <input
                  type="email"
                  name="parentEmail"
                  value={enquiryForm.parentEmail}
                  onChange={(e) => setEnquiryForm((p) => ({ ...p, parentEmail: e.target.value }))}
                  placeholder="parent@email.com"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class Applied For *</label>
                <input
                  required
                  name="classAppliedFor"
                  value={enquiryForm.classAppliedFor}
                  onChange={(e) => setEnquiryForm((p) => ({ ...p, classAppliedFor: e.target.value }))}
                  placeholder="e.g. Class 5, Grade 10"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source *</label>
                <select
                  name="source"
                  value={enquiryForm.source}
                  onChange={(e) => setEnquiryForm((p) => ({ ...p, source: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="WALK_IN">Walk In</option>
                  <option value="WEBSITE">Website</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="ADVERTISEMENT">Advertisement</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={enquiryForm.notes}
                  onChange={(e) => setEnquiryForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any additional notes..."
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowEnquiryForm(false); setError(''); setEnquiryForm(EMPTY_ENQUIRY_FORM); }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Create Application Form ───────────────────────────── */}
      {showAppForm && (
        <div
          className="bg-card rounded-lg border p-6 mb-6 animate-in slide-in-from-top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4">Create Application</h2>
          <form onSubmit={handleAppSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  required
                  value={appForm.studentFirstName}
                  onChange={(e) => setAppForm((p) => ({ ...p, studentFirstName: e.target.value }))}
                  placeholder="Student first name"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  required
                  value={appForm.studentLastName}
                  onChange={(e) => setAppForm((p) => ({ ...p, studentLastName: e.target.value }))}
                  placeholder="Student last name"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                <input
                  required
                  type="date"
                  value={appForm.dateOfBirth}
                  onChange={(e) => setAppForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender *</label>
                <select
                  value={appForm.gender}
                  onChange={(e) => setAppForm((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Previous School</label>
                <input
                  value={appForm.previousSchool}
                  onChange={(e) => setAppForm((p) => ({ ...p, previousSchool: e.target.value }))}
                  placeholder="Previous school name"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address Line 1</label>
                <input
                  value={appForm.addressLine1}
                  onChange={(e) => setAppForm((p) => ({ ...p, addressLine1: e.target.value }))}
                  placeholder="House/Flat, Street"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  value={appForm.city}
                  onChange={(e) => setAppForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  value={appForm.state}
                  onChange={(e) => setAppForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="State"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode</label>
                <input
                  value={appForm.pincode}
                  onChange={(e) => setAppForm((p) => ({ ...p, pincode: e.target.value }))}
                  placeholder="PIN code"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowAppForm(false); setError(''); setAppForm(EMPTY_APP_FORM); }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b mb-4">
        {(['enquiries', 'applications', 'enrolled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'enrolled' ? 'Enrolled' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'enquiries' && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{enquiries.length}</span>}
            {tab === 'applications' && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{applications.filter(a => a.status !== 'ENROLLED').length}</span>}
            {tab === 'enrolled' && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{enrolledApplications.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Enquiries Tab ─────────────────────────────────────── */}
      {activeTab === 'enquiries' && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Student Name</th>
                <th className="text-left p-3 font-medium">Parent</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-left p-3 font-medium">Class</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No admission enquiries yet.
                  </td>
                </tr>
              ) : (
                enquiries.map((e) => (
                  <tr key={e.id} className="border-t hover:bg-muted/50">
                    <td className="p-3">{e.studentName}</td>
                    <td className="p-3">{e.parentName}</td>
                    <td className="p-3">{e.parentPhone}</td>
                    <td className="p-3">{e.classAppliedFor}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[e.status] || 'bg-gray-100'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-3">{e.source}</td>
                    <td className="p-3">
                      {e.status === 'ENQUIRY' && (
                        <button
                          onClick={() => openCreateApp(e.id)}
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                        >
                          Create Application
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Applications Tab ──────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Form No.</th>
                <th className="text-left p-3 font-medium">Student Name</th>
                <th className="text-left p-3 font-medium">Parent</th>
                <th className="text-left p-3 font-medium">Class</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.filter((a) => a.status !== 'ENROLLED').length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No applications yet. Create one from an enquiry.
                  </td>
                </tr>
              ) : (
                applications
                  .filter((a) => a.status !== 'ENROLLED')
                  .map((app) => (
                    <tr key={app.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs">{app.formNumber}</td>
                      <td className="p-3">{app.studentFirstName} {app.studentLastName}</td>
                      <td className="p-3">
                        <div>{app.enquiry.parentName}</div>
                        <div className="text-xs text-muted-foreground">{app.enquiry.parentPhone}</div>
                      </td>
                      <td className="p-3">{app.classAppliedFor}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[app.status] || 'bg-gray-100'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div
                          className="flex gap-2 items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Process dropdown */}
                          {app.status !== 'ENROLLED' && app.status !== 'REJECTED' && app.status !== 'WITHDRAWN' && (
                            <div className="relative">
                              <button
                                disabled={processingId === app.id}
                                onClick={() => setOpenDropdown(openDropdown === app.id ? null : app.id)}
                                className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-60"
                              >
                                Process
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              {openDropdown === app.id && (
                                <div className="absolute left-0 top-7 z-50 bg-white border rounded-md shadow-lg min-w-[160px]">
                                  {PIPELINE_STAGES.filter((s) => s !== app.status).map((stage) => (
                                    <button
                                      key={stage}
                                      onClick={() => processApplication(app.id, stage)}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
                                    >
                                      <span className={`w-2 h-2 rounded-full inline-block ${statusColors[stage]?.split(' ')[0] ?? 'bg-gray-300'}`} />
                                      {stage}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Enroll button — only for ACCEPTED */}
                          {app.status === 'ACCEPTED' && (
                            <button
                              disabled={processingId === app.id}
                              onClick={() => enrollStudent(app.id)}
                              className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded hover:bg-teal-200 disabled:opacity-60"
                            >
                              {processingId === app.id ? 'Enrolling...' : 'Enroll'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Enrolled Tab ─────────────────────────────────────── */}
      {activeTab === 'enrolled' && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Form No.</th>
                <th className="text-left p-3 font-medium">Student Name</th>
                <th className="text-left p-3 font-medium">Parent</th>
                <th className="text-left p-3 font-medium">Class</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrolledApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No enrolled students yet.
                  </td>
                </tr>
              ) : (
                enrolledApplications.map((app) => (
                  <tr key={app.id} className="border-t hover:bg-muted/50">
                    <td className="p-3 font-mono text-xs">{app.formNumber}</td>
                    <td className="p-3">{app.studentFirstName} {app.studentLastName}</td>
                    <td className="p-3">
                      <div>{app.enquiry.parentName}</div>
                      <div className="text-xs text-muted-foreground">{app.enquiry.parentPhone}</div>
                    </td>
                    <td className="p-3">{app.classAppliedFor}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-700">
                        ENROLLED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

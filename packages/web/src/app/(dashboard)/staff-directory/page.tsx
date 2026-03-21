'use client';

import { useEffect, useState } from 'react';

interface StaffProfile {
  id: string;
  userId: string;
  employeeId: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
}

interface DeptStat {
  department: string;
  count: number;
}

const DEPARTMENTS = [
  'ACADEMIC', 'ADMINISTRATION', 'ACCOUNTS', 'TRANSPORT', 'LIBRARY', 'IT', 'SPORTS', 'OTHER',
];

const DEPT_COLORS: Record<string, string> = {
  ACADEMIC:       'bg-blue-100 text-blue-700',
  ADMINISTRATION: 'bg-purple-100 text-purple-700',
  ACCOUNTS:       'bg-green-100 text-green-700',
  TRANSPORT:      'bg-orange-100 text-orange-700',
  LIBRARY:        'bg-yellow-100 text-yellow-700',
  IT:             'bg-cyan-100 text-cyan-700',
  SPORTS:         'bg-red-100 text-red-700',
  OTHER:          'bg-gray-100 text-gray-700',
};

export default function StaffDirectoryPage() {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: '',
    employeeId: '',
    department: 'ACADEMIC',
    designation: '',
    dateOfJoining: '',
    qualification: '',
    specialization: '',
    experience: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
  });

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });
  const jsonHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });
  const base = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

  useEffect(() => {
    loadProfiles();
    loadDeptStats();
  }, [filterDept]);

  function loadProfiles() {
    setLoading(true);
    let url = `${base}/staff-directory`;
    if (filterDept) url += `?department=${filterDept}`;
    fetch(url, { headers: headers() })
      .then(r => r.json())
      .then(data => setProfiles(Array.isArray(data) ? data : []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }

  function loadDeptStats() {
    fetch(`${base}/staff-directory/departments`, { headers: headers() })
      .then(r => r.json())
      .then(data => setDeptStats(Array.isArray(data) ? data : []))
      .catch(() => setDeptStats([]));
  }

  function handleSearch() {
    if (!searchQuery.trim()) { loadProfiles(); return; }
    setLoading(true);
    fetch(`${base}/staff-directory/search?q=${encodeURIComponent(searchQuery)}`, { headers: headers() })
      .then(r => r.json())
      .then(data => setProfiles(Array.isArray(data) ? data : []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.userId || !form.employeeId || !form.designation || !form.dateOfJoining) {
      setFormError('User ID, Employee ID, Designation and Date of Joining are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        userId: form.userId,
        employeeId: form.employeeId,
        department: form.department,
        designation: form.designation,
        dateOfJoining: form.dateOfJoining,
      };
      if (form.qualification) payload.qualification = form.qualification;
      if (form.specialization) payload.specialization = form.specialization;
      if (form.experience) payload.experience = parseInt(form.experience);
      if (form.emergencyContact) payload.emergencyContact = form.emergencyContact;
      if (form.emergencyPhone) payload.emergencyPhone = form.emergencyPhone;
      if (form.address) payload.address = form.address;

      const res = await fetch(`${base}/staff-directory`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.message || 'Failed to create staff profile');
        return;
      }
      setShowForm(false);
      setForm({ userId: '', employeeId: '', department: 'ACADEMIC', designation: '', dateOfJoining: '', qualification: '', specialization: '', experience: '', emergencyContact: '', emergencyPhone: '', address: '' });
      loadProfiles();
      loadDeptStats();
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">Manage staff profiles and department information</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + Add Staff Profile
        </button>
      </div>

      {/* Department Stats */}
      {deptStats.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {deptStats.map(s => (
            <div key={s.department} className="bg-card border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{s.count}</div>
              <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${DEPT_COLORS[s.department] ?? 'bg-gray-100 text-gray-700'}`}>
                {s.department}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Department Tabs */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by designation, specialization..."
            className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-muted text-sm rounded-md border hover:bg-muted/80"
          >
            Search
          </button>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); loadProfiles(); }}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDept('')}
            className={`px-3 py-1.5 text-xs rounded-full border ${!filterDept ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
          >
            All
          </button>
          {DEPARTMENTS.map(d => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={`px-3 py-1.5 text-xs rounded-full border ${filterDept === d ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Cards */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No staff profiles found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <div key={p.id} className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {/* Photo placeholder */}
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                  {p.designation.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${DEPT_COLORS[p.department] ?? 'bg-gray-100 text-gray-700'}`}>
                      {p.department}
                    </span>
                    <span className="text-xs text-muted-foreground">#{p.employeeId}</span>
                  </div>
                  <p className="font-semibold mt-1 truncate">{p.designation}</p>
                  {p.specialization && (
                    <p className="text-xs text-muted-foreground truncate">{p.specialization}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
                <div>Joined: {new Date(p.dateOfJoining).toLocaleDateString()}</div>
                {p.experience !== undefined && p.experience !== null && (
                  <div>Experience: {p.experience} yr{p.experience !== 1 ? 's' : ''}</div>
                )}
                {p.qualification && <div>Qualification: {p.qualification}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Profile Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">Add Staff Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">User ID *</label>
                  <input
                    value={form.userId}
                    onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="User UUID"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Employee ID *</label>
                  <input
                    value={form.employeeId}
                    onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="EMP-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Department *</label>
                  <select
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Designation *</label>
                  <input
                    value={form.designation}
                    onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Teacher / Principal..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Date of Joining *</label>
                  <input
                    type="date"
                    value={form.dateOfJoining}
                    onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Experience (years)</label>
                  <input
                    type="number"
                    value={form.experience}
                    onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Qualification</label>
                <input
                  value={form.qualification}
                  onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="M.Sc., B.Ed., MBA..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Specialization</label>
                <input
                  value={form.specialization}
                  onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Mathematics, Science..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Emergency Contact</label>
                  <input
                    value={form.emergencyContact}
                    onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Emergency Phone</label>
                  <input
                    value={form.emergencyPhone}
                    onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
                  placeholder="Residential address..."
                />
              </div>

              {formError && (
                <p className="text-red-500 text-xs">{formError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

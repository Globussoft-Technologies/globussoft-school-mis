'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  X,
  Search,
  GraduationCap,
  BadgeCheck,
  Users,
  Filter,
  Linkedin,
  MapPin,
  Building,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface AlumniRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  graduationYear: number;
  lastClass: string;
  currentStatus?: string;
  organization?: string;
  designation?: string;
  city?: string;
  linkedinUrl?: string;
  achievements?: string;
  photoUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

interface Stats {
  total: number;
  verified: number;
  byStatus: Record<string, number>;
  byDecade: Record<string, number>;
  byYear: Record<number, number>;
}

const STATUS_OPTIONS = ['HIGHER_EDUCATION', 'EMPLOYED', 'ENTREPRENEUR', 'OTHER'];

const STATUS_COLORS: Record<string, string> = {
  HIGHER_EDUCATION: 'bg-blue-100 text-blue-800',
  EMPLOYED: 'bg-green-100 text-green-800',
  ENTREPRENEUR: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<string, string> = {
  HIGHER_EDUCATION: 'Higher Education',
  EMPLOYED: 'Employed',
  ENTREPRENEUR: 'Entrepreneur',
  OTHER: 'Other',
};

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  graduationYear: String(new Date().getFullYear() - 5),
  lastClass: 'Class 12 - Science',
  currentStatus: 'EMPLOYED',
  organization: '',
  designation: '',
  city: '',
  linkedinUrl: '',
  achievements: '',
};

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<AlumniRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<AlumniRecord[] | null>(null);
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchAlumni = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterYear) params.set('graduationYear', filterYear);
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch(`${API}/alumni?${params}`, { headers: authHeaders() });
    if (res.ok) setAlumni(await res.json());
  }, [filterYear, filterStatus]);

  const fetchStats = useCallback(async () => {
    const res = await fetch(`${API}/alumni/stats`, { headers: authHeaders() });
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchAlumni(), fetchStats()]);
      setLoading(false);
    }
    load();
  }, [fetchAlumni, fetchStats]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQ(val);
    if (searchTimer) clearTimeout(searchTimer);
    if (!val.trim()) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`${API}/alumni/search?q=${encodeURIComponent(val)}`, {
        headers: authHeaders(),
      });
      if (res.ok) setSearchResults(await res.json());
    }, 300);
    setSearchTimer(t);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        graduationYear: parseInt(form.graduationYear),
        email: form.email || undefined,
        phone: form.phone || undefined,
        organization: form.organization || undefined,
        designation: form.designation || undefined,
        city: form.city || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
        achievements: form.achievements || undefined,
      };
      const res = await fetch(`${API}/alumni`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        await Promise.all([fetchAlumni(), fetchStats()]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(id: string) {
    await fetch(`${API}/alumni/${id}/verify`, { method: 'PATCH', headers: authHeaders() });
    await Promise.all([fetchAlumni(), fetchStats()]);
  }

  const displayList = searchResults !== null ? searchResults : alumni;

  const yearOptions = Array.from(
    new Set(alumni.map((a) => a.graduationYear))
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Alumni Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect with and manage school alumni network
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Register Alumni
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-md">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Alumni</p>
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-md">
              <BadgeCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{stats?.verified ?? 0}</p>
            </div>
          </div>
        </div>
        {stats && Object.entries(stats.byDecade).slice(0, 2).map(([decade, count]) => (
          <div key={decade} className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-md">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Class of {decade}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {stats && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Alumni by Current Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATUS_OPTIONS.map((s) => (
              <div key={s} className="text-center p-3 bg-muted/40 rounded-lg">
                <p className="text-xl font-bold">{stats.byStatus[s] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{STATUS_LABELS[s]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQ}
            onChange={handleSearchChange}
            placeholder="Search alumni by name, email, organization..."
            className="w-full border rounded-md pl-9 pr-3 py-2 text-sm bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
        <select
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); setSearchResults(null); setSearchQ(''); }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Years</option>
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setSearchResults(null); setSearchQ(''); }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {(searchQ || filterYear || filterStatus) && (
          <button
            onClick={() => { setSearchQ(''); setFilterYear(''); setFilterStatus(''); setSearchResults(null); }}
            className="px-3 py-2 border rounded-md text-sm hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>

      {/* Alumni Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading alumni...</div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQ ? `No alumni found for "${searchQ}"` : 'No alumni records yet. Register the first alumni!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((alumnus) => (
            <div key={alumnus.id} className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Photo placeholder */}
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl font-bold text-primary">
                  {alumnus.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{alumnus.name}</h3>
                    {alumnus.isVerified && (
                      <span title="Verified"><BadgeCheck className="h-4 w-4 text-green-600 flex-shrink-0" /></span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Class of {alumnus.graduationYear} · {alumnus.lastClass}
                  </p>
                  {alumnus.currentStatus && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[alumnus.currentStatus] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[alumnus.currentStatus] ?? alumnus.currentStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {alumnus.organization && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{alumnus.designation ? `${alumnus.designation} at ` : ''}{alumnus.organization}</span>
                  </div>
                )}
                {alumnus.city && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{alumnus.city}</span>
                  </div>
                )}
                {alumnus.linkedinUrl && (
                  <a
                    href={alumnus.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn Profile
                  </a>
                )}
              </div>

              {alumnus.achievements && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic border-t pt-2">
                  {alumnus.achievements}
                </p>
              )}

              {!alumnus.isVerified && (
                <button
                  onClick={() => handleVerify(alumnus.id)}
                  className="mt-3 w-full py-1.5 border border-green-300 text-green-700 rounded-md text-xs font-medium hover:bg-green-50 flex items-center justify-center gap-1.5"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verify Alumni
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Register Alumni Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Register Alumni</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="e.g. Arjun Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Graduation Year *</label>
                  <input
                    required
                    type="number"
                    min="1980"
                    max={new Date().getFullYear()}
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Class *</label>
                  <input
                    required
                    value={form.lastClass}
                    onChange={(e) => setForm({ ...form, lastClass: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Class 12 - Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Status</label>
                  <select
                    value={form.currentStatus}
                    onChange={(e) => setForm({ ...form, currentStatus: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Select...</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Organization</label>
                  <input
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="e.g. IIT Bombay"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                  <input
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Achievements</label>
                  <textarea
                    value={form.achievements}
                    onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    rows={3}
                    placeholder="Notable achievements, awards, milestones..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Registering...' : 'Register Alumni'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

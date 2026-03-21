'use client';

import { useEffect, useState } from 'react';
import { DoorOpen, Plus, LogOut, Clock, X } from 'lucide-react';

interface VisitorLog {
  id: string;
  visitorName: string;
  phone: string;
  purpose: string;
  visitingWhom?: string;
  department?: string;
  checkIn: string;
  checkOut?: string;
  badgeNumber?: string;
  idProof?: string;
  remarks?: string;
  schoolId: string;
  loggedBy: string;
}

const purposeColors: Record<string, string> = {
  PARENT_VISIT: 'bg-blue-100 text-blue-700',
  VENDOR: 'bg-purple-100 text-purple-700',
  OFFICIAL: 'bg-green-100 text-green-700',
  INTERVIEW: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const purposeLabels: Record<string, string> = {
  PARENT_VISIT: 'Parent Visit',
  VENDOR: 'Vendor',
  OFFICIAL: 'Official',
  INTERVIEW: 'Interview',
  OTHER: 'Other',
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    visitorName: '', phone: '', purpose: 'PARENT_VISIT',
    visitingWhom: '', department: '', badgeNumber: '', idProof: '', remarks: '',
  });

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  function getSchoolId() {
    if (typeof window === 'undefined') return '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.schoolId || '';
  }

  function getUserId() {
    if (typeof window === 'undefined') return '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || '';
  }

  async function loadVisitors() {
    setLoading(true);
    try {
      const [todayRes, activeRes] = await Promise.all([
        fetch(`${base}/visitors/today`, { headers: getHeaders() }),
        fetch(`${base}/visitors/active`, { headers: getHeaders() }),
      ]);
      if (todayRes.ok) setVisitors(await todayRes.json());
      if (activeRes.ok) setActiveVisitors(await activeRes.json());
    } catch {}
    setLoading(false);
  }

  async function loadFiltered() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set('date', dateFilter);
      if (purposeFilter) params.set('purpose', purposeFilter);
      const res = await fetch(`${base}/visitors?${params}`, { headers: getHeaders() });
      if (res.ok) setVisitors(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (dateFilter || purposeFilter) {
      loadFiltered();
    } else {
      loadVisitors();
    }
  }, [dateFilter, purposeFilter]);

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const schoolId = getSchoolId();
      const loggedBy = getUserId();
      const res = await fetch(`${base}/visitors/check-in`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...form, schoolId, loggedBy }),
      });
      if (res.ok) {
        setShowCheckIn(false);
        setForm({ visitorName: '', phone: '', purpose: 'PARENT_VISIT', visitingWhom: '', department: '', badgeNumber: '', idProof: '', remarks: '' });
        loadVisitors();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to check in visitor');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleCheckOut(id: string) {
    setCheckingOut(id);
    try {
      const res = await fetch(`${base}/visitors/${id}/check-out`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) {
        loadVisitors();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to check out');
      }
    } catch { alert('Network error'); }
    setCheckingOut(null);
  }

  function formatTime(dt: string) {
    return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('en-IN');
  }

  function getDuration(checkIn: string, checkOut?: string) {
    const end = checkOut ? new Date(checkOut) : new Date();
    const mins = Math.floor((end.getTime() - new Date(checkIn).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DoorOpen className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Visitor Management</h1>
            <p className="text-sm text-muted-foreground">Track visitor check-ins and check-outs</p>
          </div>
        </div>
        <button
          onClick={() => setShowCheckIn(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Check In Visitor
        </button>
      </div>

      {/* Active Visitors Banner */}
      {activeVisitors.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              {activeVisitors.length} Active Visitor{activeVisitors.length !== 1 ? 's' : ''} on Campus
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeVisitors.map((v) => (
              <div key={v.id} className="flex items-center gap-2 bg-white border border-blue-200 rounded-full px-3 py-1">
                <span className="text-xs font-medium">{v.visitorName}</span>
                <span className="text-xs text-muted-foreground">({purposeLabels[v.purpose] || v.purpose})</span>
                <span className="text-xs text-blue-600">{getDuration(v.checkIn)}</span>
                <button
                  onClick={() => handleCheckOut(v.id)}
                  disabled={checkingOut === v.id}
                  className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  {checkingOut === v.id ? '...' : 'Out'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Purposes</option>
          {Object.entries(purposeLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        {(dateFilter || purposeFilter) && (
          <button
            onClick={() => { setDateFilter(''); setPurposeFilter(''); }}
            className="text-xs text-muted-foreground border px-3 py-2 rounded-md hover:bg-muted"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Visitor Log Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="px-4 py-3 bg-muted/30 border-b">
          <span className="text-sm font-medium">
            {dateFilter ? `Visitors on ${new Date(dateFilter).toLocaleDateString('en-IN')}` : "Today's Visitor Log"}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Visitor</th>
              <th className="text-left px-4 py-3 font-medium">Purpose</th>
              <th className="text-left px-4 py-3 font-medium">Visiting</th>
              <th className="text-left px-4 py-3 font-medium">Check In</th>
              <th className="text-left px-4 py-3 font-medium">Check Out</th>
              <th className="text-left px-4 py-3 font-medium">Duration</th>
              <th className="text-left px-4 py-3 font-medium">Badge</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : visitors.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No visitors found</td></tr>
            ) : (
              visitors.map((v) => {
                const isActive = !v.checkOut;
                return (
                  <tr key={v.id} className={`border-t ${isActive ? 'bg-blue-50/30' : 'hover:bg-muted/30'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-2">
                        {v.visitorName}
                        {isActive && (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{v.phone}</div>
                      {v.idProof && <div className="text-xs text-muted-foreground">ID: {v.idProof}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${purposeColors[v.purpose] || 'bg-gray-100 text-gray-700'}`}>
                        {purposeLabels[v.purpose] || v.purpose}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{v.visitingWhom || '—'}</div>
                      {v.department && <div className="text-xs text-muted-foreground">{v.department}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{formatTime(v.checkIn)}</div>
                      {dateFilter && <div className="text-muted-foreground">{formatDate(v.checkIn)}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {v.checkOut ? (
                        <div>{formatTime(v.checkOut)}</div>
                      ) : (
                        <span className="text-blue-600 font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {getDuration(v.checkIn, v.checkOut)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {v.badgeNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {isActive && (
                        <button
                          onClick={() => handleCheckOut(v.id)}
                          disabled={checkingOut === v.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          <LogOut className="h-3 w-3" />
                          {checkingOut === v.id ? '...' : 'Check Out'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Check In Form Modal */}
      {showCheckIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Visitor Check In</h2>
              <button onClick={() => setShowCheckIn(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCheckIn} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Visitor Name *</label>
                  <input type="text" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                    placeholder="Full name"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purpose *</label>
                  <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {Object.entries(purposeLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Visiting Whom</label>
                  <input type="text" value={form.visitingWhom} onChange={(e) => setForm({ ...form, visitingWhom: e.target.value })}
                    placeholder="Person being visited"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g., Academics"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Badge Number</label>
                  <input type="text" value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })}
                    placeholder="Visitor badge no."
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ID Proof Type</label>
                  <select value={form.idProof} onChange={(e) => setForm({ ...form, idProof: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select ID type</option>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Government ID">Government ID</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Checking In...' : 'Check In'}
                </button>
                <button type="button" onClick={() => setShowCheckIn(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

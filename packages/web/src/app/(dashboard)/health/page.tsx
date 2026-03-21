'use client';

import { useEffect, useState } from 'react';
import { Heart, Plus, Search, AlertTriangle, X, User } from 'lucide-react';

interface HealthRecord {
  id: string;
  studentId: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  lastCheckupDate?: string;
  doctorName?: string;
  doctorPhone?: string;
  notes?: string;
  updatedBy?: string;
  updatedAt: string;
}

interface HealthIncident {
  id: string;
  studentId: string;
  date: string;
  type: string;
  description: string;
  actionTaken?: string;
  parentNotified: boolean;
  sentHome: boolean;
  reportedBy: string;
  createdAt: string;
}

const incidentTypeColors: Record<string, string> = {
  INJURY: 'bg-red-100 text-red-700',
  ILLNESS: 'bg-orange-100 text-orange-700',
  ALLERGY_REACTION: 'bg-yellow-100 text-yellow-700',
  FAINTING: 'bg-purple-100 text-purple-700',
  FEVER: 'bg-blue-100 text-blue-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const bloodGroupColors: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700',
  'A-': 'bg-red-200 text-red-800',
  'B+': 'bg-blue-100 text-blue-700',
  'B-': 'bg-blue-200 text-blue-800',
  'AB+': 'bg-purple-100 text-purple-700',
  'AB-': 'bg-purple-200 text-purple-800',
  'O+': 'bg-green-100 text-green-700',
  'O-': 'bg-green-200 text-green-800',
};

export default function HealthPage() {
  const [searchId, setSearchId] = useState('');
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [incidents, setIncidents] = useState<HealthIncident[]>([]);
  const [allergyList, setAllergyList] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [recordForm, setRecordForm] = useState({
    studentId: '', bloodGroup: '', height: '', weight: '',
    allergies: '', conditions: '', medications: '',
    emergencyContact: '', emergencyPhone: '',
    lastCheckupDate: '', doctorName: '', doctorPhone: '', notes: '',
  });

  const [incidentForm, setIncidentForm] = useState({
    studentId: '', date: new Date().toISOString().split('T')[0],
    type: 'ILLNESS', description: '', actionTaken: '',
    parentNotified: false, sentHome: false, reportedBy: '',
  });

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  function getUserId() {
    if (typeof window === 'undefined') return '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || '';
  }

  async function loadAllergyList() {
    try {
      const res = await fetch(`${base}/health/allergies`, { headers: getHeaders() });
      if (res.ok) setAllergyList(await res.json());
    } catch {}
  }

  async function loadIncidents() {
    try {
      const res = await fetch(`${base}/health/incidents`, { headers: getHeaders() });
      if (res.ok) setIncidents(await res.json());
    } catch {}
  }

  useEffect(() => {
    loadAllergyList();
    loadIncidents();
  }, []);

  async function searchRecord() {
    if (!searchId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${base}/health/records/${searchId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRecord(data);
        if (data) {
          setRecordForm({
            studentId: data.studentId,
            bloodGroup: data.bloodGroup || '',
            height: data.height?.toString() || '',
            weight: data.weight?.toString() || '',
            allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : '',
            conditions: Array.isArray(data.conditions) ? data.conditions.join(', ') : '',
            medications: Array.isArray(data.medications) ? data.medications.join(', ') : '',
            emergencyContact: data.emergencyContact || '',
            emergencyPhone: data.emergencyPhone || '',
            lastCheckupDate: data.lastCheckupDate ? data.lastCheckupDate.split('T')[0] : '',
            doctorName: data.doctorName || '',
            doctorPhone: data.doctorPhone || '',
            notes: data.notes || '',
          });
        }
      } else {
        setRecord(null);
      }
    } catch {}
    setLoading(false);
  }

  async function handleSaveRecord(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        studentId: recordForm.studentId,
        bloodGroup: recordForm.bloodGroup || undefined,
        height: recordForm.height ? parseFloat(recordForm.height) : undefined,
        weight: recordForm.weight ? parseFloat(recordForm.weight) : undefined,
        allergies: recordForm.allergies ? recordForm.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        conditions: recordForm.conditions ? recordForm.conditions.split(',').map((s) => s.trim()).filter(Boolean) : [],
        medications: recordForm.medications ? recordForm.medications.split(',').map((s) => s.trim()).filter(Boolean) : [],
        emergencyContact: recordForm.emergencyContact || undefined,
        emergencyPhone: recordForm.emergencyPhone || undefined,
        lastCheckupDate: recordForm.lastCheckupDate || undefined,
        doctorName: recordForm.doctorName || undefined,
        doctorPhone: recordForm.doctorPhone || undefined,
        notes: recordForm.notes || undefined,
        updatedBy: getUserId(),
      };
      const res = await fetch(`${base}/health/records`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowRecordForm(false);
        loadAllergyList();
        if (searchId) searchRecord();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save record');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleLogIncident(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${base}/health/incidents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...incidentForm,
          reportedBy: incidentForm.reportedBy || getUserId(),
        }),
      });
      if (res.ok) {
        setShowIncidentForm(false);
        setIncidentForm({
          studentId: '', date: new Date().toISOString().split('T')[0],
          type: 'ILLNESS', description: '', actionTaken: '',
          parentNotified: false, sentHome: false, reportedBy: '',
        });
        loadIncidents();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to log incident');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN');
  }

  function tagList(arr: any[], color = 'bg-blue-100 text-blue-700') {
    if (!Array.isArray(arr) || arr.length === 0) return <span className="text-muted-foreground text-xs">None</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {arr.map((item, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{item}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Health Records</h1>
            <p className="text-sm text-muted-foreground">Student health profiles and incident tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowRecordForm(true); setRecordForm({ studentId: searchId, bloodGroup: '', height: '', weight: '', allergies: '', conditions: '', medications: '', emergencyContact: '', emergencyPhone: '', lastCheckupDate: '', doctorName: '', doctorPhone: '', notes: '' }); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Update Health Record
          </button>
          <button
            onClick={() => setShowIncidentForm(true)}
            className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50"
          >
            <AlertTriangle className="h-4 w-4" /> Log Incident
          </button>
        </div>
      </div>

      {/* Student Lookup */}
      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Student Health Lookup</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Student ID"
            onKeyDown={(e) => e.key === 'Enter' && searchRecord()}
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={searchRecord}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Health Profile Display */}
        {record && (
          <div className="mt-4 space-y-4">
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Health Profile — Student ID: {record.studentId}</span>
                <span className="text-xs text-muted-foreground ml-auto">Updated: {formatDate(record.updatedAt)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Blood Group</div>
                  {record.bloodGroup ? (
                    <span className={`px-2 py-1 rounded-full text-sm font-bold ${bloodGroupColors[record.bloodGroup] || 'bg-gray-100 text-gray-700'}`}>
                      {record.bloodGroup}
                    </span>
                  ) : <span className="text-muted-foreground text-sm">Unknown</span>}
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Height</div>
                  <div className="text-sm font-semibold">{record.height ? `${record.height} cm` : '—'}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Weight</div>
                  <div className="text-sm font-semibold">{record.weight ? `${record.weight} kg` : '—'}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Last Checkup</div>
                  <div className="text-sm font-semibold">{formatDate(record.lastCheckupDate)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Allergies</div>
                  {tagList(record.allergies, 'bg-red-100 text-red-700')}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Chronic Conditions</div>
                  {tagList(record.conditions, 'bg-orange-100 text-orange-700')}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Medications</div>
                  {tagList(record.medications, 'bg-blue-100 text-blue-700')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Emergency Contact</div>
                  <div className="text-sm">{record.emergencyContact || '—'}</div>
                  <div className="text-sm text-muted-foreground">{record.emergencyPhone || ''}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Family Doctor</div>
                  <div className="text-sm">{record.doctorName || '—'}</div>
                  <div className="text-sm text-muted-foreground">{record.doctorPhone || ''}</div>
                </div>
              </div>

              {record.notes && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-yellow-800 mb-1">Notes</div>
                  <div className="text-sm">{record.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
        {searchId && !loading && record === null && (
          <div className="mt-4 text-sm text-muted-foreground">No health record found for this student.</div>
        )}
      </div>

      {/* Allergy Alert List */}
      {allergyList.length > 0 && (
        <div className="bg-card border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-700">Allergy Alert List ({allergyList.length} students)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {allergyList.map((r) => (
              <div key={r.id} className="flex items-start gap-2 bg-red-50 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">Student: {r.studentId}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(r.allergies as string[]).map((a, i) => (
                      <span key={i} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
          <span className="text-sm font-semibold">Recent Health Incidents</span>
          <span className="text-xs text-muted-foreground">{incidents.length} total</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Student ID</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-left px-4 py-3 font-medium">Action Taken</th>
              <th className="text-left px-4 py-3 font-medium">Parent Notified</th>
              <th className="text-left px-4 py-3 font-medium">Sent Home</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No incidents recorded</td></tr>
            ) : (
              incidents.map((inc) => (
                <tr key={inc.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{inc.studentId}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(inc.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${incidentTypeColors[inc.type] || 'bg-gray-100 text-gray-700'}`}>
                      {inc.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate">{inc.description}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{inc.actionTaken || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${inc.parentNotified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {inc.parentNotified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${inc.sentHome ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                      {inc.sentHome ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Health Record Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Update Health Record</h2>
              <button onClick={() => setShowRecordForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Student ID *</label>
                  <input type="text" value={recordForm.studentId} onChange={(e) => setRecordForm({ ...recordForm, studentId: e.target.value })}
                    placeholder="Student ID" required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Blood Group</label>
                  <select value={recordForm.bloodGroup} onChange={(e) => setRecordForm({ ...recordForm, bloodGroup: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Checkup Date</label>
                  <input type="date" value={recordForm.lastCheckupDate} onChange={(e) => setRecordForm({ ...recordForm, lastCheckupDate: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height (cm)</label>
                  <input type="number" step="0.1" value={recordForm.height} onChange={(e) => setRecordForm({ ...recordForm, height: e.target.value })}
                    placeholder="e.g. 165.5"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" value={recordForm.weight} onChange={(e) => setRecordForm({ ...recordForm, weight: e.target.value })}
                    placeholder="e.g. 55.2"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Allergies <span className="text-muted-foreground font-normal">(comma-separated)</span></label>
                  <input type="text" value={recordForm.allergies} onChange={(e) => setRecordForm({ ...recordForm, allergies: e.target.value })}
                    placeholder="e.g. Peanuts, Dust, Penicillin"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Chronic Conditions <span className="text-muted-foreground font-normal">(comma-separated)</span></label>
                  <input type="text" value={recordForm.conditions} onChange={(e) => setRecordForm({ ...recordForm, conditions: e.target.value })}
                    placeholder="e.g. Asthma, Diabetes"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Current Medications <span className="text-muted-foreground font-normal">(comma-separated)</span></label>
                  <input type="text" value={recordForm.medications} onChange={(e) => setRecordForm({ ...recordForm, medications: e.target.value })}
                    placeholder="e.g. Inhaler, Metformin"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
                  <input type="text" value={recordForm.emergencyContact} onChange={(e) => setRecordForm({ ...recordForm, emergencyContact: e.target.value })}
                    placeholder="Parent/Guardian name"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Phone</label>
                  <input type="tel" value={recordForm.emergencyPhone} onChange={(e) => setRecordForm({ ...recordForm, emergencyPhone: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Doctor Name</label>
                  <input type="text" value={recordForm.doctorName} onChange={(e) => setRecordForm({ ...recordForm, doctorName: e.target.value })}
                    placeholder="Family physician"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Doctor Phone</label>
                  <input type="tel" value={recordForm.doctorPhone} onChange={(e) => setRecordForm({ ...recordForm, doctorPhone: e.target.value })}
                    placeholder="Doctor's number"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea value={recordForm.notes} onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    rows={3} placeholder="Any additional health notes..."
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Health Record'}
                </button>
                <button type="button" onClick={() => setShowRecordForm(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Incident Modal */}
      {showIncidentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-red-700">Log Health Incident</h2>
              <button onClick={() => setShowIncidentForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogIncident} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Student ID *</label>
                  <input type="text" value={incidentForm.studentId} onChange={(e) => setIncidentForm({ ...incidentForm, studentId: e.target.value })}
                    placeholder="Student ID" required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input type="date" value={incidentForm.date} onChange={(e) => setIncidentForm({ ...incidentForm, date: e.target.value })}
                    required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Incident Type *</label>
                  <select value={incidentForm.type} onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {['INJURY', 'ILLNESS', 'ALLERGY_REACTION', 'FAINTING', 'FEVER', 'OTHER'].map((t) => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    rows={2} placeholder="Describe what happened..." required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Action Taken</label>
                  <textarea value={incidentForm.actionTaken} onChange={(e) => setIncidentForm({ ...incidentForm, actionTaken: e.target.value })}
                    rows={2} placeholder="First aid, treatment given..."
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reported By</label>
                  <input type="text" value={incidentForm.reportedBy} onChange={(e) => setIncidentForm({ ...incidentForm, reportedBy: e.target.value })}
                    placeholder="Staff name or ID"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={incidentForm.parentNotified} onChange={(e) => setIncidentForm({ ...incidentForm, parentNotified: e.target.checked })}
                      className="rounded" />
                    <span className="text-sm">Parent Notified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={incidentForm.sentHome} onChange={(e) => setIncidentForm({ ...incidentForm, sentHome: e.target.checked })}
                      className="rounded" />
                    <span className="text-sm">Student Sent Home</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-red-600 text-white py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {saving ? 'Logging...' : 'Log Incident'}
                </button>
                <button type="button" onClick={() => setShowIncidentForm(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

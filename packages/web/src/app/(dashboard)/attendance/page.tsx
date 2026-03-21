'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

interface ClassItem { id: string; name: string; }
interface Section { id: string; name: string; }
interface AttendanceRecord {
  id: string;
  studentId: string;
  status: string;
  remarks?: string;
  student?: {
    id: string;
    admissionNo: string;
    rollNo?: number;
    user: { firstName: string; lastName: string };
  };
  // Flattened fields (from different API versions)
  studentName?: string;
  rollNumber?: string;
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  useEffect(() => {
    fetch('/api/v1/classes', { headers: getHeaders() })
      .then(r => r.ok ? r.json() : []).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setSections([]); setSelectedSectionId(''); return; }
    fetch(`/api/v1/sections?classId=${selectedClassId}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : []).then(setSections).catch(() => setSections([]));
    setSelectedSectionId('');
  }, [selectedClassId]);

  async function loadAttendance() {
    if (!selectedClassId || !selectedSectionId || !date) return;
    setLoading(true); setError(''); setEditMode(false); setChanges({}); setSuccessMsg('');
    try {
      const res = await fetch(
        `/api/v1/attendance/class?classId=${selectedClassId}&sectionId=${selectedSectionId}&date=${date}`,
        { headers: getHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.records ?? [];
        setRecords(arr);
      } else {
        setError(`Failed to load (${res.status})`);
      }
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (selectedClassId && selectedSectionId && date) loadAttendance();
  }, [selectedClassId, selectedSectionId, date]);

  function getName(r: AttendanceRecord): string {
    if (r.student?.user) return `${r.student.user.firstName} ${r.student.user.lastName}`;
    return r.studentName || 'Unknown';
  }

  function getRoll(r: AttendanceRecord): string {
    if (r.student?.rollNo) return String(r.student.rollNo);
    return r.rollNumber || '--';
  }

  function getAdmNo(r: AttendanceRecord): string {
    return r.student?.admissionNo || '';
  }

  function handleStatusChange(studentId: string, newStatus: string) {
    setChanges(prev => ({ ...prev, [studentId]: newStatus }));
  }

  function getEffectiveStatus(r: AttendanceRecord): string {
    return changes[r.studentId] ?? r.status;
  }

  async function saveChanges() {
    if (Object.keys(changes).length === 0) return;
    setSaving(true); setError(''); setSuccessMsg('');
    try {
      const bulkRecords = Object.entries(changes).map(([studentId, status]) => ({
        studentId, status, date,
      }));
      const res = await fetch('/api/v1/attendance/bulk', {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId, sectionId: selectedSectionId, date, records: bulkRecords }),
      });
      if (res.ok) {
        setSuccessMsg(`Updated ${Object.keys(changes).length} records`);
        setChanges({});
        setEditMode(false);
        loadAttendance();
      } else {
        setError(`Save failed (${res.status})`);
      }
    } catch { setError('Save failed'); }
    finally { setSaving(false); }
  }

  const present = records.filter(r => getEffectiveStatus(r) === 'PRESENT').length;
  const absent = records.filter(r => getEffectiveStatus(r) === 'ABSENT').length;
  const late = records.filter(r => getEffectiveStatus(r) === 'LATE').length;
  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        {records.length > 0 && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button onClick={() => { setEditMode(false); setChanges({}); }} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">Cancel</button>
                <button onClick={saveChanges} disabled={!hasChanges || saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
                  <Save className="h-4 w-4" />{saving ? 'Saving...' : `Save (${Object.keys(changes).length})`}
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                Edit Attendance
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Class</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Section</label>
          <select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedClassId} className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50">
            <option value="">Select section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Messages */}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{successMsg}</div>}

      {/* Summary */}
      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{records.length}</p>
            <p className="text-sm text-blue-600">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{present}</p>
            <p className="text-sm text-green-600">Present</p>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{absent}</p>
            <p className="text-sm text-red-600">Absent</p>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{late}</p>
            <p className="text-sm text-yellow-600">Late</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg border">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading attendance...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {selectedClassId && selectedSectionId ? 'No attendance records found for this date.' : 'Select a class, section, and date to view attendance.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium w-12">#</th>
                  <th className="text-left px-4 py-3 font-medium">Roll</th>
                  <th className="text-left px-4 py-3 font-medium">Student Name</th>
                  <th className="text-left px-4 py-3 font-medium">Admission No</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const status = getEffectiveStatus(r);
                  const changed = changes[r.studentId] !== undefined;
                  return (
                    <tr key={r.studentId} className={`border-b last:border-0 hover:bg-muted/30 ${changed ? 'bg-yellow-50' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getRoll(r)}</td>
                      <td className="px-4 py-3 font-medium">{getName(r)}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{getAdmNo(r)}</td>
                      <td className="px-4 py-3 text-center">
                        {editMode ? (
                          <div className="flex gap-1 justify-center">
                            {['PRESENT', 'ABSENT', 'LATE'].map(s => (
                              <button key={s} onClick={() => handleStatusChange(r.studentId, s)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                  status === s
                                    ? s === 'PRESENT' ? 'bg-green-500 text-white' : s === 'ABSENT' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}>
                                {s === 'PRESENT' ? 'P' : s === 'ABSENT' ? 'A' : 'L'}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                            status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                            status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

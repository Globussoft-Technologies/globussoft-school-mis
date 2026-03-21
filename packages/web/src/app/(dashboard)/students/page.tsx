'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, X, Search } from 'lucide-react';

interface StudentRow {
  id: string;
  admissionNo: string;
  rollNo?: number;
  user: { firstName: string; lastName: string; email: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
}

interface ClassOption { id: string; name: string; grade: number; }
interface SectionOption { id: string; name: string; }

const EMPTY_FORM = {
  admissionNo: '', firstName: '', lastName: '', email: '',
  classId: '', sectionId: '', dateOfBirth: '', gender: 'MALE',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [formSections, setFormSections] = useState<SectionOption[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [academicSessionId, setAcademicSessionId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const base = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // Small delay to ensure localStorage token is available after layout auth check
    const timer = setTimeout(async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const h = { Authorization: `Bearer ${token}` };

      // Fetch classes
      try {
        const r = await fetch('/api/v1/classes', { headers: h });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) setClasses(data);
        }
      } catch {}

      // Fetch user profile
      try {
        const r = await fetch('/api/v1/users/me', { headers: h });
        if (r.ok) {
          const me = await r.json();
          setSchoolId(me.schoolId || '');
        }
      } catch {}

      // Fetch academic sessions
      try {
        const r = await fetch('/api/v1/academic-sessions', { headers: h });
        if (r.ok) {
          const sessions = await r.json();
          if (Array.isArray(sessions)) {
            const current = sessions.find((s: any) => s.status === 'ACTIVE') ?? sessions[0];
            if (current) setAcademicSessionId(current.id);
          }
        }
      } catch {}
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!filterClassId) { setSections([]); setFilterSectionId(''); return; }
    const token = getToken();
    fetch(`/api/v1/sections?classId=${filterClassId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setSections).catch(() => setSections([]));
  }, [filterClassId]);

  useEffect(() => {
    if (!form.classId) { setFormSections([]); return; }
    const token = getToken();
    fetch(`/api/v1/sections?classId=${form.classId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setFormSections).catch(() => setFormSections([]));
  }, [form.classId]);

  const fetchStudents = useCallback(async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filterClassId) params.set('classId', filterClassId);
      if (filterSectionId) params.set('sectionId', filterSectionId);
      const res = await fetch(`/api/v1/students?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStudents(await res.json());
    } catch {}
  }, [filterClassId, filterSectionId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filtered = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.user.firstName.toLowerCase().includes(q) || s.user.lastName.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q);
  });

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'classId') setForm(prev => ({ ...prev, classId: value, sectionId: '' }));
    else setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, schoolId, academicSessionId }),
      });
      if (res.ok) { setShowForm(false); setForm(EMPTY_FORM); fetchStudents(); }
      else { const data = await res.json().catch(() => ({})); setError(data?.message ?? `Error ${res.status}`); }
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <button onClick={() => { setShowForm(v => !v); setError(''); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Student'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Student</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Admission No *</label>
                <input required name="admissionNo" value={form.admissionNo} onChange={handleFormChange} placeholder="MIS-2026-001" className="w-full border rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">First Name *</label>
                <input required name="firstName" value={form.firstName} onChange={handleFormChange} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Last Name *</label>
                <input required name="lastName" value={form.lastName} onChange={handleFormChange} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Email *</label>
                <input required type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Date of Birth *</label>
                <input required type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleFormChange} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Gender *</label>
                <select name="gender" value={form.gender} onChange={handleFormChange} className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Class *</label>
                <select required name="classId" value={form.classId} onChange={handleFormChange} className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Section *</label>
                <select required name="sectionId" value={form.sectionId} onChange={handleFormChange} disabled={!form.classId} className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50">
                  <option value="">Select section</option>{formSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-60">{submitting ? 'Saving...' : 'Add Student'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Class</label>
          <select value={filterClassId} onChange={e => { setFilterClassId(e.target.value); setFilterSectionId(''); }}
            className="border rounded-md px-3 py-2 text-sm min-w-[150px]">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Section</label>
          <select value={filterSectionId} onChange={e => setFilterSectionId(e.target.value)} disabled={!filterClassId}
            className="border rounded-md px-3 py-2 text-sm min-w-[120px] disabled:opacity-50">
            <option value="">All Sections</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, admission no, email..." className="w-full border rounded-md pl-9 pr-3 py-2 text-sm" />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Roll</th>
              <th className="text-left p-3 font-medium">Admission No</th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Class</th>
              <th className="text-left p-3 font-medium">Section</th>
              <th className="text-left p-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                {students.length === 0 ? 'No students found. Select a class or add a student.' : 'No matching students.'}
              </td></tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">{s.rollNo || '-'}</td>
                  <td className="p-3 font-mono text-xs">{s.admissionNo}</td>
                  <td className="p-3 font-medium">
                    <Link href={`/students/${s.id}`} className="text-primary hover:underline">
                      {s.user.firstName} {s.user.lastName}
                    </Link>
                  </td>
                  <td className="p-3">{s.class.name}</td>
                  <td className="p-3">{s.section.name}</td>
                  <td className="p-3 text-muted-foreground">{s.user.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

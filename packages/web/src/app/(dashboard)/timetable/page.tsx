'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Edit3, X, Trash2, Check, ArrowRight, ArrowLeft, Wand2 } from 'lucide-react';

interface ClassItem { id: string; name: string; }
interface Section { id: string; name: string; }
interface SubjectItem { id: string; name: string; code: string; }
interface TeacherInfo { id: string; firstName: string; lastName: string; email: string; }
interface SubjectWithTeachers {
  id: string;
  name: string;
  code: string;
  teachers: { id: string; teacherId: string; subjectId: string; teacher: TeacherInfo }[];
}
interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  teacherId?: string;
  subject?: { name: string; id: string; code?: string };
  type: string;
  room?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type WizardStep = 'select' | 'assign' | 'generate' | 'view';

export default function TimetablePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [allTeachers, setAllTeachers] = useState<TeacherInfo[]>([]);
  const [subjectsWithTeachers, setSubjectsWithTeachers] = useState<SubjectWithTeachers[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [academicSessionId, setAcademicSessionId] = useState('');
  const [sessions, setSessions] = useState<{ id: string; name: string; status?: string }[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('select');
  const [teacherAssignments, setTeacherAssignments] = useState<Record<string, string>>({});
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Slot edit modal
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [editForm, setEditForm] = useState<{ subjectId: string; teacherId: string; room: string; type: string }>({
    subjectId: '', teacherId: '', room: '', type: 'LECTURE',
  });
  const [savingSlot, setSavingSlot] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
  const jsonHeaders = () => ({ ...getHeaders(), 'Content-Type': 'application/json' });

  // Load classes and sessions on mount
  useEffect(() => {
    fetch('/api/v1/classes', { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/v1/academic-sessions', { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setSessions(Array.isArray(data) ? data : []);
      const active = (Array.isArray(data) ? data : []).find(s => s.status === 'ACTIVE');
      if (active) setAcademicSessionId(active.id);
    }).catch(() => {});
    // Load teachers (users with TEACHER role)
    fetch('/api/v1/users?role=TEACHER', { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setAllTeachers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Load sections, subjects when class changes
  useEffect(() => {
    if (!selectedClassId) { setSections([]); setSelectedSectionId(''); setSubjects([]); setSubjectsWithTeachers([]); return; }
    fetch(`/api/v1/sections?classId=${selectedClassId}`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(setSections).catch(() => {});
    fetch(`/api/v1/subjects?classId=${selectedClassId}`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(d => setSubjects(Array.isArray(d) ? d : [])).catch(() => {});
    // Load teacher-subject assignments for this class
    fetch(`/api/v1/timetable/teacher-subjects?classId=${selectedClassId}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const subs = Array.isArray(d) ? d : [];
        setSubjectsWithTeachers(subs);
        // Pre-fill teacher assignments from existing data
        const assignments: Record<string, string> = {};
        for (const sub of subs) {
          if (sub.teachers && sub.teachers.length > 0) {
            assignments[sub.id] = sub.teachers[0].teacherId;
          }
        }
        setTeacherAssignments(assignments);
      })
      .catch(() => {});
    setSelectedSectionId(''); setSlots([]); setTimetableId(null);
  }, [selectedClassId]);

  const loadTimetable = useCallback(() => {
    if (!selectedClassId || !selectedSectionId) return;
    setLoading(true); setMsg('');
    fetch(`/api/v1/timetable?classId=${selectedClassId}&sectionId=${selectedSectionId}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setSlots(data?.slots ?? []);
        setTimetableId(data?.id ?? null);
        setLoading(false);
        // If timetable exists, jump to view step
        if (data?.slots?.length > 0) {
          setWizardStep('view');
        }
      })
      .catch(() => { setSlots([]); setTimetableId(null); setLoading(false); });
  }, [selectedClassId, selectedSectionId]);

  useEffect(() => { loadTimetable(); }, [loadTimetable]);

  // Save teacher-subject assignments
  async function handleSaveAssignments() {
    const assignments = Object.entries(teacherAssignments)
      .filter(([, teacherId]) => teacherId)
      .map(([subjectId, teacherId]) => ({ subjectId, teacherId }));
    if (assignments.length === 0) { setMsg('Please assign at least one teacher.'); return; }

    setSavingAssignments(true); setMsg('');
    try {
      const res = await fetch('/api/v1/timetable/teacher-subjects', {
        method: 'POST', headers: jsonHeaders(),
        body: JSON.stringify({ assignments }),
      });
      if (res.ok) {
        setMsg('Teacher assignments saved!');
        setWizardStep('generate');
      } else {
        const e = await res.json().catch(() => ({}));
        setMsg(`Failed to save: ${e.message || res.status}`);
      }
    } catch { setMsg('Failed to save assignments.'); }
    finally { setSavingAssignments(false); }
  }

  // Auto-generate timetable
  async function handleAutoGenerate() {
    if (!selectedClassId || !selectedSectionId || !academicSessionId) return;
    setGenerating(true); setMsg('');
    try {
      const res = await fetch('/api/v1/timetable-generator/generate', {
        method: 'POST', headers: jsonHeaders(),
        body: JSON.stringify({ classId: selectedClassId, sectionId: selectedSectionId, academicSessionId }),
      });
      if (res.ok) {
        setMsg('Timetable generated successfully!');
        loadTimetable();
        setWizardStep('view');
      } else {
        const e = await res.json().catch(() => ({}));
        setMsg(`Failed: ${e.message || res.status}`);
      }
    } catch { setMsg('Generation failed.'); }
    finally { setGenerating(false); }
  }

  // Delete timetable
  async function handleDeleteTimetable() {
    if (!timetableId) return;
    if (!confirm('Are you sure you want to delete this timetable? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/timetable/${timetableId}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        setMsg('Timetable deleted.');
        setSlots([]); setTimetableId(null);
        setWizardStep('select');
      } else { setMsg('Failed to delete timetable.'); }
    } catch { setMsg('Failed to delete timetable.'); }
    finally { setLoading(false); }
  }

  // Open slot edit modal
  function openSlotEdit(slot: Slot) {
    if (slot.type === 'BREAK' || slot.type === 'ASSEMBLY') return;
    setEditingSlot(slot);
    setEditForm({
      subjectId: slot.subjectId || '',
      teacherId: slot.teacherId || '',
      room: slot.room || '',
      type: slot.type || 'LECTURE',
    });
  }

  // Save slot edit
  async function handleSaveSlot() {
    if (!editingSlot) return;
    setSavingSlot(true); setMsg('');
    try {
      const res = await fetch(`/api/v1/timetable/slots/${editingSlot.id}`, {
        method: 'PATCH', headers: jsonHeaders(),
        body: JSON.stringify({
          subjectId: editForm.subjectId || null,
          teacherId: editForm.teacherId || null,
          room: editForm.room || null,
          type: editForm.subjectId ? editForm.type : 'FREE',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSlots(prev => prev.map(s => s.id === editingSlot.id ? { ...s, ...updated } : s));
        setEditingSlot(null);
        setMsg('Slot updated.');
      } else {
        const e = await res.json().catch(() => ({}));
        setMsg(`Failed: ${e.message || res.status}`);
      }
    } catch { setMsg('Failed to update slot.'); }
    finally { setSavingSlot(false); }
  }

  // Calendar / view helpers
  const selectedDayOfWeek = selectedDate.getDay();
  const dailySlots = slots.filter(s => s.dayOfWeek === selectedDayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime));
  function getDaysInMonth(month: number, year: number) { return new Date(year, month + 1, 0).getDate(); }
  function getFirstDayOfMonth(month: number, year: number) { return new Date(year, month, 1).getDay(); }
  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();
  function isSelectedDay(day: number) { return selectedDate.getDate() === day && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear; }
  function isToday(day: number) { return today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear; }
  function isWeekend(day: number) { return new Date(calYear, calMonth, day).getDay() === 0; }
  const weekDays = [1, 2, 3, 4, 5, 6];
  const timeSlots = [...new Set(slots.map(s => s.startTime))].sort();

  // Wizard step labels
  const steps = [
    { key: 'select' as const, label: '1. Select Class' },
    { key: 'assign' as const, label: '2. Assign Teachers' },
    { key: 'generate' as const, label: '3. Generate' },
    { key: 'view' as const, label: '4. View Timetable' },
  ];

  const canProceedToAssign = !!selectedClassId && !!selectedSectionId && !!academicSessionId;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Timetable</h1>
        {wizardStep === 'view' && slots.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => setView('weekly')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'weekly' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>Weekly</button>
            <button onClick={() => setView('daily')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'daily' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>Daily Calendar</button>
          </div>
        )}
      </div>

      {/* Wizard Step Indicator */}
      <div className="flex items-center gap-1 mb-6 bg-card rounded-lg border p-3">
        {steps.map((step, i) => {
          const isActive = wizardStep === step.key;
          const stepIdx = steps.findIndex(s => s.key === wizardStep);
          const isPast = steps.findIndex(s => s.key === step.key) < stepIdx;
          return (
            <div key={step.key} className="flex items-center">
              {i > 0 && <div className={`w-8 h-0.5 mx-1 ${isPast || isActive ? 'bg-primary' : 'bg-muted'}`} />}
              <button
                onClick={() => {
                  // Allow going back to previous steps
                  const targetIdx = steps.findIndex(s => s.key === step.key);
                  if (targetIdx <= stepIdx) setWizardStep(step.key);
                }}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground font-semibold' :
                  isPast ? 'bg-primary/20 text-primary font-medium' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {step.label}
              </button>
            </div>
          );
        })}
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded text-sm ${msg.includes('Failed') || msg.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
          <button onClick={() => setMsg('')} className="ml-2 text-xs opacity-60 hover:opacity-100">dismiss</button>
        </div>
      )}

      {/* STEP 1: Select Class + Section */}
      {wizardStep === 'select' && (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Select Class, Section &amp; Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedClassId} className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50">
                <option value="">Select section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Academic Session</label>
              <select value={academicSessionId} onChange={e => setAcademicSessionId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setWizardStep('assign')}
              disabled={!canProceedToAssign}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
            >
              Next: Assign Teachers <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Assign Teachers to Subjects */}
      {wizardStep === 'assign' && (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-1">Assign Teachers to Subjects</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select which teacher will teach each subject for this class. This determines timetable generation.
          </p>

          {subjectsWithTeachers.length === 0 && subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No subjects found for the selected class.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {(subjectsWithTeachers.length > 0 ? subjectsWithTeachers : subjects).map(sub => (
                <div key={sub.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.code}</p>
                  </div>
                  <div className="w-64">
                    <select
                      value={teacherAssignments[sub.id] || ''}
                      onChange={e => setTeacherAssignments(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">-- Select Teacher --</option>
                      {allTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setWizardStep('select')}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setWizardStep('generate')}
                className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Skip <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={savingAssignments}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
              >
                {savingAssignments ? 'Saving...' : <>Save &amp; Continue <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Generate Timetable */}
      {wizardStep === 'generate' && (
        <div className="bg-card rounded-lg border p-6 text-center">
          <Wand2 className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-lg font-semibold mb-2">Ready to Generate</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            The system will auto-generate a timetable for the selected class and section,
            using teacher-subject assignments and conflict detection.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setWizardStep('assign')}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={handleAutoGenerate}
              disabled={generating || !selectedClassId || !selectedSectionId}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
            >
              {generating ? (
                <>Generating...</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Auto-Generate Timetable</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: View Timetable */}
      {wizardStep === 'view' && (
        <>
          {/* Compact info bar */}
          <div className="bg-card rounded-lg border p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span><span className="font-medium">Class:</span> {classes.find(c => c.id === selectedClassId)?.name}</span>
              <span><span className="font-medium">Section:</span> {sections.find(s => s.id === selectedSectionId)?.name}</span>
              <span><span className="font-medium">Session:</span> {sessions.find(s => s.id === academicSessionId)?.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setWizardStep('assign')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
              >
                <Edit3 className="h-3 w-3" /> Edit Assignments
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
              >
                <Wand2 className="h-3 w-3" /> {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={handleDeleteTimetable}
                disabled={!timetableId}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>

          {/* DAILY CALENDAR VIEW */}
          {view === 'daily' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="bg-card rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-1 hover:bg-muted rounded">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="font-semibold text-sm">{monthName}</h3>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-1 hover:bg-muted rounded">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {SHORT_DAYS.map(d => <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>)}
                  {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const weekend = isWeekend(day);
                    return (
                      <button key={day} onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                        className={`py-1.5 rounded text-xs transition-all ${
                          isSelectedDay(day) ? 'bg-primary text-primary-foreground font-bold' :
                          isToday(day) ? 'bg-blue-100 text-blue-700 font-bold' :
                          weekend ? 'text-red-400' : 'hover:bg-muted'
                        }`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Daily Schedule */}
              <div className="lg:col-span-2 bg-card rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{DAY_NAMES[selectedDayOfWeek]}&apos;s Schedule</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Click any period to edit it</p>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                ) : selectedDayOfWeek === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Sunday - No classes</div>
                ) : dailySlots.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {slots.length === 0 ? 'No timetable configured.' : 'No periods for this day.'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {dailySlots.map((slot, idx) => {
                      const isBreak = slot.type === 'BREAK';
                      const isAssembly = slot.type === 'ASSEMBLY';
                      const isFree = slot.type === 'FREE';
                      const isClickable = !isBreak && !isAssembly;
                      return (
                        <div
                          key={slot.id}
                          onClick={() => isClickable && openSlotEdit(slot)}
                          className={`flex items-center gap-4 px-4 py-3 ${isBreak ? 'bg-orange-50' : isAssembly ? 'bg-blue-50' : ''} ${isClickable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                        >
                          <div className="w-16 text-center">
                            <p className="text-xs font-bold text-muted-foreground">P{idx + 1}</p>
                            <p className="text-xs text-muted-foreground">{slot.startTime}</p>
                            <p className="text-xs text-muted-foreground">{slot.endTime}</p>
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${isBreak ? 'text-orange-600' : isAssembly ? 'text-blue-600' : isFree ? 'text-muted-foreground' : ''}`}>
                              {slot.subject?.name || slot.type}
                            </p>
                          </div>
                          {slot.room && <span className="text-xs text-muted-foreground">{slot.room}</span>}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            isBreak ? 'bg-orange-100 text-orange-600' :
                            isAssembly ? 'bg-blue-100 text-blue-600' :
                            isFree ? 'bg-gray-100 text-gray-500' :
                            'bg-green-100 text-green-700'
                          }`}>{slot.type}</span>
                          {isClickable && <Edit3 className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WEEKLY GRID VIEW */}
          {view === 'weekly' && (
            <div className="bg-card rounded-lg border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground text-sm">Loading timetable...</div>
              ) : slots.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">No timetable. Go back to generate one.</div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b bg-muted/30">
                    <p className="text-xs text-muted-foreground">Click any cell to edit the slot</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border px-3 py-2 text-left font-medium">Period</th>
                          {weekDays.map(d => <th key={d} className="border px-3 py-2 text-center font-medium">{DAY_NAMES[d]}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((time, idx) => {
                          const slotsAtTime = slots.filter(s => s.startTime === time);
                          const sample = slotsAtTime[0];
                          return (
                            <tr key={time} className="hover:bg-muted/20">
                              <td className="border px-3 py-2 text-xs">
                                <p className="font-medium">P{idx + 1}</p>
                                <p className="text-muted-foreground">{time} - {sample?.endTime || ''}</p>
                              </td>
                              {weekDays.map(day => {
                                const cell = slots.find(s => s.dayOfWeek === day && s.startTime === time);
                                const isBreak = cell?.type === 'BREAK';
                                const isAssembly = cell?.type === 'ASSEMBLY';
                                const isFree = cell?.type === 'FREE';
                                const isClickable = cell && !isBreak && !isAssembly;
                                return (
                                  <td
                                    key={day}
                                    onClick={() => isClickable && openSlotEdit(cell)}
                                    className={`border px-3 py-2 text-center ${isBreak ? 'bg-orange-50' : isAssembly ? 'bg-blue-50' : isFree ? 'bg-gray-50' : ''} ${isClickable ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                                  >
                                    <p className={`font-medium text-xs ${isBreak ? 'text-orange-600' : isAssembly ? 'text-blue-600' : isFree ? 'text-muted-foreground' : ''}`}>
                                      {cell?.subject?.name || cell?.type || '-'}
                                    </p>
                                    {cell?.room && <p className="text-[10px] text-muted-foreground mt-0.5">{cell.room}</p>}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* SLOT EDIT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingSlot(null)}>
          <div className="bg-card rounded-lg border shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Edit Slot</h3>
              <button onClick={() => setEditingSlot(null)} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {DAY_NAMES[editingSlot.dayOfWeek]} | {editingSlot.startTime} - {editingSlot.endTime}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select
                  value={editForm.subjectId}
                  onChange={e => setEditForm(prev => ({ ...prev, subjectId: e.target.value, type: e.target.value ? 'LECTURE' : 'FREE' }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">FREE (no subject)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teacher</label>
                <select
                  value={editForm.teacherId}
                  onChange={e => setEditForm(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">-- No Teacher --</option>
                  {allTeachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Room</label>
                <input
                  type="text"
                  value={editForm.room}
                  onChange={e => setEditForm(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="e.g. Room 101, Lab A"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editForm.type}
                  onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="LECTURE">LECTURE</option>
                  <option value="LAB">LAB</option>
                  <option value="FREE">FREE</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditingSlot(null)} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={handleSaveSlot}
                disabled={savingSlot}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
              >
                {savingSlot ? 'Saving...' : <><Check className="h-4 w-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

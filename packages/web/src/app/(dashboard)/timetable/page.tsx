'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Save, X } from 'lucide-react';

interface ClassItem { id: string; name: string; }
interface Section { id: string; name: string; }
interface SubjectItem { id: string; name: string; code: string; }
interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  subject?: { name: string; id: string };
  type: string;
  room?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TimetablePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [academicSessionId, setAcademicSessionId] = useState('');
  const [sessions, setSessions] = useState<{ id: string; name: string; status?: string }[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [editMode, setEditMode] = useState(false);
  const [editSlot, setEditSlot] = useState<{ id: string; subjectId: string; type: string } | null>(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
  const jsonHeaders = () => ({ ...getHeaders(), 'Content-Type': 'application/json' });

  useEffect(() => {
    fetch('/api/v1/classes', { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/v1/academic-sessions', { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setSessions(Array.isArray(data) ? data : []);
      const active = (Array.isArray(data) ? data : []).find(s => s.status === 'ACTIVE');
      if (active) setAcademicSessionId(active.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setSections([]); setSelectedSectionId(''); setSubjects([]); return; }
    fetch(`/api/v1/sections?classId=${selectedClassId}`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(setSections).catch(() => {});
    fetch(`/api/v1/subjects?classId=${selectedClassId}`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(d => setSubjects(Array.isArray(d) ? d : [])).catch(() => {});
    setSelectedSectionId(''); setSlots([]);
  }, [selectedClassId]);

  function loadTimetable() {
    if (!selectedClassId || !selectedSectionId) return;
    setLoading(true); setMsg('');
    fetch(`/api/v1/timetable?classId=${selectedClassId}&sectionId=${selectedSectionId}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSlots(data?.slots ?? []); setLoading(false); })
      .catch(() => { setSlots([]); setLoading(false); });
  }

  useEffect(() => { loadTimetable(); }, [selectedClassId, selectedSectionId]);

  async function handleAutoGenerate() {
    if (!selectedClassId || !selectedSectionId || !academicSessionId) return;
    setGenerating(true); setMsg('');
    try {
      const res = await fetch('/api/v1/timetable-generator/generate', {
        method: 'POST', headers: jsonHeaders(),
        body: JSON.stringify({ classId: selectedClassId, sectionId: selectedSectionId, academicSessionId }),
      });
      if (res.ok) { setMsg('Timetable generated!'); loadTimetable(); }
      else { const e = await res.json().catch(() => ({})); setMsg(`Failed: ${e.message || res.status}`); }
    } catch { setMsg('Generation failed'); }
    finally { setGenerating(false); }
  }

  // Get day of week for selected date
  const selectedDayOfWeek = selectedDate.getDay();
  const dailySlots = slots.filter(s => s.dayOfWeek === selectedDayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Calendar helpers
  function getDaysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstDayOfMonth(month: number, year: number) {
    return new Date(year, month, 1).getDay();
  }

  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();

  function isSelectedDay(day: number) {
    return selectedDate.getDate() === day && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;
  }
  function isToday(day: number) {
    return today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear;
  }
  function isWeekend(day: number) {
    const d = new Date(calYear, calMonth, day).getDay();
    return d === 0; // Sunday only
  }

  // Weekly grid
  const weekDays = [1, 2, 3, 4, 5, 6]; // Mon-Sat
  const timeSlots = [...new Set(slots.map(s => s.startTime))].sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Timetable</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('weekly')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'weekly' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>Weekly</button>
          <button onClick={() => setView('daily')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'daily' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>Daily Calendar</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Class</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-sm font-medium mb-1">Section</label>
          <select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedClassId} className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50">
            <option value="">Select section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium mb-1">Session</label>
          <select value={academicSessionId} onChange={e => setAcademicSessionId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={handleAutoGenerate} disabled={generating || !selectedClassId || !selectedSectionId}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
          {generating ? 'Generating...' : 'Auto-Generate'}
        </button>
      </div>

      {msg && <div className={`mb-4 p-3 rounded text-sm ${msg.includes('Failed') || msg.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>}

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
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{DAY_NAMES[selectedDayOfWeek]}&apos;s Schedule</h3>
              {dailySlots.length > 0 && (
                <button onClick={() => setEditMode(!editMode)} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  {editMode ? <><X className="h-3 w-3" /> Cancel</> : <><Edit3 className="h-3 w-3" /> Edit</>}
                </button>
              )}
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : selectedDayOfWeek === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Sunday — No classes</div>
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
                  return (
                    <div key={slot.id} className={`flex items-center gap-4 px-4 py-3 ${isBreak ? 'bg-orange-50' : isAssembly ? 'bg-blue-50' : ''}`}>
                      <div className="w-16 text-center">
                        <p className="text-xs font-bold text-muted-foreground">P{idx + 1}</p>
                        <p className="text-xs text-muted-foreground">{slot.startTime}</p>
                        <p className="text-xs text-muted-foreground">{slot.endTime}</p>
                      </div>
                      <div className="flex-1">
                        {editMode && !isBreak && !isAssembly ? (
                          <select
                            value={editSlot?.id === slot.id ? editSlot.subjectId : (slot.subjectId || '')}
                            onChange={e => {
                              const subId = e.target.value;
                              const subName = subjects.find(s => s.id === subId)?.name || 'FREE';
                              setEditSlot({ id: slot.id, subjectId: subId, type: subId ? 'LECTURE' : 'FREE' });
                              // TODO: Save via API
                            }}
                            className="border rounded px-2 py-1 text-sm w-full"
                          >
                            <option value="">FREE</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        ) : (
                          <p className={`font-medium text-sm ${isBreak ? 'text-orange-600' : isAssembly ? 'text-blue-600' : isFree ? 'text-muted-foreground' : ''}`}>
                            {slot.subject?.name || slot.type}
                          </p>
                        )}
                      </div>
                      {slot.room && <span className="text-xs text-muted-foreground">{slot.room}</span>}
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        isBreak ? 'bg-orange-100 text-orange-600' :
                        isAssembly ? 'bg-blue-100 text-blue-600' :
                        isFree ? 'bg-gray-100 text-gray-500' :
                        'bg-green-100 text-green-700'
                      }`}>{slot.type}</span>
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
          ) : !selectedClassId || !selectedSectionId ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Select a class and section.</div>
          ) : slots.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No timetable. Use &quot;Auto-Generate&quot;.</div>
          ) : (
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
                          <p className="text-muted-foreground">{time} – {sample?.endTime || ''}</p>
                        </td>
                        {weekDays.map(day => {
                          const cell = slots.find(s => s.dayOfWeek === day && s.startTime === time);
                          const isBreak = cell?.type === 'BREAK';
                          const isAssembly = cell?.type === 'ASSEMBLY';
                          const isFree = cell?.type === 'FREE';
                          return (
                            <td key={day} className={`border px-3 py-2 text-center ${isBreak ? 'bg-orange-50' : isAssembly ? 'bg-blue-50' : isFree ? 'bg-gray-50' : ''}`}>
                              <p className={`font-medium text-xs ${isBreak ? 'text-orange-600' : isAssembly ? 'text-blue-600' : isFree ? 'text-muted-foreground' : ''}`}>
                                {cell?.subject?.name || cell?.type || '—'}
                              </p>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  BookOpen,
  AlertCircle,
  X,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Assignment {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  totalMarks: number;
  isPublished: boolean;
  subject?: { id: string; name: string; code: string };
  class?: { id: string; grade: number; name: string };
  section?: { id: string; name: string } | null;
  teacher?: { id: string; firstName: string; lastName: string };
}

interface ClassRecord {
  id: string;
  grade: number;
  name: string;
  sections: { id: string; name: string }[];
}

// Subject → color mapping
const SUBJECT_COLORS: Record<string, { pill: string; dot: string }> = {
  Mathematics: { pill: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  Math: { pill: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  Science: { pill: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  Physics: { pill: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  Chemistry: { pill: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  Biology: { pill: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  English: { pill: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  Hindi: { pill: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  History: { pill: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  Geography: { pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  'Social Science': { pill: 'bg-lime-100 text-lime-800', dot: 'bg-lime-500' },
  'Computer Science': { pill: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  Economics: { pill: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  Commerce: { pill: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  default: { pill: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
};

function getSubjectColor(name?: string) {
  if (!name) return SUBJECT_COLORS.default;
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return SUBJECT_COLORS.default;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function dateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export default function HomeworkCalendarPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Group assignments by due date
  const assignmentsByDate: Record<string, Assignment[]> = {};
  for (const a of assignments) {
    const key = a.dueDate ? a.dueDate.split('T')[0] : '';
    if (key) {
      if (!assignmentsByDate[key]) assignmentsByDate[key] = [];
      assignmentsByDate[key].push(a);
    }
  }

  // Calendar grid calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const fetchClasses = useCallback(async () => {
    const res = await fetch(`${API}/classes`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    }
  }, [selectedClassId]);

  const fetchAssignments = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/assignments?classId=${selectedClassId}`, {
        headers: authHeaders(),
      });
      if (res.ok) setAssignments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { if (selectedClassId) fetchAssignments(); }, [selectedClassId, fetchAssignments]);

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }

  const selectedAssignments = selectedDay ? (assignmentsByDate[selectedDay] ?? []) : [];

  const today = dateKey(new Date());

  // Legend items from current assignments
  const subjectsInView = Array.from(
    new Set(
      assignments
        .filter((a) => {
          const key = a.dueDate?.split('T')[0];
          if (!key) return false;
          const d = new Date(key);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .map((a) => a.subject?.name)
        .filter(Boolean)
    )
  ) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            Homework Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View all assignments and homework by due date
          </p>
        </div>
        {/* Class selector */}
        <select
          value={selectedClassId}
          onChange={(e) => { setSelectedClassId(e.target.value); setSelectedDay(null); }}
          className="border rounded-md px-3 py-2 text-sm bg-background min-w-40"
        >
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Class {c.grade} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="bg-card border rounded-lg overflow-hidden">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
              <button
                onClick={prevMonth}
                className="p-2 rounded-md hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-md hover:bg-muted"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                Loading assignments...
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                  const dateStr = isCurrentMonth
                    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                    : null;
                  const dayAssignments = dateStr ? (assignmentsByDate[dateStr] ?? []) : [];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDay;
                  const hasOverdue = dayAssignments.some((a) => isOverdue(a.dueDate));

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (dateStr && dayAssignments.length > 0) {
                          setSelectedDay(isSelected ? null : dateStr);
                        }
                      }}
                      className={`min-h-[80px] border-r border-b last:border-r-0 p-1.5 transition-colors ${
                        isCurrentMonth ? 'bg-background' : 'bg-muted/20'
                      } ${dayAssignments.length > 0 ? 'cursor-pointer hover:bg-muted/40' : ''} ${
                        isSelected ? 'ring-2 ring-primary ring-inset' : ''
                      }`}
                    >
                      {isCurrentMonth && (
                        <>
                          <div
                            className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {dayNum}
                          </div>
                          <div className="space-y-0.5">
                            {dayAssignments.slice(0, 3).map((a) => {
                              const color = getSubjectColor(a.subject?.name);
                              const overdue = isOverdue(a.dueDate);
                              return (
                                <div
                                  key={a.id}
                                  className={`text-xs px-1 py-0.5 rounded truncate ${
                                    overdue ? 'bg-red-100 text-red-800' : color.pill
                                  }`}
                                  title={`${a.subject?.name ?? 'Unknown'}: ${a.title}`}
                                >
                                  {a.subject?.name ?? 'Homework'}: {a.title}
                                </div>
                              );
                            })}
                            {dayAssignments.length > 3 && (
                              <div className="text-xs text-muted-foreground px-1">
                                +{dayAssignments.length - 3} more
                              </div>
                            )}
                            {hasOverdue && dayAssignments.length <= 3 && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          {subjectsInView.length > 0 && (
            <div className="mt-4 bg-card border rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Subject Color Legend
              </h3>
              <div className="flex flex-wrap gap-3">
                {subjectsInView.map((subject) => {
                  const color = getSubjectColor(subject);
                  return (
                    <div key={subject} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full ${color.dot}`} />
                      <span className="text-xs text-muted-foreground">{subject}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Overdue</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Day Detail Panel */}
        {selectedDay && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-card border rounded-lg overflow-hidden sticky top-4">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <h3 className="font-semibold text-sm">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {selectedAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No assignments due on this day
                  </p>
                ) : (
                  selectedAssignments.map((a) => {
                    const color = getSubjectColor(a.subject?.name);
                    const overdue = isOverdue(a.dueDate);
                    return (
                      <div
                        key={a.id}
                        className={`p-3 rounded-lg border ${overdue ? 'border-red-200 bg-red-50' : 'border-border bg-muted/20'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${color.pill}`}>
                                {a.subject?.name ?? 'General'}
                              </span>
                              {overdue && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-0.5">
                                  <AlertCircle className="h-3 w-3" />
                                  Overdue
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium leading-snug">{a.title}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {a.type.replace('_', ' ')}
                              </span>
                              <span>{a.totalMarks} marks</span>
                            </div>
                          </div>
                        </div>
                        {a.section && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Section: {a.section.name}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary strip */}
      {!selectedClassId && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" />
          Select a class above to view its homework calendar.
        </div>
      )}

      {selectedClassId && assignments.length === 0 && !loading && (
        <div className="bg-muted/30 border rounded-lg p-6 text-center text-muted-foreground text-sm">
          No assignments found for this class. Assignments with due dates will appear on the calendar.
        </div>
      )}
    </div>
  );
}

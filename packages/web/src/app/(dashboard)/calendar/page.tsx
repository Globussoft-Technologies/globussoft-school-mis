'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  isRecurring: boolean;
  schoolId: string;
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
}

const EVENT_TYPES = ['HOLIDAY', 'EXAM', 'EVENT', 'MEETING', 'DEADLINE', 'OTHER'];

const TYPE_COLORS: Record<string, string> = {
  HOLIDAY: 'bg-red-500',
  EXAM: 'bg-orange-500',
  EVENT: 'bg-blue-500',
  MEETING: 'bg-purple-500',
  DEADLINE: 'bg-yellow-500',
  OTHER: 'bg-gray-400',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  HOLIDAY: 'bg-red-100 text-red-700',
  EXAM: 'bg-orange-100 text-orange-700',
  EVENT: 'bg-blue-100 text-blue-700',
  MEETING: 'bg-purple-100 text-purple-700',
  DEADLINE: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-600',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function getSchoolId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.schoolId || '';
  } catch {
    return '';
  }
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isoDate(dateStr: string) {
  return dateStr.split('T')[0];
}

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'EVENT',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  isRecurring: false,
  isPublic: true,
};

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-based
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      const params = new URLSearchParams({
        month: String(currentMonth + 1),
        year: String(currentYear),
        ...(schoolId ? { schoolId } : {}),
      });
      const res = await fetch(`${API}/calendar?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  const fetchUpcoming = useCallback(async () => {
    try {
      const schoolId = getSchoolId();
      const params = schoolId ? `?schoolId=${schoolId}` : '';
      const res = await fetch(`${API}/calendar/upcoming${params}`, { headers: authHeaders() });
      const data = await res.json();
      setUpcoming(Array.isArray(data) ? data : []);
    } catch {
      setUpcoming([]);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  function getEventsForDay(day: number): CalendarEvent[] {
    const target = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      const start = isoDate(e.startDate);
      const end = e.endDate ? isoDate(e.endDate) : start;
      return start <= target && target <= end;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const schoolId = getSchoolId();
      const res = await fetch(`${API}/calendar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          isRecurring: form.isRecurring,
          isPublic: form.isPublic,
          schoolId,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        fetchEvents();
        fetchUpcoming();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch(`${API}/calendar/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    fetchEvents();
    fetchUpcoming();
  }

  const totalDays = daysInMonth(currentYear, currentMonth);
  const startDay = firstDayOfMonth(currentYear, currentMonth);

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Academic Calendar</h1>
            <p className="text-sm text-muted-foreground">Manage school events, holidays, exams and deadlines</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Add Calendar Event</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Event title"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                />
                Public
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                />
                Recurring
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Event'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-5 py-2 rounded-md text-sm border hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card border rounded-lg p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {EVENT_TYPES.map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${TYPE_COLORS[t]}`} />
                {t}
              </span>
            ))}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
              {/* Empty cells before month start */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-card min-h-[64px]" />
              ))}
              {/* Day cells */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday =
                  day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear();
                const isSelected = selectedDay === day;
                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`bg-card min-h-[64px] p-1 cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? 'ring-2 ring-primary ring-inset' : ''
                    }`}
                  >
                    <span
                      className={`text-xs font-medium block mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-2 h-2 rounded-full ${TYPE_COLORS[ev.type]}`}
                          title={ev.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected day events */}
          {selectedDay && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">
                Events on {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
              </h3>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => (
                    <div key={ev.id} className="flex items-start justify-between bg-muted/40 rounded-md p-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[ev.type]}`} />
                          <span className="text-sm font-medium">{ev.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_BADGE_COLORS[ev.type]}`}>
                            {ev.type}
                          </span>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-4">{ev.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="text-muted-foreground hover:text-red-500 ml-2"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Upcoming (Next 30 Days)</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((ev) => (
                <div key={ev.id} className="border-l-2 pl-3" style={{ borderColor: TYPE_COLORS[ev.type].replace('bg-', '#') }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_BADGE_COLORS[ev.type]}`}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ev.startDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {ev.endDate && ev.endDate !== ev.startDate && (
                      <> &mdash; {new Date(ev.endDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}</>
                    )}
                  </p>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

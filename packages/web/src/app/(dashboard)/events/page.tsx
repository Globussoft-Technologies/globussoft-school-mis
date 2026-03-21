'use client';

import { useEffect, useState } from 'react';

interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  organizer?: string;
  budget?: number;
  status: string;
  maxParticipants?: number;
  registrations: { id: string; userId: string; role: string; status: string }[];
}

const STATUS_STYLE: Record<string, string> = {
  PLANNED:    'bg-gray-100 text-gray-700',
  APPROVED:   'bg-blue-100 text-blue-700',
  ONGOING:    'bg-green-100 text-green-700',
  COMPLETED:  'bg-purple-100 text-purple-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

const TYPE_STYLE: Record<string, string> = {
  SPORTS_DAY:  'bg-orange-100 text-orange-700',
  ANNUAL_DAY:  'bg-pink-100 text-pink-700',
  CULTURAL:    'bg-indigo-100 text-indigo-700',
  WORKSHOP:    'bg-teal-100 text-teal-700',
  COMPETITION: 'bg-yellow-100 text-yellow-700',
  TRIP:        'bg-cyan-100 text-cyan-700',
  CELEBRATION: 'bg-rose-100 text-rose-700',
  OTHER:       'bg-gray-100 text-gray-700',
};

const EVENT_TYPES = ['SPORTS_DAY', 'ANNUAL_DAY', 'CULTURAL', 'WORKSHOP', 'COMPETITION', 'TRIP', 'CELEBRATION', 'OTHER'];
const EVENT_STATUSES = ['PLANNED', 'APPROVED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export default function EventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [participants, setParticipants] = useState<{ id: string; userId: string; role: string; status: string }[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'CULTURAL',
    startDate: '',
    endDate: '',
    venue: '',
    organizer: '',
    budget: '',
    maxParticipants: '',
  });

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });
  const jsonHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });
  const base = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

  useEffect(() => {
    loadEvents();
  }, [filterType, filterStatus]);

  function loadEvents() {
    setLoading(true);
    let url = `${base}/events`;
    const params: string[] = [];
    if (filterType) params.push(`type=${filterType}`);
    if (filterStatus) params.push(`status=${filterStatus}`);
    if (params.length) url += '?' + params.join('&');
    fetch(url, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate) { setFormError('Title and start date are required'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        startDate: form.startDate,
      };
      if (form.description) payload.description = form.description;
      if (form.endDate) payload.endDate = form.endDate;
      if (form.venue) payload.venue = form.venue;
      if (form.organizer) payload.organizer = form.organizer;
      if (form.budget) payload.budget = parseFloat(form.budget);
      if (form.maxParticipants) payload.maxParticipants = parseInt(form.maxParticipants);

      const res = await fetch(`${base}/events`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      setShowForm(false);
      setForm({ title: '', description: '', type: 'CULTURAL', startDate: '', endDate: '', venue: '', organizer: '', budget: '', maxParticipants: '' });
      loadEvents();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`${base}/events/${id}/status`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ status }),
    });
    loadEvents();
  }

  async function handleRegister(eventId: string) {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}');
    if (!user.id) { alert('Cannot identify current user'); return; }
    const res = await fetch(`${base}/events/${eventId}/register`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ userId: user.id }),
    });
    if (res.ok) {
      loadEvents();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message ?? 'Registration failed');
    }
  }

  async function loadParticipants(event: SchoolEvent) {
    setSelectedEvent(event);
    const res = await fetch(`${base}/events/${event.id}/participants`, { headers: headers() });
    const data = res.ok ? await res.json() : [];
    setParticipants(Array.isArray(data) ? data : []);
    setShowParticipants(true);
  }

  function activeParticipants(event: SchoolEvent) {
    return event.registrations.filter(r => r.status !== 'CANCELLED').length;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          {showForm ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <div className="bg-card rounded-lg border p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">New Event</h2>
          {formError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input
                type="text"
                value={form.venue}
                onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Organizer</label>
              <input
                type="text"
                value={form.organizer}
                onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget (₹)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Participants</label>
              <input
                type="number"
                value={form.maxParticipants}
                onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Participant Modal */}
      {showParticipants && selectedEvent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg border max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">{selectedEvent.title} — Participants</h3>
              <button onClick={() => setShowParticipants(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No participants yet.</p>
              ) : (
                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">User: {p.userId.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'ATTENDED' ? 'bg-green-100 text-green-700' : p.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-sm">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm bg-card rounded-lg border">
          No events found. Create your first event!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map(event => {
            const participantCount = activeParticipants(event);
            return (
              <div key={event.id} className="bg-card rounded-lg border p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-snug">{event.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[event.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {event.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[event.type] ?? 'bg-gray-100 text-gray-700'}`}>
                    {event.type.replace(/_/g, ' ')}
                  </span>
                </div>

                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Start:</span>{' '}
                    {new Date(event.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  {event.endDate && (
                    <p>
                      <span className="font-medium">End:</span>{' '}
                      {new Date(event.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {event.venue && <p><span className="font-medium">Venue:</span> {event.venue}</p>}
                  {event.organizer && <p><span className="font-medium">Organizer:</span> {event.organizer}</p>}
                  <p>
                    <span className="font-medium">Participants:</span>{' '}
                    {participantCount}{event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
                  </p>
                  {event.budget != null && (
                    <p><span className="font-medium">Budget:</span> ₹{event.budget.toLocaleString('en-IN')}</p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap mt-auto pt-2 border-t">
                  <button
                    onClick={() => handleRegister(event.id)}
                    disabled={event.status === 'CANCELLED' || event.status === 'COMPLETED'}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => loadParticipants(event)}
                    className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted"
                  >
                    Participants
                  </button>
                  <select
                    value={event.status}
                    onChange={e => handleStatusChange(event.id, e.target.value)}
                    className="text-xs border rounded-md px-2 py-1 ml-auto"
                  >
                    {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

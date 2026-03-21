'use client';

import { useEffect, useState } from 'react';
import { Users2, PlusCircle, ChevronDown, ChevronRight, CheckCircle, Clock, FileText, Send, X } from 'lucide-react';

interface Attendee {
  userId?: string;
  name: string;
  role: string;
}

interface AgendaItem {
  item: string;
  discussion?: string;
  decision?: string;
}

interface ActionItem {
  task: string;
  assignedTo: string;
  dueDate?: string;
  status: string;
}

interface Meeting {
  id: string;
  title: string;
  meetingDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  type: string;
  attendees: Attendee[];
  agenda: AgendaItem[];
  actionItems: ActionItem[];
  summary?: string;
  recordedBy: string;
  status: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  STAFF: 'bg-blue-50 text-blue-700 border-blue-200',
  DEPARTMENT: 'bg-purple-50 text-purple-700 border-purple-200',
  PTA: 'bg-green-50 text-green-700 border-green-200',
  COMMITTEE: 'bg-orange-50 text-orange-700 border-orange-200',
  BOARD: 'bg-red-50 text-red-700 border-red-200',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-50 text-gray-600 border-gray-200',
  CIRCULATED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
};

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // New meeting form
  const [form, setForm] = useState({
    title: '',
    meetingDate: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'STAFF',
    summary: '',
    attendeeName: '',
    attendeeRole: '',
  });
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([{ item: '', discussion: '', decision: '' }]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newAction, setNewAction] = useState({ task: '', assignedTo: '', dueDate: '', status: 'PENDING' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const base = process.env.NEXT_PUBLIC_API_URL;
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  async function loadMeetings() {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      const res = await fetch(`${base}/meetings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMeetings(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { loadMeetings(); }, [filterType, filterStatus]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const token = getToken();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const body = {
        ...form,
        attendees,
        agenda: agendaItems.filter((a) => a.item.trim()),
        actionItems,
        recordedBy: user.id || 'system',
        schoolId: user.schoolId || 'default',
      };
      const res = await fetch(`${base}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaveMsg('Meeting created successfully!');
        setForm({ title: '', meetingDate: '', startTime: '', endTime: '', location: '', type: 'STAFF', summary: '', attendeeName: '', attendeeRole: '' });
        setAttendees([]);
        setAgendaItems([{ item: '', discussion: '', decision: '' }]);
        setActionItems([]);
        loadMeetings();
        setActiveTab('list');
      } else {
        const d = await res.json();
        setSaveMsg(d.message || 'Failed to create meeting');
      }
    } catch { setSaveMsg('Failed to create meeting'); }
    finally { setSaving(false); }
  }

  async function changeStatus(id: string, action: 'circulate' | 'approve') {
    const token = getToken();
    const res = await fetch(`${base}/meetings/${id}/${action}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const updated = await res.json();
      setMeetings((prev) => prev.map((m) => m.id === id ? { ...m, status: updated.status } : m));
      if (selectedMeeting?.id === id) setSelectedMeeting((prev) => prev ? { ...prev, status: updated.status } : prev);
    }
  }

  const filteredMeetings = meetings.filter((m) => {
    if (filterType && m.type !== filterType) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users2 className="h-6 w-6 text-primary" />
            Meeting Minutes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Record and manage meeting minutes, agenda, and action items</p>
        </div>
        <button
          onClick={() => setActiveTab('new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          New Meeting
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/40 p-1 rounded-lg w-fit">
        {[
          { id: 'list', label: `All Meetings (${meetings.length})` },
          { id: 'new', label: 'New Meeting' },
          ...(selectedMeeting ? [{ id: 'detail', label: `Detail: ${selectedMeeting.title.slice(0, 20)}...` }] : []),
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id ? 'bg-card shadow font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Meeting List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">All Types</option>
              {['STAFF', 'DEPARTMENT', 'PTA', 'COMMITTEE', 'BOARD', 'OTHER'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CIRCULATED">Circulated</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading meetings...</div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No meetings found.</div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Attendees</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <button onClick={() => { setSelectedMeeting(m); setActiveTab('detail'); }}
                          className="font-medium text-primary hover:underline text-left">
                          {m.title}
                        </button>
                        {m.location && <div className="text-xs text-muted-foreground">{m.location}</div>}
                      </td>
                      <td className="p-3">
                        <div>{formatDate(m.meetingDate)}</div>
                        {m.startTime && <div className="text-xs text-muted-foreground">{m.startTime}{m.endTime ? ` – ${m.endTime}` : ''}</div>}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[m.type] || TYPE_COLORS.OTHER}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {Array.isArray(m.attendees) ? m.attendees.length : 0} people
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[m.status] || ''}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {m.status === 'DRAFT' && (
                            <button onClick={() => changeStatus(m.id, 'circulate')}
                              className="text-xs text-yellow-600 hover:text-yellow-800 font-medium">
                              Circulate
                            </button>
                          )}
                          {m.status === 'CIRCULATED' && (
                            <button onClick={() => changeStatus(m.id, 'approve')}
                              className="text-xs text-green-600 hover:text-green-800 font-medium">
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New Meeting Form */}
      {activeTab === 'new' && (
        <div className="max-w-3xl">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-5">Create Meeting Minutes</h2>
            {saveMsg && (
              <div className={`mb-4 p-3 rounded-md text-sm ${saveMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {saveMsg}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required placeholder="Meeting title"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meeting Date *</label>
                  <input type="date" value={form.meetingDate} onChange={(e) => setForm((f) => ({ ...f, meetingDate: e.target.value }))}
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {['STAFF', 'DEPARTMENT', 'PTA', 'COMMITTEE', 'BOARD', 'OTHER'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Venue/location"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {/* Attendees */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Attendees</h3>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={form.attendeeName}
                    onChange={(e) => setForm((f) => ({ ...f, attendeeName: e.target.value }))}
                    placeholder="Name"
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="text" value={form.attendeeRole}
                    onChange={(e) => setForm((f) => ({ ...f, attendeeRole: e.target.value }))}
                    placeholder="Role/Designation"
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button type="button"
                    onClick={() => {
                      if (form.attendeeName.trim()) {
                        setAttendees((prev) => [...prev, { name: form.attendeeName, role: form.attendeeRole }]);
                        setForm((f) => ({ ...f, attendeeName: '', attendeeRole: '' }));
                      }
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((a, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs">
                      {a.name}{a.role ? ` (${a.role})` : ''}
                      <button type="button" onClick={() => setAttendees((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Agenda Items</h3>
                <div className="space-y-3">
                  {agendaItems.map((item, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground font-medium">Item {i + 1}</span>
                        {agendaItems.length > 1 && (
                          <button type="button" onClick={() => setAgendaItems((prev) => prev.filter((_, j) => j !== i))}
                            className="ml-auto text-red-400 hover:text-red-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <input type="text" value={item.item}
                        onChange={(e) => setAgendaItems((prev) => prev.map((a, j) => j === i ? { ...a, item: e.target.value } : a))}
                        placeholder="Agenda item"
                        className="w-full border rounded-md px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-primary" />
                      <textarea value={item.discussion || ''}
                        onChange={(e) => setAgendaItems((prev) => prev.map((a, j) => j === i ? { ...a, discussion: e.target.value } : a))}
                        placeholder="Discussion notes..."
                        rows={2}
                        className="w-full border rounded-md px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                      <input type="text" value={item.decision || ''}
                        onChange={(e) => setAgendaItems((prev) => prev.map((a, j) => j === i ? { ...a, decision: e.target.value } : a))}
                        placeholder="Decision/outcome"
                        className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setAgendaItems((prev) => [...prev, { item: '', discussion: '', decision: '' }])}
                    className="text-xs text-primary hover:underline">
                    + Add Agenda Item
                  </button>
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Action Items</h3>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <input type="text" value={newAction.task}
                    onChange={(e) => setNewAction((a) => ({ ...a, task: e.target.value }))}
                    placeholder="Task"
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]" />
                  <input type="text" value={newAction.assignedTo}
                    onChange={(e) => setNewAction((a) => ({ ...a, assignedTo: e.target.value }))}
                    placeholder="Assigned To"
                    className="w-32 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="date" value={newAction.dueDate}
                    onChange={(e) => setNewAction((a) => ({ ...a, dueDate: e.target.value }))}
                    className="w-36 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button type="button"
                    onClick={() => {
                      if (newAction.task.trim()) {
                        setActionItems((prev) => [...prev, { ...newAction }]);
                        setNewAction({ task: '', assignedTo: '', dueDate: '', status: 'PENDING' });
                      }
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
                    Add
                  </button>
                </div>
                {actionItems.length > 0 && (
                  <div className="space-y-1">
                    {actionItems.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-md text-sm">
                        <CheckCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1">{a.task}</span>
                        <span className="text-muted-foreground text-xs">{a.assignedTo}</span>
                        {a.dueDate && <span className="text-muted-foreground text-xs">{formatDate(a.dueDate)}</span>}
                        <button type="button" onClick={() => setActionItems((prev) => prev.filter((_, j) => j !== i))}>
                          <X className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium mb-1">Meeting Summary</label>
                <textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Brief summary of the meeting..."
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Meeting Minutes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Detail */}
      {activeTab === 'detail' && selectedMeeting && (
        <div className="max-w-3xl space-y-5">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedMeeting.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground">{formatDate(selectedMeeting.meetingDate)}</span>
                  {selectedMeeting.startTime && (
                    <span className="text-sm text-muted-foreground">
                      {selectedMeeting.startTime}{selectedMeeting.endTime ? ` – ${selectedMeeting.endTime}` : ''}
                    </span>
                  )}
                  {selectedMeeting.location && (
                    <span className="text-sm text-muted-foreground">{selectedMeeting.location}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[selectedMeeting.type] || TYPE_COLORS.OTHER}`}>
                  {selectedMeeting.type}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedMeeting.status] || ''}`}>
                  {selectedMeeting.status}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-5">
              {selectedMeeting.status === 'DRAFT' && (
                <button onClick={() => changeStatus(selectedMeeting.id, 'circulate')}
                  className="flex items-center gap-2 px-4 py-2 border border-yellow-400 text-yellow-700 rounded-md text-sm hover:bg-yellow-50">
                  <Send className="h-4 w-4" />
                  Circulate
                </button>
              )}
              {selectedMeeting.status === 'CIRCULATED' && (
                <button onClick={() => changeStatus(selectedMeeting.id, 'approve')}
                  className="flex items-center gap-2 px-4 py-2 border border-green-400 text-green-700 rounded-md text-sm hover:bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              )}
            </div>

            {/* Attendees */}
            {Array.isArray(selectedMeeting.attendees) && selectedMeeting.attendees.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2">Attendees ({selectedMeeting.attendees.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMeeting.attendees.map((a: Attendee, i: number) => (
                    <span key={i} className="px-2 py-1 bg-muted rounded-full text-xs">
                      {a.name}{a.role ? ` — ${a.role}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedMeeting.summary && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedMeeting.summary}</p>
              </div>
            )}
          </div>

          {/* Agenda */}
          {Array.isArray(selectedMeeting.agenda) && selectedMeeting.agenda.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-sm font-semibold mb-4">Agenda</h3>
              <div className="space-y-4">
                {selectedMeeting.agenda.map((item: AgendaItem, i: number) => (
                  <div key={i} className="border-l-2 border-primary pl-4">
                    <div className="font-medium text-sm">{i + 1}. {item.item}</div>
                    {item.discussion && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <span className="font-medium">Discussion: </span>{item.discussion}
                      </p>
                    )}
                    {item.decision && (
                      <p className="text-xs text-green-700 mt-1">
                        <span className="font-medium">Decision: </span>{item.decision}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {Array.isArray(selectedMeeting.actionItems) && selectedMeeting.actionItems.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-sm font-semibold mb-4">Action Items</h3>
              <div className="space-y-2">
                {selectedMeeting.actionItems.map((a: ActionItem, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      a.status === 'COMPLETED' ? 'bg-green-500' :
                      a.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <span className="flex-1">{a.task}</span>
                    <span className="text-muted-foreground text-xs">{a.assignedTo}</span>
                    {a.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(a.dueDate)}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${
                      a.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                      a.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

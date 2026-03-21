'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Video,
  Plus,
  X,
  ExternalLink,
  Play,
  Square,
  XCircle,
  Clock,
  Users,
  PlayCircle,
  Calendar,
  Radio,
} from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
}
function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-red-100 text-red-700 animate-pulse',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  SCHEDULED: <Calendar className="h-3 w-3" />,
  LIVE: <Radio className="h-3 w-3" />,
  COMPLETED: <PlayCircle className="h-3 w-3" />,
  CANCELLED: <XCircle className="h-3 w-3" />,
};

interface LiveClass {
  id: string;
  title: string;
  description?: string;
  classId: string;
  subjectId?: string;
  teacherId: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  recordingUrl?: string;
  status: string;
  maxParticipants?: number;
  attendeeCount: number;
  schoolId: string;
  _count?: { attendees: number };
}

function CountdownTimer({ scheduledAt }: { scheduledAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    function update() {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Starting now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    }
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [scheduledAt]);

  return <span className="font-mono text-xs text-orange-600">{timeLeft}</span>;
}

export default function LiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClass[]>([]);
  const [recordings, setRecordings] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'recordings'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const user = getUser();

  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    scheduledAt: '',
    duration: '60',
    meetingUrl: '',
    maxParticipants: '',
    notes: '',
  });

  const isTeacher = ['SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER'].includes(user?.role);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const schoolId = user?.schoolId || '';
      const [allRes, upRes, recRes] = await Promise.all([
        fetch(`${BASE}/live-classes`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${BASE}/live-classes/upcoming?schoolId=${schoolId}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${BASE}/live-classes/recordings?schoolId=${schoolId}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      if (allRes.ok) setLiveClasses(await allRes.json());
      if (upRes.ok) setUpcomingClasses(await upRes.json());
      if (recRes.ok) setRecordings(await recRes.json());
    } finally { setLoading(false); }
  }, [user?.schoolId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/live-classes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration: parseInt(form.duration),
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
          schoolId: user?.schoolId,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', description: '', classId: '', subjectId: '', scheduledAt: '', duration: '60', meetingUrl: '', maxParticipants: '', notes: '' });
        fetchAll();
      }
    } finally { setSaving(false); }
  }

  async function handleAction(id: string, action: 'start' | 'end' | 'cancel', recordingUrl?: string) {
    const body = action === 'end' && recordingUrl ? JSON.stringify({ recordingUrl }) : undefined;
    const res = await fetch(`${BASE}/live-classes/${id}/${action}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      ...(body && { body }),
    });
    if (res.ok) fetchAll();
  }

  const displayClasses = activeTab === 'upcoming' ? upcomingClasses
    : activeTab === 'recordings' ? recordings
    : liveClasses;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Live Classes</h1>
            <p className="text-sm text-muted-foreground">Schedule and manage live sessions</p>
          </div>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Schedule Class
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: liveClasses.length, color: 'blue' },
          { label: 'Upcoming', value: upcomingClasses.length, color: 'orange' },
          { label: 'Live Now', value: liveClasses.filter(c => c.status === 'LIVE').length, color: 'red' },
          { label: 'Recordings', value: recordings.length, color: 'green' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted/30 p-1 rounded-lg w-fit">
        {(['all', 'upcoming', 'recordings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
      ) : displayClasses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No classes here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayClasses.map(cls => (
            <div
              key={cls.id}
              className="bg-card border rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[cls.status]}`}>
                      {statusIcons[cls.status]}
                      {cls.status}
                    </span>
                    {cls.status === 'LIVE' && (
                      <span className="text-xs font-bold text-red-600 uppercase">● LIVE</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-base">{cls.title}</h3>
                  {cls.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{cls.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(cls.scheduledAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{cls.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{cls.attendeeCount} attended
                    </span>
                    {cls.status === 'SCHEDULED' && (
                      <span className="flex items-center gap-1 text-orange-600">
                        Starts in: <CountdownTimer scheduledAt={cls.scheduledAt} />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {cls.meetingUrl && (cls.status === 'SCHEDULED' || cls.status === 'LIVE') && (
                    <a
                      href={cls.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Join Meeting
                    </a>
                  )}
                  {cls.recordingUrl && cls.status === 'COMPLETED' && (
                    <a
                      href={cls.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium"
                    >
                      <PlayCircle className="h-3 w-3" />
                      Watch Recording
                    </a>
                  )}
                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      {cls.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleAction(cls.id, 'start')}
                          className="flex items-center gap-1 px-2 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                        >
                          <Play className="h-3 w-3" /> Start
                        </button>
                      )}
                      {cls.status === 'LIVE' && (
                        <button
                          onClick={() => {
                            const url = prompt('Recording URL (optional):') || undefined;
                            handleAction(cls.id, 'end', url);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200"
                        >
                          <Square className="h-3 w-3" /> End
                        </button>
                      )}
                      {(cls.status === 'SCHEDULED' || cls.status === 'LIVE') && (
                        <button
                          onClick={() => handleAction(cls.id, 'cancel')}
                          className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          <XCircle className="h-3 w-3" /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Schedule Live Class</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Math Chapter 5 Review"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Class ID *</label>
                  <input
                    required
                    value={form.classId}
                    onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Class ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject ID</label>
                  <input
                    value={form.subjectId}
                    onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Subject ID (optional)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meeting URL</label>
                <input
                  type="url"
                  value={form.meetingUrl}
                  onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxParticipants}
                  onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Additional notes for students"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Scheduling...' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Plus, X, Globe, EyeOff, Trash2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  audience: string;
  priority: string;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
  schoolId: string;
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border border-orange-200',
  NORMAL: 'bg-blue-100 text-blue-700 border border-blue-200',
  LOW: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const typeColors: Record<string, string> = {
  CIRCULAR: 'bg-indigo-100 text-indigo-700',
  NOTICE: 'bg-yellow-100 text-yellow-700',
  EVENT: 'bg-green-100 text-green-700',
  URGENT: 'bg-red-100 text-red-700',
  GENERAL: 'bg-gray-100 text-gray-700',
};

const audienceLabels: Record<string, string> = {
  ALL: 'Everyone',
  TEACHERS: 'Teachers',
  STUDENTS: 'Students',
  PARENTS: 'Parents',
  SPECIFIC_CLASS: 'Specific Class',
};

const EMPTY_FORM = {
  title: '',
  content: '',
  type: 'GENERAL',
  audience: 'ALL',
  priority: 'NORMAL',
  isPublished: false,
  expiresAt: '',
  schoolId: '',
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [tab, setTab] = useState<'published' | 'draft'>('published');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (audienceFilter) params.set('audience', audienceFilter);
      params.set('isPublished', String(tab === 'published'));
      const res = await fetch(`/api/v1/announcements?${params}`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setAnnouncements(Array.isArray(d) ? d : d.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, audienceFilter, tab]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Pre-fill schoolId from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setForm((f) => ({ ...f, schoolId: user.schoolId || '' }));
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showMsg('Title and content are required', 'error');
      return;
    }
    setActionLoading('create');
    try {
      const body = {
        ...form,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      const res = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showMsg('Announcement created successfully', 'success');
        setShowForm(false);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setForm({ ...EMPTY_FORM, schoolId: user.schoolId || '' });
        loadAnnouncements();
      } else {
        const d = await res.json();
        showMsg(d.message || 'Failed to create announcement', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const togglePublish = async (a: Announcement) => {
    setActionLoading(a.id);
    try {
      const endpoint = a.isPublished ? 'unpublish' : 'publish';
      const res = await fetch(`/api/v1/announcements/${a.id}/${endpoint}`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) {
        showMsg(a.isPublished ? 'Announcement unpublished' : 'Announcement published', 'success');
        loadAnnouncements();
      } else {
        showMsg('Action failed', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    setActionLoading(id + '_del');
    try {
      const res = await fetch(`/api/v1/announcements/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        showMsg('Announcement deleted', 'success');
        loadAnnouncements();
      } else {
        showMsg('Failed to delete', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Announcements & Circulars</h1>
            <p className="text-sm text-muted-foreground">School-wide notices, events, and communications</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* New Announcement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Announcement</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title..."
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write the announcement content here..."
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                  >
                    <option value="GENERAL">General</option>
                    <option value="CIRCULAR">Circular</option>
                    <option value="NOTICE">Notice</option>
                    <option value="EVENT">Event</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                  >
                    <option value="ALL">Everyone</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="SPECIFIC_CLASS">Specific Class</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Expires At (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublished" className="text-sm">
                  Publish immediately
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={actionLoading === 'create'}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create Announcement'}
              </button>
              <button
                onClick={() => { setShowForm(false); }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setTab('published')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'published'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setTab('draft')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'draft'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Drafts
          </button>
        </div>

        {/* Filters */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Types</option>
          <option value="GENERAL">General</option>
          <option value="CIRCULAR">Circular</option>
          <option value="NOTICE">Notice</option>
          <option value="EVENT">Event</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Audiences</option>
          <option value="ALL">Everyone</option>
          <option value="TEACHERS">Teachers</option>
          <option value="STUDENTS">Students</option>
          <option value="PARENTS">Parents</option>
        </select>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg">
          No {tab === 'published' ? 'published' : 'draft'} announcements found.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-card border rounded-lg p-5 space-y-3 ${
                a.priority === 'URGENT' ? 'border-red-300' : a.priority === 'HIGH' ? 'border-orange-300' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[a.priority]}`}
                    >
                      {a.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${typeColors[a.type] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {a.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      For: {audienceLabels[a.audience] ?? a.audience}
                    </span>
                    {a.expiresAt && (
                      <span className="text-xs text-muted-foreground">
                        Expires: {new Date(a.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-base">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{a.content}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(a)}
                    disabled={actionLoading === a.id}
                    title={a.isPublished ? 'Unpublish' : 'Publish'}
                    className={`p-1.5 rounded-md text-sm transition-colors ${
                      a.isPublished
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {a.isPublished ? (
                      <Globe className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={actionLoading === a.id + '_del'}
                    title="Delete"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                <span>Created {new Date(a.createdAt).toLocaleDateString()}</span>
                {a.publishedAt && (
                  <span>· Published {new Date(a.publishedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

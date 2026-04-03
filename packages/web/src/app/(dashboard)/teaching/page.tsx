'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Target,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  FileText,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Eye,
  BarChart2,
  ChevronRight,
  Timer,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────

interface ClassOption {
  id: string;
  name: string;
  sections?: { id: string; name: string }[];
}

interface ModuleItem {
  id: string;
  title: string;
  type: string;
  contentUrl?: string;
  description?: string;
  orderIndex: number;
  isRequired: boolean;
  estimatedMinutes?: number;
  covered: boolean;
  coverageLog?: {
    id: string;
    coveredAt: string;
    method?: string;
    duration?: number;
    notes?: string;
  } | null;
}

interface SessionModule {
  id: string;
  title: string;
  description?: string;
}

interface TeachingSession {
  id: string;
  moduleId: string;
  teacherId: string;
  classId: string;
  sectionId?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  daysToComplete: number;
  actualDays?: number;
  remarks?: string;
  module?: {
    id: string;
    title: string;
    description?: string;
    itemCount?: number;
    classId?: string;
    subjectId?: string;
  } | null;
  coveredCount: number;
  totalItems: number;
  items?: ModuleItem[];
}

interface DashboardStats {
  totalSessions: number;
  inProgressCount: number;
  completedCount: number;
  pausedCount: number;
  averageCompletionDays: number;
  totalItemsCovered: number;
  activeSessions: {
    id: string;
    moduleTitle: string;
    classId: string;
    sectionId?: string;
    totalItems: number;
    coveredItems: number;
    percentage: number;
    startedAt: string;
    daysToComplete: number;
  }[];
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  orderIndex: number;
  isPublished: boolean;
  daysToComplete: number;
  items: { id: string; title: string; type: string }[];
  completionStats?: { total: number; completed: number; percentage: number };
}

// ─── Constants ──────────────────────────────────────────────────────────

const METHODS = ['LECTURE', 'VIDEO', 'DEMO', 'ACTIVITY', 'DISCUSSION'];

const typeIcon: Record<string, any> = {
  CONTENT: BookOpen,
  ASSIGNMENT: FileText,
  QUIZ: HelpCircle,
  DISCUSSION: MessageSquare,
  VIDEO: Video,
  DOCUMENT: FileText,
  LINK: LinkIcon,
  PAGE: Eye,
  IMAGE: ImageIcon,
};

const typeColors: Record<string, string> = {
  CONTENT: 'bg-blue-100 text-blue-700',
  ASSIGNMENT: 'bg-orange-100 text-orange-700',
  QUIZ: 'bg-purple-100 text-purple-700',
  DISCUSSION: 'bg-green-100 text-green-700',
  VIDEO: 'bg-red-100 text-red-700',
  DOCUMENT: 'bg-gray-100 text-gray-700',
  LINK: 'bg-cyan-100 text-cyan-700',
  PAGE: 'bg-yellow-100 text-yellow-700',
  IMAGE: 'bg-pink-100 text-pink-700',
};

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
};

// ─── Component ──────────────────────────────────────────────────────────

export default function TeachingPage() {
  const base = process.env.NEXT_PUBLIC_API_URL;

  // View state
  const [view, setView] = useState<'dashboard' | 'session'>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Data state
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [sessionDetail, setSessionDetail] = useState<TeachingSession | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Start session modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [startModuleId, setStartModuleId] = useState('');
  const [startClassId, setStartClassId] = useState('');
  const [startSectionId, setStartSectionId] = useState('');

  // Cover item modal
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [coverItemId, setCoverItemId] = useState('');
  const [coverMethod, setCoverMethod] = useState('LECTURE');
  const [coverDuration, setCoverDuration] = useState('');
  const [coverNotes, setCoverNotes] = useState('');

  // Timer
  const [elapsed, setElapsed] = useState('');

  // Loading
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ─── Fetchers ──────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${base}/teaching/dashboard`, { headers });
      if (res.ok) setDashboard(await res.json());
    } catch {}
  }, [base]);

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClassId) params.set('classId', selectedClassId);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(
        `${base}/teaching/sessions?${params.toString()}`,
        { headers },
      );
      if (res.ok) setSessions(await res.json());
    } catch {}
  }, [base, selectedClassId, statusFilter]);

  const fetchSessionDetail = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${base}/teaching/sessions/${id}`, {
          headers,
        });
        if (res.ok) setSessionDetail(await res.json());
      } catch {}
    },
    [base],
  );

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch(`${base}/school-data/classes`, { headers });
      if (res.ok) {
        const data = await res.json();
        setClasses(
          Array.isArray(data)
            ? data
            : data.classes || data.data || [],
        );
      }
    } catch {}
  }, [base]);

  const fetchModules = useCallback(
    async (classId: string) => {
      if (!classId) {
        setModules([]);
        return;
      }
      try {
        // Fetch all subjects for the class, then modules for each
        const subRes = await fetch(
          `${base}/school-data/subjects?classId=${classId}`,
          { headers },
        );
        if (!subRes.ok) return;
        const subjects = await subRes.json();
        const subjectList = Array.isArray(subjects)
          ? subjects
          : subjects.subjects || subjects.data || [];

        const allModules: CourseModule[] = [];
        for (const sub of subjectList) {
          try {
            const mRes = await fetch(
              `${base}/course-modules?classId=${classId}&subjectId=${sub.id}`,
              { headers },
            );
            if (mRes.ok) {
              const mods = await mRes.json();
              allModules.push(
                ...(Array.isArray(mods) ? mods : mods.data || []),
              );
            }
          } catch {}
        }
        setModules(allModules);
      } catch {}
    },
    [base],
  );

  // ─── Init ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchSessions(), fetchClasses()]);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [selectedClassId, statusFilter]);

  // Timer for active session
  useEffect(() => {
    if (!sessionDetail || sessionDetail.status !== 'IN_PROGRESS') {
      setElapsed('');
      return;
    }
    function tick() {
      const start = new Date(sessionDetail!.startedAt).getTime();
      const diff = Date.now() - start;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (days > 0) {
        setElapsed(`${days}d ${hours}h ${mins}m`);
      } else {
        setElapsed(`${hours}h ${mins}m ${secs}s`);
      }
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionDetail]);

  // ─── Actions ───────────────────────────────────────────────────────

  async function startSession() {
    if (!startModuleId || !startClassId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${base}/teaching/sessions/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          moduleId: startModuleId,
          classId: startClassId,
          sectionId: startSectionId || undefined,
        }),
      });
      if (res.ok) {
        const session = await res.json();
        setShowStartModal(false);
        setStartModuleId('');
        setStartSectionId('');
        await fetchSessions();
        await fetchDashboard();
        openSession(session.id);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to start session');
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(false);
    }
  }

  async function completeSession(id: string) {
    if (!confirm('Mark this module as completed?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${base}/teaching/sessions/${id}/complete`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchSessionDetail(id);
        await fetchSessions();
        await fetchDashboard();
      }
    } catch {} finally {
      setActionLoading(false);
    }
  }

  async function pauseSession(id: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${base}/teaching/sessions/${id}/pause`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchSessionDetail(id);
        await fetchSessions();
        await fetchDashboard();
      }
    } catch {} finally {
      setActionLoading(false);
    }
  }

  async function resumeSession(id: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${base}/teaching/sessions/${id}/resume`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchSessionDetail(id);
        await fetchSessions();
        await fetchDashboard();
      }
    } catch {} finally {
      setActionLoading(false);
    }
  }

  async function coverItem() {
    if (!activeSessionId || !coverItemId) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${base}/teaching/sessions/${activeSessionId}/cover-item`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            moduleItemId: coverItemId,
            method: coverMethod,
            duration: coverDuration ? parseInt(coverDuration, 10) : undefined,
            notes: coverNotes || undefined,
          }),
        },
      );
      if (res.ok) {
        setShowCoverModal(false);
        setCoverItemId('');
        setCoverMethod('LECTURE');
        setCoverDuration('');
        setCoverNotes('');
        await fetchSessionDetail(activeSessionId);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to cover item');
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(false);
    }
  }

  function openSession(id: string) {
    setActiveSessionId(id);
    setView('session');
    fetchSessionDetail(id);
  }

  function backToDashboard() {
    setView('dashboard');
    setActiveSessionId(null);
    setSessionDetail(null);
    fetchSessions();
    fetchDashboard();
  }

  function openStartModal(moduleId?: string, classId?: string) {
    setStartModuleId(moduleId || '');
    setStartClassId(classId || selectedClassId || '');
    setStartSectionId('');
    setShowStartModal(true);
    if (classId || selectedClassId) {
      fetchModules(classId || selectedClassId);
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────

  function renderProgressBar(covered: number, total: number) {
    const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>
            {covered}/{total} items
          </span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // ─── Session Detail View ───────────────────────────────────────────

  if (view === 'session' && sessionDetail) {
    const sd = sessionDetail;
    const items = sd.items || [];
    const coveredCount = items.filter((i) => i.covered).length;
    const totalCount = items.length;
    const allCovered = totalCount > 0 && coveredCount === totalCount;

    return (
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={backToDashboard}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {sd.module?.title || 'Teaching Session'}
            </h1>
            {sd.module?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {sd.module.description}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[sd.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {sd.status.replace('_', ' ')}
          </span>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold">
              {totalCount > 0
                ? Math.round((coveredCount / totalCount) * 100)
                : 0}
              %
            </p>
            {renderProgressBar(coveredCount, totalCount)}
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Items Covered</p>
            <p className="text-2xl font-bold">
              {coveredCount}
              <span className="text-sm text-muted-foreground font-normal">
                /{totalCount}
              </span>
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Target Days</p>
            <p className="text-2xl font-bold">{sd.daysToComplete}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              {sd.status === 'COMPLETED' ? 'Actual Days' : 'Elapsed'}
            </p>
            {sd.status === 'COMPLETED' ? (
              <p className="text-2xl font-bold">{sd.actualDays ?? '-'}</p>
            ) : (
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                <p className="text-lg font-bold font-mono">
                  {elapsed || '--'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {sd.status !== 'COMPLETED' && (
          <div className="flex gap-2 mb-6">
            {sd.status === 'IN_PROGRESS' && (
              <>
                <button
                  onClick={() => pauseSession(sd.id)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" />
                  Pause Session
                </button>
                <button
                  onClick={() => completeSession(sd.id)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {allCovered ? 'Complete Module' : 'Complete Early'}
                </button>
              </>
            )}
            {sd.status === 'PAUSED' && (
              <button
                onClick={() => resumeSession(sd.id)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Resume Session
              </button>
            )}
          </div>
        )}

        {/* Items checklist */}
        <div className="bg-card border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Module Items</h2>
          </div>
          <div className="divide-y">
            {items.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No items in this module.
              </p>
            )}
            {items.map((item) => {
              const Icon = typeIcon[item.type] || FileText;
              const colorClass =
                typeColors[item.type] || 'bg-gray-100 text-gray-700';
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 ${
                    item.covered ? 'bg-green-50/50' : ''
                  }`}
                >
                  {/* Status icon */}
                  {item.covered ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}

                  {/* Type badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
                  >
                    <Icon className="h-3 w-3" />
                    {item.type}
                  </span>

                  {/* Title & info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        item.covered
                          ? 'text-green-700 line-through opacity-75'
                          : ''
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.covered && item.coverageLog && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Covered{' '}
                        {new Date(
                          item.coverageLog.coveredAt,
                        ).toLocaleString()}
                        {item.coverageLog.method &&
                          ` via ${item.coverageLog.method}`}
                        {item.coverageLog.duration &&
                          ` (${item.coverageLog.duration} min)`}
                      </p>
                    )}
                    {item.description && !item.covered && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Cover button */}
                  {!item.covered && sd.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        setCoverItemId(item.id);
                        setCoverMethod('LECTURE');
                        setCoverDuration(
                          item.estimatedMinutes
                            ? String(item.estimatedMinutes)
                            : '',
                        );
                        setCoverNotes('');
                        setShowCoverModal(true);
                      }}
                      className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:opacity-90 transition-opacity"
                    >
                      Mark Covered
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cover Item Modal */}
        {showCoverModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Mark Item as Covered
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Teaching Method
                  </label>
                  <select
                    value={coverMethod}
                    onChange={(e) => setCoverMethod(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={coverDuration}
                    onChange={(e) => setCoverDuration(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={coverNotes}
                    onChange={(e) => setCoverNotes(e.target.value)}
                    rows={3}
                    placeholder="Any observations or notes..."
                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCoverModal(false)}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={coverItem}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Dashboard View ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Teaching Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your teaching progress across course modules
          </p>
        </div>
        <button
          onClick={() => openStartModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm"
        >
          <Play className="h-4 w-4" />
          Start Teaching
        </button>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{dashboard.totalSessions}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {dashboard.inProgressCount}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {dashboard.completedCount}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Paused</p>
            <p className="text-2xl font-bold text-yellow-600">
              {dashboard.pausedCount}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Avg. Days</p>
            <p className="text-2xl font-bold">
              {dashboard.averageCompletionDays}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Items Covered</p>
            <p className="text-2xl font-bold">{dashboard.totalItemsCovered}</p>
          </div>
        </div>
      )}

      {/* Active Sessions Highlight */}
      {dashboard &&
        dashboard.activeSessions &&
        dashboard.activeSessions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Active Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.activeSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className="bg-card border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate flex-1">
                      {s.moduleTitle}
                    </h3>
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium shrink-0">
                      IN PROGRESS
                    </span>
                  </div>
                  {renderProgressBar(s.coveredItems, s.totalItems)}
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>
                      Target: {s.daysToComplete} days
                    </span>
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      Continue
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="PAUSED">Paused</option>
        </select>
      </div>

      {/* Sessions List */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">All Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No teaching sessions found. Start teaching a module to begin
              tracking.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {sessions.map((s) => {
              const pct =
                s.totalItems > 0
                  ? Math.round((s.coveredCount / s.totalItems) * 100)
                  : 0;
              return (
                <div
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  {/* Status icon */}
                  {s.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : s.status === 'PAUSED' ? (
                    <Pause className="h-5 w-5 text-yellow-600 shrink-0" />
                  ) : (
                    <Play className="h-5 w-5 text-blue-600 shrink-0" />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.module?.title || 'Module'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started{' '}
                      {new Date(s.startedAt).toLocaleDateString()}
                      {s.completedAt &&
                        ` - Completed ${new Date(
                          s.completedAt,
                        ).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="w-32 shrink-0 hidden md:block">
                    {renderProgressBar(s.coveredCount, s.totalItems)}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                      statusColors[s.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {s.status.replace('_', ' ')}
                  </span>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Start Teaching Session
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">
                  Class
                </label>
                <select
                  value={startClassId}
                  onChange={(e) => {
                    setStartClassId(e.target.value);
                    setStartModuleId('');
                    setStartSectionId('');
                    fetchModules(e.target.value);
                  }}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {startClassId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Section (optional)
                  </label>
                  <select
                    value={startSectionId}
                    onChange={(e) => setStartSectionId(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All sections</option>
                    {classes
                      .find((c) => c.id === startClassId)
                      ?.sections?.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {startClassId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Course Module
                  </label>
                  {modules.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No modules found for this class. Create modules in the
                      Course Modules page first.
                    </p>
                  ) : (
                    <select
                      value={startModuleId}
                      onChange={(e) => setStartModuleId(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select module...</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.items?.length || 0} items, {m.daysToComplete} days)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowStartModal(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={startSession}
                disabled={!startModuleId || !startClassId || actionLoading}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Teaching
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

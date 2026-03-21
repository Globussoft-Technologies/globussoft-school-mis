'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, PlayCircle, RefreshCw, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

const base = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

interface Session {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Transition {
  id: string;
  fromSessionId: string;
  toSessionId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  studentsPromoted: number;
  studentsRetained: number;
  sectionsCreated: number;
  errors: Array<{ studentId: string; error: string }>;
  schoolId: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Pending',
      class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: <Clock className="h-3 w-3" />,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <RefreshCw className="h-3 w-3 animate-spin" />,
    },
    COMPLETED: {
      label: 'Completed',
      class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircle className="h-3 w-3" />,
    },
    ROLLED_BACK: {
      label: 'Rolled Back',
      class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const cfg = map[status] ?? { label: status, class: 'bg-muted text-muted-foreground', icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.class}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function AcademicTransitionPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New session form
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionStart, setNewSessionStart] = useState('');
  const [newSessionEnd, setNewSessionEnd] = useState('');

  // Transition form
  const [showInitiate, setShowInitiate] = useState(false);
  const [fromSessionId, setFromSessionId] = useState('');
  const [toSessionId, setToSessionId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sess, trans] = await Promise.all([
        apiFetch('/academic-sessions'),
        apiFetch('/academic-transition'),
      ]);
      setSessions(sess);
      setTransitions(trans);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function showMsg(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function createSession() {
    if (!newSessionName.trim() || !newSessionStart || !newSessionEnd) {
      setError('All session fields are required');
      return;
    }
    setActionLoading('new-session');
    setError('');
    try {
      await apiFetch('/academic-transition/new-session', {
        method: 'POST',
        body: JSON.stringify({ name: newSessionName.trim(), startDate: newSessionStart, endDate: newSessionEnd }),
      });
      setShowNewSession(false);
      setNewSessionName('');
      setNewSessionStart('');
      setNewSessionEnd('');
      showMsg('New academic session created successfully');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading('');
    }
  }

  async function initiateTransition() {
    if (!fromSessionId || !toSessionId) {
      setError('Please select both sessions');
      return;
    }
    if (fromSessionId === toSessionId) {
      setError('Source and target sessions must be different');
      return;
    }
    setActionLoading('initiate');
    setError('');
    try {
      await apiFetch('/academic-transition/initiate', {
        method: 'POST',
        body: JSON.stringify({ fromSessionId, toSessionId }),
      });
      setShowInitiate(false);
      setFromSessionId('');
      setToSessionId('');
      showMsg('Transition initiated successfully. Click Execute to run the transition.');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading('');
    }
  }

  async function executeTransition(id: string) {
    if (!confirm('Execute this transition? This will move students to the new academic session. This action cannot be easily undone.')) return;
    setActionLoading(`execute-${id}`);
    setError('');
    try {
      const result = await apiFetch(`/academic-transition/${id}/execute`, { method: 'POST' });
      showMsg(
        `Transition completed! Promoted: ${result.summary?.studentsPromoted ?? 0}, Retained: ${result.summary?.studentsRetained ?? 0}, Sections created: ${result.summary?.sectionsCreated ?? 0}`,
      );
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading('');
    }
  }

  const activeSession = sessions.find((s) => s.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Academic Year Transition</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage end-of-year student promotion and session transitions</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm p-3 rounded-md">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Current Session Info */}
      <div className="border rounded-lg p-5 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Current Academic Session</h2>
          <button
            onClick={() => { setShowNewSession((v) => !v); setError(''); }}
            className="flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            New Session
          </button>
        </div>

        {activeSession ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Session Name</div>
              <div className="font-semibold">{activeSession.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <StatusBadge status={activeSession.status} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Start Date</div>
              <div className="font-medium text-sm">{new Date(activeSession.startDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">End Date</div>
              <div className="font-medium text-sm">{new Date(activeSession.endDate).toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active session found.</p>
        )}

        {/* All sessions */}
        {sessions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">All Sessions</div>
            <div className="space-y-1">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm py-1">
                  <StatusBadge status={s.status} />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(s.startDate).toLocaleDateString()} — {new Date(s.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Session Form */}
        {showNewSession && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <h3 className="text-sm font-semibold">Create New Academic Session</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Session Name</label>
                <input
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. 2027-28"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={newSessionStart}
                  onChange={(e) => setNewSessionStart(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={newSessionEnd}
                  onChange={(e) => setNewSessionEnd(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createSession}
                disabled={actionLoading === 'new-session'}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-60"
              >
                {actionLoading === 'new-session' ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Session
              </button>
              <button
                onClick={() => setShowNewSession(false)}
                className="px-4 py-2 border rounded-md text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Initiate Transition */}
      <div className="border rounded-lg p-5 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Initiate Year Transition</h2>
          <button
            onClick={() => { setShowInitiate((v) => !v); setError(''); }}
            className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Initiate Transition
          </button>
        </div>

        {showInitiate && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select the source (current) session and target (new) session for the transition. Students will be moved from the source to the target session when executed.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">From Session (Current)</label>
                <select
                  value={fromSessionId}
                  onChange={(e) => setFromSessionId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select session...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">To Session (New)</label>
                <select
                  value={toSessionId}
                  onChange={(e) => setToSessionId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select session...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={initiateTransition}
                disabled={actionLoading === 'initiate'}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-60"
              >
                {actionLoading === 'initiate' ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Initiate
              </button>
              <button
                onClick={() => setShowInitiate(false)}
                className="px-4 py-2 border rounded-md text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transitions List */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm flex items-center justify-between">
          <span>Transition History</span>
          <button
            onClick={loadData}
            className="text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading transitions...</div>
        ) : transitions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No transitions found.</div>
        ) : (
          <div className="divide-y">
            {transitions.map((t) => {
              const fromSess = sessions.find((s) => s.id === t.fromSessionId);
              const toSess = sessions.find((s) => s.id === t.toSessionId);
              const isExecuting = actionLoading === `execute-${t.id}`;
              const errors = Array.isArray(t.errors) ? t.errors : [];

              return (
                <div key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-sm">
                          {fromSess?.name ?? t.fromSessionId.slice(0, 8)} → {toSess?.name ?? t.toSessionId.slice(0, 8)}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>

                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Started</span>
                          <div>{new Date(t.startedAt).toLocaleDateString()}</div>
                        </div>
                        {t.completedAt && (
                          <div>
                            <span className="text-muted-foreground text-xs">Completed</span>
                            <div>{new Date(t.completedAt).toLocaleDateString()}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground text-xs">Promoted</span>
                          <div className="font-semibold text-green-600">{t.studentsPromoted}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Retained</span>
                          <div className="font-semibold text-amber-600">{t.studentsRetained}</div>
                        </div>
                        {t.sectionsCreated > 0 && (
                          <div>
                            <span className="text-muted-foreground text-xs">Sections Created</span>
                            <div>{t.sectionsCreated}</div>
                          </div>
                        )}
                        {errors.length > 0 && (
                          <div>
                            <span className="text-muted-foreground text-xs">Errors</span>
                            <div className="font-semibold text-red-500">{errors.length}</div>
                          </div>
                        )}
                      </div>

                      {/* Error list */}
                      {errors.length > 0 && (
                        <div className="mt-2 p-3 bg-destructive/10 rounded-md">
                          <div className="text-xs font-medium text-destructive mb-1">Errors ({errors.length}):</div>
                          <ul className="space-y-0.5">
                            {errors.slice(0, 5).map((err: any, i: number) => (
                              <li key={i} className="text-xs text-destructive">
                                Student {err.studentId?.slice(0, 8)}...: {err.error}
                              </li>
                            ))}
                            {errors.length > 5 && (
                              <li className="text-xs text-destructive">...and {errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {t.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => executeTransition(t.id)}
                        disabled={isExecuting}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-60 whitespace-nowrap flex-shrink-0"
                      >
                        {isExecuting ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-3.5 w-3.5" />
                            Execute
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

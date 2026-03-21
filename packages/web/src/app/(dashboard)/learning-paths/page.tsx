'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Route,
  Plus,
  ChevronRight,
  ChevronLeft,
  Clock,
  Users,
  CheckCircle,
  Circle,
  Lock,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Activity,
  Edit3,
  Trash2,
  Globe,
  X,
} from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
}

function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

const difficultyColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-red-100 text-red-700',
};

const stepTypeIcons: Record<string, React.ReactNode> = {
  CONTENT: <FileText className="h-4 w-4" />,
  QUIZ: <HelpCircle className="h-4 w-4" />,
  ASSIGNMENT: <Edit3 className="h-4 w-4" />,
  VIDEO: <Video className="h-4 w-4" />,
  READING: <BookOpen className="h-4 w-4" />,
  ACTIVITY: <Activity className="h-4 w-4" />,
};

interface Step {
  id?: string;
  title: string;
  type: string;
  resourceUrl?: string;
  description?: string;
  orderIndex: number;
  isOptional?: boolean;
  estimatedMinutes?: number;
}

interface LearningPath {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  estimatedHours?: number;
  isPublished: boolean;
  steps: Step[];
  enrollment?: {
    currentStep: number;
    completedSteps: number;
    totalSteps: number;
    status: string;
  } | null;
  _count?: { enrollments: number; steps: number };
}

const STEP_TYPES = ['CONTENT', 'QUIZ', 'ASSIGNMENT', 'VIDEO', 'READING', 'ACTIVITY'];

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const user = getUser();

  // Create form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    estimatedHours: '',
    classId: '',
    subjectId: '',
  });
  const [formSteps, setFormSteps] = useState<Step[]>([
    { title: '', type: 'CONTENT', orderIndex: 0 },
  ]);

  const fetchPaths = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/learning-paths`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setPaths(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPaths(); }, [fetchPaths]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/learning-paths`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
          steps: formSteps.map((s, i) => ({ ...s, orderIndex: i })),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', description: '', difficulty: 'MEDIUM', estimatedHours: '', classId: '', subjectId: '' });
        setFormSteps([{ title: '', type: 'CONTENT', orderIndex: 0 }]);
        fetchPaths();
      }
    } finally { setSaving(false); }
  }

  async function handleEnroll(pathId: string, studentId: string) {
    const res = await fetch(`${BASE}/learning-paths/${pathId}/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });
    if (res.ok) fetchPaths();
  }

  async function handlePublish(pathId: string, current: boolean) {
    await fetch(`${BASE}/learning-paths/${pathId}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    });
    fetchPaths();
  }

  function addStep() {
    setFormSteps(s => [...s, { title: '', type: 'CONTENT', orderIndex: s.length }]);
  }

  function removeStep(idx: number) {
    setFormSteps(s => s.filter((_, i) => i !== idx));
  }

  function updateStep(idx: number, field: string, value: string | boolean | number) {
    setFormSteps(s => s.map((step, i) => i === idx ? { ...step, [field]: value } : step));
  }

  if (selectedPath) {
    const enrollment = selectedPath.enrollment;
    const steps = selectedPath.steps || [];
    const completedSteps = enrollment?.completedSteps ?? 0;
    const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

    return (
      <div>
        <button
          onClick={() => setSelectedPath(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Learning Paths
        </button>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Path info */}
          <div className="col-span-2 space-y-6">
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[selectedPath.difficulty]}`}>
                      {selectedPath.difficulty}
                    </span>
                    {selectedPath.isPublished
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Published</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Draft</span>
                    }
                  </div>
                  <h1 className="text-2xl font-bold">{selectedPath.title}</h1>
                  {selectedPath.description && (
                    <p className="text-muted-foreground mt-1">{selectedPath.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {selectedPath.estimatedHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />{selectedPath.estimatedHours}h
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />{selectedPath._count?.enrollments ?? 0} enrolled
                  </span>
                </div>
              </div>

              {enrollment && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedSteps} of {steps.length} steps completed
                  </p>
                </div>
              )}

              {!enrollment && (
                <button
                  onClick={() => handleEnroll(selectedPath.id, user?.studentId || user?.id)}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Enroll in this Path
                </button>
              )}
            </div>

            {/* Steps */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-semibold mb-4">Learning Steps ({steps.length})</h2>
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const isCompleted = idx < completedSteps;
                  const isCurrent = idx === completedSteps;
                  const isLocked = idx > completedSteps && !!enrollment;

                  return (
                    <div
                      key={step.id || idx}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isCompleted ? 'bg-green-50 border-green-200' :
                        isCurrent ? 'bg-blue-50 border-blue-200' :
                        isLocked ? 'opacity-50 border-dashed' : 'border'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isCurrent ? (
                          <Circle className="h-5 w-5 text-blue-600 fill-blue-100" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{stepTypeIcons[step.type]}</span>
                          <span className="font-medium text-sm">{step.title}</span>
                          {step.isOptional && (
                            <span className="text-xs text-muted-foreground">(optional)</span>
                          )}
                        </div>
                        {step.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                        )}
                        {step.estimatedMinutes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ~{step.estimatedMinutes} min
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                          {step.type}
                        </span>
                        {isCurrent && enrollment && step.resourceUrl && (
                          <a
                            href={step.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
                          >
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold mb-3">Path Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Steps</dt>
                  <dd className="font-medium">{steps.length}</dd>
                </div>
                {selectedPath.estimatedHours && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="font-medium">{selectedPath.estimatedHours}h</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Difficulty</dt>
                  <dd className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[selectedPath.difficulty]}`}>
                    {selectedPath.difficulty}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Enrolled</dt>
                  <dd className="font-medium">{selectedPath._count?.enrollments ?? 0}</dd>
                </div>
              </dl>
            </div>

            {['SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
              <button
                onClick={() => handlePublish(selectedPath.id, selectedPath.isPublished)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedPath.isPublished
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Globe className="h-4 w-4" />
                {selectedPath.isPublished ? 'Unpublish' : 'Publish Path'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Route className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Learning Paths</h1>
            <p className="text-sm text-muted-foreground">Structured learning journeys for students</p>
          </div>
        </div>
        {['SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Create Path
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
      ) : paths.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Route className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No learning paths yet</p>
          <p className="text-sm">Create structured learning journeys for your students</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map(path => (
            <div
              key={path.id}
              className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPath(path)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[path.difficulty]}`}>
                  {path.difficulty}
                </span>
                {path.isPublished
                  ? <span className="text-xs text-green-600 font-medium">Published</span>
                  : <span className="text-xs text-muted-foreground">Draft</span>
                }
              </div>
              <h3 className="font-semibold mb-1 line-clamp-2">{path.title}</h3>
              {path.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{path.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
                <span className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  {path._count?.steps ?? path.steps?.length ?? 0} steps
                </span>
                {path.estimatedHours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{path.estimatedHours}h
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />{path._count?.enrollments ?? 0}
                </span>
              </div>
              {path.enrollment && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span>
                      {path.enrollment.completedSteps}/{path.enrollment.totalSteps}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${path.enrollment.totalSteps > 0
                          ? (path.enrollment.completedSteps / path.enrollment.totalSteps) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Path Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Learning Path</h2>
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
                  placeholder="e.g., Algebra Fundamentals"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Brief overview of this learning path"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimatedHours}
                    onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              {/* Steps Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Steps</label>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-xs text-primary flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {formSteps.map((step, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-6">{idx + 1}.</span>
                        <input
                          required
                          value={step.title}
                          onChange={e => updateStep(idx, 'title', e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          placeholder="Step title"
                        />
                        <select
                          value={step.type}
                          onChange={e => updateStep(idx, 'type', e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {formSteps.length > 1 && (
                          <button type="button" onClick={() => removeStep(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 ml-6">
                        <input
                          value={step.resourceUrl || ''}
                          onChange={e => updateStep(idx, 'resourceUrl', e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                          placeholder="Resource URL (optional)"
                        />
                        <input
                          type="number"
                          value={step.estimatedMinutes || ''}
                          onChange={e => updateStep(idx, 'estimatedMinutes', parseInt(e.target.value))}
                          className="border rounded px-2 py-1 text-xs"
                          placeholder="Minutes"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Path'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

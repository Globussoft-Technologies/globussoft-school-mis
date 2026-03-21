'use client';

import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  X,
  BarChart2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'RATING' | 'TEXT' | 'MULTIPLE_CHOICE' | 'YES_NO';
  options?: string[];
  orderIndex: number;
  isRequired: boolean;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  targetAudience: string;
  createdAt: string;
  questions: SurveyQuestion[];
  _count?: { responses: number };
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  type: string;
  avgRating?: number;
  responseCount: number;
  distribution?: Record<string, number>;
  textAnswers?: string[];
}

interface SurveyResults {
  surveyId: string;
  title: string;
  status: string;
  totalResponses: number;
  questions: QuestionResult[];
}

// ─── Helpers ──────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const TYPE_COLORS: Record<string, string> = {
  PARENT_SATISFACTION: 'bg-blue-100 text-blue-700',
  TEACHER_EVALUATION: 'bg-purple-100 text-purple-700',
  FACILITY_REVIEW: 'bg-orange-100 text-orange-700',
  EVENT_FEEDBACK: 'bg-pink-100 text-pink-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Results View ─────────────────────────────────────────────────

function ResultsView({ surveyId, onClose }: { surveyId: string; onClose: () => void }) {
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/surveys/${surveyId}/results`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setResults)
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 text-muted-foreground flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading results...
      </div>
    </div>
  );

  if (!results) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">{results.title} — Results</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {results.totalResponses} total response{results.totalResponses !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {results.questions.map((q, idx) => (
            <div key={q.questionId} className="border rounded-lg p-4">
              <p className="font-medium text-sm mb-1 text-muted-foreground">Q{idx + 1}</p>
              <p className="font-semibold mb-3">{q.questionText}</p>

              {q.type === 'RATING' && (
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-3xl font-bold text-blue-600">{q.avgRating?.toFixed(1)}</span>
                    <span className="text-muted-foreground">/ 5.0 · {q.responseCount} responses</span>
                  </div>
                  {q.distribution && (
                    <div className="space-y-1.5">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = q.distribution![String(rating)] || 0;
                        const pct = q.responseCount > 0 ? (count / q.responseCount) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2 text-sm">
                            <span className="w-8 text-right text-muted-foreground">{rating}★</span>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {q.type === 'MULTIPLE_CHOICE' && q.distribution && (
                <div className="space-y-1.5">
                  {Object.entries(q.distribution).map(([option, count]) => {
                    const pct = q.responseCount > 0 ? (count / q.responseCount) * 100 : 0;
                    return (
                      <div key={option} className="flex items-center gap-2 text-sm">
                        <span className="w-36 truncate text-muted-foreground">{option}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-muted-foreground">{count} ({Math.round(pct)}%)</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'YES_NO' && q.distribution && (
                <div className="flex gap-6">
                  {Object.entries(q.distribution).map(([answer, count]) => (
                    <div key={answer} className="flex items-center gap-2 text-sm">
                      {answer === 'YES'
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="font-medium">{answer}</span>
                      <span className="text-muted-foreground">— {count}</span>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'TEXT' && q.textAnswers && (
                <div className="space-y-2">
                  {q.textAnswers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No text responses yet.</p>
                  ) : (
                    q.textAnswers.map((ans, i) => (
                      <div key={i} className="bg-gray-50 rounded-md px-3 py-2 text-sm">
                        &quot;{ans}&quot;
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Create Survey Form ───────────────────────────────────────────

interface QuestionDraft {
  text: string;
  type: 'RATING' | 'TEXT' | 'MULTIPLE_CHOICE' | 'YES_NO';
  options: string[];
  isRequired: boolean;
}

function CreateSurveyForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PARENT_SATISFACTION');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { text: '', type: 'RATING', options: [], isRequired: true },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { text: '', type: 'RATING', options: [], isRequired: true },
    ]);
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, field: keyof QuestionDraft, value: any) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function addOption(idx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, options: [...q.options, ''] } : q)),
    );
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, oi) => (oi === optIdx ? value : o)) }
          : q,
      ),
    );
  }

  function removeOption(qIdx: number, optIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.filter((_, oi) => oi !== optIdx) } : q,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = {
      title,
      description: description || undefined,
      type,
      targetAudience,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      schoolId: user.schoolId || '',
      questions: questions.map((q, idx) => ({
        text: q.text,
        type: q.type,
        options: q.type === 'MULTIPLE_CHOICE' ? q.options.filter(Boolean) : undefined,
        orderIndex: idx + 1,
        isRequired: q.isRequired,
      })),
    };

    try {
      const res = await fetch(`${API}/surveys`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create survey');
      }
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Create Survey</h2>
          <button onClick={onCancel} className="p-2 rounded-md hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Parent Satisfaction Survey 2026"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Brief description of this survey"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PARENT_SATISFACTION">Parent Satisfaction</option>
                <option value="TEACHER_EVALUATION">Teacher Evaluation</option>
                <option value="FACILITY_REVIEW">Facility Review</option>
                <option value="EVENT_FEEDBACK">Event Feedback</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All</option>
                <option value="PARENTS">Parents</option>
                <option value="TEACHERS">Teachers</option>
                <option value="STUDENTS">Students</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Question Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" /> Add Question
              </button>
            </div>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-muted-foreground mt-1">Q{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      <input
                        required
                        value={q.text}
                        onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Question text"
                      />
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={q.type}
                          onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                          className="border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="RATING">Rating (1-5)</option>
                          <option value="TEXT">Text Answer</option>
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="YES_NO">Yes / No</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={q.isRequired}
                            onChange={(e) => updateQuestion(idx, 'isRequired', e.target.checked)}
                          />
                          Required
                        </label>
                      </div>

                      {q.type === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">Options:</p>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                required
                                value={opt}
                                onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                className="flex-1 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(idx, optIdx)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(idx)}
                            className="text-xs text-primary hover:underline"
                          >
                            + Add option
                          </button>
                        </div>
                      )}
                    </div>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-red-400 hover:text-red-600 mt-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Survey
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md text-sm border hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Survey Card ──────────────────────────────────────────────────

function SurveyCard({
  survey,
  onActivate,
  onClose,
  onViewResults,
}: {
  survey: Survey;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onViewResults: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const responseCount = survey._count?.responses ?? 0;

  return (
    <div className="bg-card rounded-lg border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge text={survey.type} colorClass={TYPE_COLORS[survey.type] || 'bg-gray-100 text-gray-700'} />
            <Badge text={survey.status} colorClass={STATUS_COLORS[survey.status] || 'bg-gray-100 text-gray-700'} />
            <Badge text={survey.targetAudience} colorClass="bg-indigo-50 text-indigo-700" />
          </div>
          <h3 className="font-semibold text-base">{survey.title}</h3>
          {survey.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{survey.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
            <span>{survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}</span>
            <span>{responseCount} response{responseCount !== 1 ? 's' : ''}</span>
            {survey.startDate && (
              <span>
                {new Date(survey.startDate).toLocaleDateString()} –{' '}
                {survey.endDate ? new Date(survey.endDate).toLocaleDateString() : 'ongoing'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {survey.status === 'DRAFT' && (
            <button
              onClick={() => onActivate(survey.id)}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Activate
            </button>
          )}
          {survey.status === 'ACTIVE' && (
            <button
              onClick={() => onClose(survey.id)}
              className="flex items-center gap-1.5 bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-700"
            >
              <XCircle className="h-3.5 w-3.5" /> Close
            </button>
          )}
          <button
            onClick={() => onViewResults(survey.id)}
            className="flex items-center gap-1.5 text-primary border border-primary/30 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/5"
          >
            <BarChart2 className="h-3.5 w-3.5" /> Results
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {expanded && survey.questions.length > 0 && (
        <div className="mt-4 border-t pt-4 space-y-2">
          {survey.questions.map((q, idx) => (
            <div key={q.id} className="text-sm flex gap-2">
              <span className="text-muted-foreground font-medium w-6 shrink-0">Q{idx + 1}</span>
              <div>
                <span>{q.text}</span>
                <span className="ml-2 text-xs text-muted-foreground">[{q.type}]</span>
                {q.type === 'MULTIPLE_CHOICE' && q.options && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Options: {q.options.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  async function fetchSurveys() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`${API}/surveys?${params}`, { headers: authHeaders() });
      if (res.ok) setSurveys(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSurveys(); }, [filterStatus, filterType]);

  async function handleActivate(id: string) {
    await fetch(`${API}/surveys/${id}/activate`, { method: 'PATCH', headers: authHeaders() });
    fetchSurveys();
  }

  async function handleClose(id: string) {
    await fetch(`${API}/surveys/${id}/close`, { method: 'PATCH', headers: authHeaders() });
    fetchSurveys();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Surveys</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Create Survey
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="PARENT_SATISFACTION">Parent Satisfaction</option>
          <option value="TEACHER_EVALUATION">Teacher Evaluation</option>
          <option value="FACILITY_REVIEW">Facility Review</option>
          <option value="EVENT_FEEDBACK">Event Feedback</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading surveys...
        </div>
      ) : surveys.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No surveys found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((s) => (
            <SurveyCard
              key={s.id}
              survey={s}
              onActivate={handleActivate}
              onClose={handleClose}
              onViewResults={setResultsId}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateSurveyForm
          onCreated={() => { setShowCreate(false); fetchSurveys(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}
      {resultsId && (
        <ResultsView surveyId={resultsId} onClose={() => setResultsId(null)} />
      )}
    </div>
  );
}

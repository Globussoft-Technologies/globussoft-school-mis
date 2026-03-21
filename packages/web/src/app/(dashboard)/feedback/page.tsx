'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Star, Eye, EyeOff, X, Filter } from 'lucide-react';

interface Feedback {
  id: string;
  type: string;
  fromUserId: string | null;
  toUserId: string | null;
  subjectId: string | null;
  classId: string | null;
  rating: number;
  comment: string | null;
  isAnonymous: boolean;
  academicSessionId: string | null;
  createdAt: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface TeacherRating {
  teacher: { id: string; firstName: string; lastName: string } | null;
  count: number;
  avgRating: number;
  distribution: Record<number, number>;
}

const FEEDBACK_TYPES = [
  { value: 'TEACHER_FEEDBACK', label: 'Teacher Feedback' },
  { value: 'STUDENT_FEEDBACK', label: 'Student Feedback' },
  { value: 'PARENT_FEEDBACK', label: 'Parent Feedback' },
  { value: 'COURSE_FEEDBACK', label: 'Course Feedback' },
];

const TYPE_COLORS: Record<string, string> = {
  TEACHER_FEEDBACK: 'bg-blue-100 text-blue-700',
  STUDENT_FEEDBACK: 'bg-green-100 text-green-700',
  PARENT_FEEDBACK: 'bg-purple-100 text-purple-700',
  COURSE_FEEDBACK: 'bg-orange-100 text-orange-700',
};

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            className={`h-5 w-5 ${
              (hover || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<TeacherRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'TEACHER_FEEDBACK',
    toUserId: '',
    subjectId: '',
    rating: 0,
    comment: '',
    isAnonymous: false,
  });

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  }

  async function loadFeedbacks() {
    setLoading(true);
    try {
      const params = typeFilter ? `?type=${typeFilter}` : '';
      const res = await fetch(`${base}/feedback${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setFeedbacks(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  async function loadTeachers() {
    try {
      const res = await fetch(`${base}/users?role=SUBJECT_TEACHER`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(Array.isArray(data) ? data : data.data || []);
      }
    } catch {}
  }

  async function loadSubjects() {
    try {
      const res = await fetch(`${base}/subjects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  async function loadTeacherRatings() {
    try {
      const res = await fetch(`${base}/feedback/summary`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      // Also fetch individual teacher ratings
      if (res.ok) {
        // Summary loaded separately; load per-teacher ratings
      }
      // Load ratings for each teacher
      const ratings: TeacherRating[] = [];
      for (const teacher of teachers.slice(0, 5)) {
        const r = await fetch(`${base}/feedback/teacher/${teacher.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (r.ok) ratings.push(await r.json());
      }
      setTeacherRatings(ratings.filter((r) => r.count > 0));
    } catch {}
  }

  useEffect(() => {
    loadFeedbacks();
  }, [typeFilter]);

  useEffect(() => {
    loadTeachers();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (teachers.length > 0) loadTeacherRatings();
  }, [teachers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.rating === 0) {
      setError('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      const body: any = {
        type: form.type,
        rating: form.rating,
        comment: form.comment || undefined,
        isAnonymous: form.isAnonymous,
      };
      if (form.toUserId) body.toUserId = form.toUserId;
      if (form.subjectId) body.subjectId = form.subjectId;

      const res = await fetch(`${base}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setShowForm(false);
      setForm({ type: 'TEACHER_FEEDBACK', toUserId: '', subjectId: '', rating: 0, comment: '', isAnonymous: false });
      loadFeedbacks();
    } catch {
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Feedback</h1>
            <p className="text-muted-foreground text-sm">Collect and view feedback from students, parents, and teachers</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
        >
          Submit Feedback
        </button>
      </div>

      {/* Teacher Ratings Summary Cards */}
      {teacherRatings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Teacher Ratings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherRatings.map((tr) => (
              <div key={tr.teacher?.id} className="bg-card border rounded-lg p-4">
                <div className="font-medium">
                  {tr.teacher ? `${tr.teacher.firstName} ${tr.teacher.lastName}` : 'Unknown'}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <StarRating value={Math.round(tr.avgRating)} readonly />
                  <span className="text-sm font-semibold">{tr.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({tr.count} reviews)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Types</option>
          {FEEDBACK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{feedbacks.length} records</span>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading feedback...</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No feedback found.</div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        TYPE_COLORS[fb.type] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {FEEDBACK_TYPES.find((t) => t.value === fb.type)?.label || fb.type}
                    </span>
                    {fb.isAnonymous && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Anonymous
                      </span>
                    )}
                  </div>
                  <StarRating value={fb.rating} readonly />
                  {fb.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{fb.comment}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(fb.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Feedback Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Submit Feedback</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Feedback Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {FEEDBACK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {form.type === 'TEACHER_FEEDBACK' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher</label>
                  <select
                    value={form.toUserId}
                    onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.type === 'COURSE_FEEDBACK' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Comment (optional)</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
                  placeholder="Write your feedback..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="anonymous" className="text-sm flex items-center gap-1.5">
                  <EyeOff className="h-3.5 w-3.5" />
                  Submit anonymously
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

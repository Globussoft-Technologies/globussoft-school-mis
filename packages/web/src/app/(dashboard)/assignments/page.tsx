'use client';

import { useEffect, useState } from 'react';
import { Plus, X, BookOpen, Clock, CheckCircle, FileEdit } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  type: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  totalMarks: number;
  isPublished: boolean;
  allowLate: boolean;
  latePenalty?: number;
  academicSessionId: string;
  subject: { id: string; name: string; code: string };
  _count: { submissions: number };
}

const ASSIGNMENT_TYPES = ['FILE_SUBMISSION', 'TEXT_RESPONSE', 'ONLINE_QUIZ', 'DRAWING'];

const typeColors: Record<string, string> = {
  FILE_SUBMISSION: 'bg-blue-100 text-blue-700',
  TEXT_RESPONSE: 'bg-green-100 text-green-700',
  ONLINE_QUIZ: 'bg-purple-100 text-purple-700',
  DRAWING: 'bg-pink-100 text-pink-700',
};

const typeLabels: Record<string, string> = {
  FILE_SUBMISSION: 'File Submission',
  TEXT_RESPONSE: 'Text Response',
  ONLINE_QUIZ: 'Online Quiz',
  DRAWING: 'Drawing',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterClassId, setFilterClassId] = useState('');
  const [publishing, setPublishing] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    instructions: '',
    type: 'FILE_SUBMISSION',
    subjectId: '',
    classId: '',
    sectionId: '',
    dueDate: '',
    totalMarks: '',
    allowLate: false,
    latePenalty: '',
    attachmentUrl: '',
    academicSessionId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchAssignments(classId?: string) {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignments(filterClassId || undefined);
  }, [filterClassId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.subjectId || !form.classId || !form.dueDate || !form.totalMarks || !form.academicSessionId) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const body: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        subjectId: form.subjectId,
        classId: form.classId,
        dueDate: form.dueDate,
        totalMarks: Number(form.totalMarks),
        allowLate: form.allowLate,
        academicSessionId: form.academicSessionId,
      };
      if (form.instructions) body.instructions = form.instructions;
      if (form.sectionId) body.sectionId = form.sectionId;
      if (form.latePenalty) body.latePenalty = Number(form.latePenalty);
      if (form.attachmentUrl) body.attachmentUrl = form.attachmentUrl;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.message || 'Failed to create assignment.');
        return;
      }

      setShowForm(false);
      setForm({
        title: '',
        instructions: '',
        type: 'FILE_SUBMISSION',
        subjectId: '',
        classId: '',
        sectionId: '',
        dueDate: '',
        totalMarks: '',
        allowLate: false,
        latePenalty: '',
        attachmentUrl: '',
        academicSessionId: '',
      });
      fetchAssignments(filterClassId || undefined);
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(id: string) {
    setPublishing(id);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/${id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAssignments(filterClassId || undefined);
    } finally {
      setPublishing(null);
    }
  }

  const stats = {
    total: assignments.length,
    published: assignments.filter((a) => a.isPublished).length,
    draft: assignments.filter((a) => !a.isPublished).length,
    overdue: assignments.filter((a) => isOverdue(a.dueDate)).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileEdit className="h-6 w-6 text-primary" />
            Homework &amp; Assignments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage assignments, track submissions, and grade student work
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Assignments</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          <div className="text-xs text-muted-foreground mt-1">Published</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          <div className="text-xs text-muted-foreground mt-1">Draft</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-xs text-muted-foreground mt-1">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Filter by Class ID:</label>
          <input
            type="text"
            placeholder="Enter class ID..."
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm w-64 bg-background"
          />
          {filterClassId && (
            <button
              onClick={() => setFilterClassId('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Subject</th>
              <th className="text-left p-3 font-medium">Class</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Due Date</th>
              <th className="text-left p-3 font-medium">Marks</th>
              <th className="text-left p-3 font-medium">Submissions</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  Loading assignments...
                </td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="h-8 w-8 opacity-40" />
                    <span>No assignments found. Create your first assignment to get started.</span>
                  </div>
                </td>
              </tr>
            ) : (
              assignments.map((a) => {
                const overdue = isOverdue(a.dueDate) && !a.isPublished;
                return (
                  <tr key={a.id} className="border-t hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{a.title}</div>
                      {a.allowLate && (
                        <div className="text-xs text-muted-foreground">
                          Late allowed{a.latePenalty ? ` (${a.latePenalty}% penalty)` : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div>{a.subject?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{a.subject?.code}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{a.classId}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[a.type] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {typeLabels[a.type] ?? a.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className={overdue ? 'text-red-600 font-medium' : ''}>
                        {formatDate(a.dueDate)}
                      </div>
                      {overdue && (
                        <div className="text-xs text-red-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Overdue
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium">{a.totalMarks}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        {a._count.submissions}
                        {a._count.submissions > 0 && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </span>
                    </td>
                    <td className="p-3">
                      {a.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {!a.isPublished && (
                        <button
                          onClick={() => handlePublish(a.id)}
                          disabled={publishing === a.id}
                          className="text-xs text-primary hover:underline disabled:opacity-50"
                        >
                          {publishing === a.id ? 'Publishing...' : 'Publish'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Assignment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Create New Assignment</h2>
              <button
                onClick={() => { setShowForm(false); setFormError(''); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="e.g. Chapter 5 — Newton's Laws Worksheet"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  rows={3}
                  placeholder="Describe what students need to do..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {ASSIGNMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {typeLabels[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.totalMarks}
                    onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="e.g. 20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subject ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Subject UUID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Class ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Class UUID"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Section ID (optional)</label>
                  <input
                    type="text"
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Section UUID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Academic Session ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.academicSessionId}
                  onChange={(e) => setForm({ ...form, academicSessionId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Academic Session UUID"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowLate}
                    onChange={(e) => setForm({ ...form, allowLate: e.target.checked })}
                    className="rounded"
                  />
                  Allow Late Submissions
                </label>

                {form.allowLate && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Penalty (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.latePenalty}
                      onChange={(e) => setForm({ ...form, latePenalty: e.target.value })}
                      className="border rounded-md px-2 py-1 text-sm w-20 bg-background"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Attachment URL (optional)
                </label>
                <input
                  type="url"
                  value={form.attachmentUrl}
                  onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

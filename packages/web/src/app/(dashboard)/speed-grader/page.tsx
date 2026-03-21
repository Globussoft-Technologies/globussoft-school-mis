'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  MessageSquare,
  Save,
  User,
  FileText,
  ExternalLink,
  Keyboard,
} from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
}

interface Assignment {
  id: string;
  title: string;
  totalMarks?: number;
  subject?: { name: string };
}

interface Submission {
  id: string;
  studentId: string;
  studentName?: string;
  content?: string;
  attachmentUrl?: string;
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  isGraded?: boolean;
  student?: {
    user?: { firstName: string; lastName: string };
    admissionNo?: string;
  };
}

export default function SpeedGraderPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const gradeInputRef = useRef<HTMLInputElement>(null);

  const currentSubmission = submissions[currentIdx] || null;

  const fetchAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const res = await fetch(`${BASE}/assignments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setAssignments(await res.json());
    } finally { setLoadingAssignments(false); }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const fetchSubmissions = useCallback(async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`${BASE}/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        setCurrentIdx(0);
        setGrade('');
        setFeedback('');
      }
    } finally { setLoadingSubmissions(false); }
  }, []);

  useEffect(() => {
    if (selectedAssignment) fetchSubmissions(selectedAssignment.id);
  }, [selectedAssignment, fetchSubmissions]);

  // Pre-fill grade and feedback when switching submissions
  useEffect(() => {
    if (currentSubmission) {
      setGrade(currentSubmission.grade != null ? String(currentSubmission.grade) : '');
      setFeedback(currentSubmission.feedback || '');
    }
  }, [currentIdx, currentSubmission]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Enter' && e.metaKey) { e.preventDefault(); saveGrade(); }
        return;
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'g') { gradeInputRef.current?.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, submissions.length, grade, feedback]);

  function goNext() {
    if (currentIdx < submissions.length - 1) setCurrentIdx(i => i + 1);
  }

  function goPrev() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }

  async function saveGrade() {
    if (!currentSubmission || grade === '') return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/assignments/submissions/${currentSubmission.id}/grade`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: parseFloat(grade), feedback }),
      });
      if (res.ok) {
        setSubmissions(s => s.map((sub, i) =>
          i === currentIdx
            ? { ...sub, grade: parseFloat(grade), feedback, isGraded: true }
            : sub
        ));
        setSavedMsg('Saved!');
        setTimeout(() => setSavedMsg(''), 2000);
        if (currentIdx < submissions.length - 1) {
          setTimeout(() => { setCurrentIdx(i => i + 1); }, 500);
        }
      }
    } finally { setSaving(false); }
  }

  const gradedCount = submissions.filter(s => s.isGraded || s.grade != null).length;
  const ungradedCount = submissions.length - gradedCount;

  const getStudentName = (sub: Submission) => {
    if (sub.studentName) return sub.studentName;
    if (sub.student?.user) return `${sub.student.user.firstName} ${sub.student.user.lastName}`;
    return `Student ${sub.studentId.slice(0, 8)}`;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b mb-4">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Speed Grader</h1>
            <p className="text-xs text-muted-foreground">Fast inline grading interface</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedAssignment && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />{gradedCount} graded
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-orange-500 font-medium">
                <Circle className="h-4 w-4" />{ungradedCount} pending
              </span>
            </div>
          )}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 border rounded-lg text-muted-foreground hover:bg-muted"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className="mb-4 p-3 bg-muted/40 border rounded-lg text-xs text-muted-foreground flex flex-wrap gap-4">
          <span><kbd className="bg-background border rounded px-1">←</kbd><kbd className="bg-background border rounded px-1">→</kbd> Navigate</span>
          <span><kbd className="bg-background border rounded px-1">g</kbd> Focus grade</span>
          <span><kbd className="bg-background border rounded px-1">⌘ Enter</kbd> Save grade</span>
        </div>
      )}

      {/* Assignment Selector */}
      <div className="mb-4">
        <select
          value={selectedAssignment?.id || ''}
          onChange={e => {
            const a = assignments.find(a => a.id === e.target.value);
            setSelectedAssignment(a || null);
          }}
          className="w-full md:w-96 border rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value="">{loadingAssignments ? 'Loading assignments...' : '-- Select an Assignment --'}</option>
          {assignments.map(a => (
            <option key={a.id} value={a.id}>
              {a.title} {a.subject ? `(${a.subject.name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {!selectedAssignment ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">Select an assignment to start grading</p>
            <p className="text-sm">Use the dropdown above to pick an assignment</p>
          </div>
        </div>
      ) : loadingSubmissions ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No submissions yet for this assignment</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {/* Left: Student list */}
          <div className="col-span-1 border rounded-xl overflow-y-auto bg-card">
            <div className="p-3 border-b bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Submissions ({submissions.length})
              </p>
            </div>
            <div className="divide-y">
              {submissions.map((sub, idx) => {
                const isGraded = sub.isGraded || sub.grade != null;
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-full text-left p-3 hover:bg-muted transition-colors ${isCurrent ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {isGraded
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        : <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      }
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{getStudentName(sub)}</div>
                        {isGraded && (
                          <div className="text-xs text-green-600">
                            {sub.grade}/{selectedAssignment.totalMarks || '?'}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Submission content */}
          <div className="col-span-2 border rounded-xl bg-card flex flex-col overflow-hidden">
            {/* Nav bar */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/20">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="p-1.5 rounded border hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium">
                {currentIdx + 1} / {submissions.length}
              </div>
              <button
                onClick={goNext}
                disabled={currentIdx === submissions.length - 1}
                className="p-1.5 rounded border hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {currentSubmission && (
              <div className="flex-1 overflow-y-auto p-4">
                {/* Student info */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{getStudentName(currentSubmission)}</div>
                    {currentSubmission.student?.admissionNo && (
                      <div className="text-xs text-muted-foreground">{currentSubmission.student.admissionNo}</div>
                    )}
                    {currentSubmission.submittedAt && (
                      <div className="text-xs text-muted-foreground">
                        Submitted: {new Date(currentSubmission.submittedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                {currentSubmission.content ? (
                  <div className="bg-background border rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-40">
                    {currentSubmission.content}
                  </div>
                ) : (
                  <div className="bg-background border rounded-lg p-4 text-muted-foreground text-sm text-center py-8">
                    No text content submitted
                  </div>
                )}

                {/* Attachment */}
                {currentSubmission.attachmentUrl && (
                  <a
                    href={currentSubmission.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Attachment
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: Grading panel */}
          <div className="col-span-1 border rounded-xl bg-card flex flex-col overflow-hidden">
            <div className="p-3 border-b bg-muted/20">
              <p className="text-sm font-semibold">Grading Panel</p>
            </div>
            {currentSubmission && (
              <div className="flex-1 p-4 space-y-4">
                {/* Grade input */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase">
                    Grade {selectedAssignment.totalMarks ? `/ ${selectedAssignment.totalMarks}` : ''}
                  </label>
                  <input
                    ref={gradeInputRef}
                    type="number"
                    min="0"
                    max={selectedAssignment.totalMarks}
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-lg font-bold text-center focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="0"
                  />
                  {selectedAssignment.totalMarks && grade !== '' && (
                    <div className="text-center text-xs text-muted-foreground mt-1">
                      {Math.round((parseFloat(grade) / selectedAssignment.totalMarks) * 100)}%
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary focus:outline-none"
                    rows={5}
                    placeholder="Write feedback for student..."
                  />
                </div>

                {/* Quick feedback buttons */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quick feedback:</p>
                  <div className="flex flex-wrap gap-1">
                    {['Great work!', 'Good effort', 'Needs improvement', 'Well done', 'See comments'].map(msg => (
                      <button
                        key={msg}
                        type="button"
                        onClick={() => setFeedback(f => f ? f + ' ' + msg : msg)}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded border"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={saveGrade}
                  disabled={saving || grade === ''}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : savedMsg ? (
                    <><CheckCircle className="h-4 w-4" />{savedMsg}</>
                  ) : (
                    <><Save className="h-4 w-4" />Save Grade</>
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  ⌘+Enter to save & advance
                </p>

                {/* Previous grade */}
                {(currentSubmission.isGraded || currentSubmission.grade != null) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
                    <div className="font-medium text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Previously graded
                    </div>
                    <div className="text-green-600 mt-0.5">
                      Score: {currentSubmission.grade}/{selectedAssignment.totalMarks || '?'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

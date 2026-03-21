'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2, BookOpen, Users, X, Check,
} from 'lucide-react';

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

interface Section {
  id: string;
  name: string;
  capacity: number;
  studentCount: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  isElective: boolean;
}

interface ClassData {
  id: string;
  name: string;
  grade: number;
  sectionCount: number;
  studentCount: number;
  sections: Section[];
  subjects: Subject[];
}

type ModalType =
  | { kind: 'add-class' }
  | { kind: 'edit-class'; cls: ClassData }
  | { kind: 'add-section'; classId: string; className: string }
  | { kind: 'edit-section'; section: Section; classId: string }
  | { kind: 'add-subject'; classId: string; className: string }
  | { kind: 'edit-subject'; subject: Subject; classId: string }
  | null;

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Record<string, 'sections' | 'subjects'>>({});
  const [modal, setModal] = useState<ModalType>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [sectionCapacity, setSectionCapacity] = useState('40');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectElective, setSubjectElective] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/classes/detailed');
      setClasses(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getTab(id: string): 'sections' | 'subjects' {
    return activeTab[id] ?? 'sections';
  }

  function setTab(id: string, tab: 'sections' | 'subjects') {
    setActiveTab((prev) => ({ ...prev, [id]: tab }));
  }

  function openModal(m: ModalType) {
    setFormError('');
    setModal(m);
    if (m?.kind === 'add-class') { setClassName(''); setClassGrade(''); }
    if (m?.kind === 'edit-class') { setClassName(m.cls.name); setClassGrade(String(m.cls.grade)); }
    if (m?.kind === 'add-section') { setSectionName(''); setSectionCapacity('40'); }
    if (m?.kind === 'edit-section') { setSectionName(m.section.name); setSectionCapacity(String(m.section.capacity)); }
    if (m?.kind === 'add-subject') { setSubjectName(''); setSubjectCode(''); setSubjectElective(false); }
    if (m?.kind === 'edit-subject') { setSubjectName(m.subject.name); setSubjectCode(m.subject.code); setSubjectElective(m.subject.isElective); }
  }

  async function handleSubmit() {
    setSaving(true);
    setFormError('');
    try {
      if (!modal) return;

      if (modal.kind === 'add-class') {
        if (!className.trim() || !classGrade) throw new Error('Name and grade are required');
        await apiFetch('/classes', {
          method: 'POST',
          body: JSON.stringify({ name: className.trim(), grade: Number(classGrade) }),
        });
      } else if (modal.kind === 'edit-class') {
        await apiFetch(`/classes/${modal.cls.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: className.trim(), grade: Number(classGrade) }),
        });
      } else if (modal.kind === 'add-section') {
        if (!sectionName.trim()) throw new Error('Section name is required');
        await apiFetch('/sections', {
          method: 'POST',
          body: JSON.stringify({ name: sectionName.trim(), classId: modal.classId, capacity: Number(sectionCapacity) }),
        });
      } else if (modal.kind === 'edit-section') {
        await apiFetch(`/sections/${modal.section.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: sectionName.trim(), capacity: Number(sectionCapacity) }),
        });
      } else if (modal.kind === 'add-subject') {
        if (!subjectName.trim() || !subjectCode.trim()) throw new Error('Name and code are required');
        await apiFetch('/subjects', {
          method: 'POST',
          body: JSON.stringify({ name: subjectName.trim(), code: subjectCode.trim(), classId: modal.classId, isElective: subjectElective }),
        });
      } else if (modal.kind === 'edit-subject') {
        await apiFetch(`/subjects/${modal.subject.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: subjectName.trim(), code: subjectCode.trim(), isElective: subjectElective }),
        });
      }

      setModal(null);
      loadClasses();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type: 'class' | 'section' | 'subject', id: string, label: string) {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/${type === 'class' ? 'classes' : type === 'section' ? 'sections' : 'subjects'}/${id}`, { method: 'DELETE' });
      loadClasses();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes & Sections</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage classes, sections and subjects</p>
        </div>
        <button
          onClick={() => openModal({ kind: 'add-class' })}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Class
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No classes found. Add your first class to get started.</div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => {
            const isOpen = expanded.has(cls.id);
            const tab = getTab(cls.id);
            return (
              <div key={cls.id} className="border rounded-lg bg-card overflow-hidden">
                {/* Class header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleExpand(cls.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 flex items-center gap-4">
                    <div>
                      <span className="font-semibold">{cls.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">Grade {cls.grade}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{cls.sectionCount}</span> sections
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-medium text-foreground">{cls.studentCount}</span> students
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span className="font-medium text-foreground">{cls.subjects.length}</span> subjects
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal({ kind: 'edit-class', cls })}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Edit class"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete('class', cls.id, cls.name)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete class"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t bg-muted/20">
                    {/* Tabs */}
                    <div className="flex border-b px-4">
                      <button
                        onClick={() => setTab(cls.id, 'sections')}
                        className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                          tab === 'sections'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Sections
                      </button>
                      <button
                        onClick={() => setTab(cls.id, 'subjects')}
                        className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                          tab === 'subjects'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Subjects
                      </button>
                    </div>

                    <div className="p-4">
                      {tab === 'sections' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium">Sections</span>
                            <button
                              onClick={() => openModal({ kind: 'add-section', classId: cls.id, className: cls.name })}
                              className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:opacity-90"
                            >
                              <Plus className="h-3 w-3" /> Add Section
                            </button>
                          </div>
                          {cls.sections.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No sections yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {cls.sections.map((sec) => (
                                <div key={sec.id} className="border rounded-md p-3 bg-card flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm">Section {sec.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {sec.studentCount}/{sec.capacity} students
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => openModal({ kind: 'edit-section', section: sec, classId: cls.id })}
                                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete('section', sec.id, `Section ${sec.name}`)}
                                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {tab === 'subjects' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium">Subjects</span>
                            <button
                              onClick={() => openModal({ kind: 'add-subject', classId: cls.id, className: cls.name })}
                              className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:opacity-90"
                            >
                              <Plus className="h-3 w-3" /> Add Subject
                            </button>
                          </div>
                          {cls.subjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No subjects yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {cls.subjects.map((subj) => (
                                <div key={subj.id} className="border rounded-md px-3 py-2 bg-card flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <span className="font-medium text-sm">{subj.name}</span>
                                      <span className="ml-2 text-xs text-muted-foreground">{subj.code}</span>
                                    </div>
                                    {subj.isElective && (
                                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                        Elective
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => openModal({ kind: 'edit-subject', subject: subj, classId: cls.id })}
                                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete('subject', subj.id, subj.name)}
                                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {modal.kind === 'add-class' && 'Add Class'}
                {modal.kind === 'edit-class' && 'Edit Class'}
                {modal.kind === 'add-section' && `Add Section — ${modal.className}`}
                {modal.kind === 'edit-section' && 'Edit Section'}
                {modal.kind === 'add-subject' && `Add Subject — ${modal.className}`}
                {modal.kind === 'edit-subject' && 'Edit Subject'}
              </h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {(modal.kind === 'add-class' || modal.kind === 'edit-class') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Class Name</label>
                    <input
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g. Class 1"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Grade (1–12)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={classGrade}
                      onChange={(e) => setClassGrade(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {(modal.kind === 'add-section' || modal.kind === 'edit-section') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Section Name</label>
                    <input
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      placeholder="e.g. A"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity</label>
                    <input
                      type="number"
                      min={1}
                      value={sectionCapacity}
                      onChange={(e) => setSectionCapacity(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {(modal.kind === 'add-subject' || modal.kind === 'edit-subject') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Name</label>
                    <input
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Code</label>
                    <input
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      placeholder="e.g. C10-MAT"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="elective"
                      checked={subjectElective}
                      onChange={(e) => setSubjectElective(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="elective" className="text-sm">Elective subject</label>
                  </div>
                </>
              )}

              {formError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{formError}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 border rounded-md py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2 text-sm hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

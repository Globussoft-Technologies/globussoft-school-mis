'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Plus, FileText, Video, Headphones, X, BookOpen, MessagesSquare,
  Route, Trophy, Zap, Layers, TableProperties, GraduationCap,
  FileEdit, Clock, Users, Play, CheckCircle, Upload, Link2,
} from 'lucide-react';

interface LmsContent {
  id: string;
  title: string;
  description?: string;
  type: string;
  isPublished: boolean;
  fileUrl?: string;
  externalUrl?: string;
  subject?: { name: string };
  class?: { name: string };
  uploader?: { firstName: string; lastName: string };
  createdAt: string;
}

interface Stats {
  content: number;
  modules: number;
  assignments: number;
  discussions: number;
  paths: number;
  liveClasses: number;
  rubrics: number;
  badges: number;
}

const typeColors: Record<string, string> = {
  VIDEO: 'bg-red-100 text-red-700',
  DOCUMENT: 'bg-blue-100 text-blue-700',
  PRESENTATION: 'bg-orange-100 text-orange-700',
  LINK: 'bg-green-100 text-green-700',
  AUDIO: 'bg-purple-100 text-purple-700',
  INTERACTIVE: 'bg-pink-100 text-pink-700',
};

const typeIcons: Record<string, React.ElementType> = {
  VIDEO: Video,
  DOCUMENT: FileText,
  PRESENTATION: FileText,
  LINK: Link2,
  AUDIO: Headphones,
  INTERACTIVE: Zap,
};

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'DOCUMENT',
  externalUrl: '',
  fileUrl: '',
  subjectId: '',
  classId: '',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LmsPage() {
  const [contents, setContents] = useState<LmsContent[]>([]);
  const [stats, setStats] = useState<Stats>({ content: 0, modules: 0, assignments: 0, discussions: 0, paths: 0, liveClasses: 0, rubrics: 0, badges: 0 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [tab, setTab] = useState<'hub' | 'content'>('hub');

  // File upload state
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const h = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
  const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

  function loadContent() {
    fetch('/api/v1/lms-content', { headers: h() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setContents(Array.isArray(d) ? d : []))
      .catch(() => {});
  }

  useEffect(() => {
    loadContent();
    fetch('/api/v1/dashboard/stats', { headers: h() }).then(r => r.ok ? r.json() : {}).then(d => {
      setStats({
        content: d.totalLmsContent || 0, modules: d.totalCourseModules || 0,
        assignments: d.totalAssignments || 0, discussions: d.totalDiscussionForums || 0,
        paths: d.totalLearningPaths || 0, liveClasses: d.totalLiveClasses || 0,
        rubrics: d.totalRubrics || 0, badges: d.totalBadges || 0,
      });
    }).catch(() => {});
    fetch('/api/v1/classes', { headers: h() }).then(r => r.ok ? r.json() : []).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.classId) { setSubjects([]); return; }
    fetch(`/api/v1/subjects?classId=${form.classId}`, { headers: h() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setSubjects(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [form.classId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setUploadProgress(null);
  }

  async function uploadFileToStorage(): Promise<string | null> {
    if (!selectedFile) return null;

    const fd = new FormData();
    fd.append('file', selectedFile);

    // Build folder path if class/subject info available
    const selectedClass = classes.find(c => c.id === form.classId);
    const selectedSubject = subjects.find(s => s.id === form.subjectId);
    if (selectedClass && selectedSubject) {
      const folder = `${selectedClass.name.toLowerCase().replace(/\s+/g, '-')}/${selectedSubject.name.toLowerCase().replace(/\s+/g, '-')}/${form.type.toLowerCase()}s`;
      fd.append('folder', folder);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/v1/files/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('accessToken')}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url ?? null);
          } catch {
            reject(new Error('Invalid server response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message ?? `Upload failed: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(fd);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let fileUrl = form.fileUrl;

      if (uploadMode === 'file' && selectedFile) {
        fileUrl = await uploadFileToStorage() ?? '';
      }

      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        subjectId: form.subjectId,
        classId: form.classId,
        ...(uploadMode === 'file' ? { fileUrl } : { externalUrl: form.externalUrl }),
      };

      const res = await fetch('/api/v1/lms-content', {
        method: 'POST',
        headers: jh(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setSelectedFile(null);
        setUploadProgress(null);
        setError('');
        setTab('content'); // Switch to content tab to show the new item
        loadContent();
        alert('Content uploaded successfully!');
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.message ?? `Error ${res.status}`);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Network error');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  const lmsModules = [
    { name: 'Course Modules', desc: 'Structured learning with prerequisites & sequential unlock', href: '/course-modules', icon: Layers, count: stats.modules, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Assignments', desc: 'Homework, submissions, grading & feedback', href: '/assignments', icon: FileEdit, count: stats.assignments, color: 'text-violet-600', bg: 'bg-violet-50' },
    { name: 'Discussion Forums', desc: 'Threaded discussions, graded forums, Q&A', href: '/discussions', icon: MessagesSquare, count: stats.discussions, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { name: 'Learning Paths', desc: 'Step-by-step learning journeys with progress tracking', href: '/learning-paths', icon: Route, count: stats.paths, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Live Classes', desc: 'Schedule virtual classes, recordings, attendance', href: '/live-classes', icon: Video, count: stats.liveClasses, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Rubrics', desc: 'Criterion-based scoring with performance levels', href: '/rubrics', icon: TableProperties, count: stats.rubrics, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Speed Grader', desc: 'Fast inline grading with keyboard shortcuts', href: '/speed-grader', icon: Zap, count: null, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { name: 'Gamification', desc: 'Badges, points, leaderboard & levels', href: '/gamification', icon: Trophy, count: stats.badges, color: 'text-pink-600', bg: 'bg-pink-50' },
    { name: 'Question Bank', desc: 'Reusable question pools by subject & difficulty', href: '/question-bank', icon: BookOpen, count: null, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Assessments', desc: '8-tier assessment system (micro → annual)', href: '/assessments', icon: GraduationCap, count: null, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Learning Management System</h1>
          <p className="text-sm text-muted-foreground">Manage all learning content, courses, assessments and engagement</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('hub')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'hub' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>LMS Hub</button>
          <button onClick={() => setTab('content')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'content' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>Content Library</button>
        </div>
      </div>

      {/* ─── LMS HUB TAB ─── */}
      {tab === 'hub' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.content}</p>
              <p className="text-sm text-muted-foreground">Content Items</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-violet-600">{stats.assignments}</p>
              <p className="text-sm text-muted-foreground">Assignments</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.liveClasses}</p>
              <p className="text-sm text-muted-foreground">Live Classes</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats.paths}</p>
              <p className="text-sm text-muted-foreground">Learning Paths</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">LMS Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lmsModules.map(mod => (
              <Link key={mod.name} href={mod.href}
                className="bg-card rounded-lg border p-5 hover:shadow-md hover:border-primary/30 transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${mod.bg} group-hover:scale-110 transition-transform`}>
                    <mod.icon className={`h-6 w-6 ${mod.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{mod.name}</h3>
                      {mod.count !== null && (
                        <span className="text-sm font-bold text-muted-foreground">{mod.count}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mod.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── CONTENT LIBRARY TAB ─── */}
      {tab === 'content' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setShowForm(!showForm); setError(''); }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? 'Cancel' : 'Upload Content'}
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-lg border p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Upload New Content</h2>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="VIDEO">Video</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="PRESENTATION">Presentation</option>
                      <option value="LINK">Link</option>
                      <option value="AUDIO">Audio</option>
                      <option value="INTERACTIVE">Interactive</option>
                    </select>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Class *</label>
                    <select required value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, subjectId: '' }))} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject *</label>
                    <select required value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  {/* Upload mode toggle */}
                  <div className="md:col-span-2">
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border ${uploadMode === 'file' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border ${uploadMode === 'link' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        External Link
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div>
                        <label className="block text-sm font-medium mb-1">File</label>
                        <div
                          className="border-2 border-dashed rounded-md p-4 cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {selectedFile ? (
                            <div className="flex items-center gap-3">
                              <Upload className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="ml-auto p-1 hover:bg-muted rounded"
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">Click to select a file</p>
                              <p className="text-xs mt-1">PDF, DOC, DOCX, PPT, PPTX, MP4, MP3, JPG, PNG, GIF, WEBP — max 2 GB</p>
                            </div>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.jpg,.jpeg,.png,.gif,.webp"
                          onChange={handleFileChange}
                        />

                        {uploadProgress !== null && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-1">External URL</label>
                        <input
                          value={form.externalUrl}
                          onChange={e => setForm(p => ({ ...p, externalUrl: e.target.value }))}
                          placeholder="https://..."
                          className="w-full border rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setShowForm(false); setSelectedFile(null); setUploadProgress(null); }} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
                    {submitting ? (uploadProgress !== null ? `Uploading ${uploadProgress}%...` : 'Saving...') : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contents.length === 0 ? (
              <div className="col-span-full bg-card rounded-lg border p-8 text-center text-muted-foreground">No content yet.</div>
            ) : contents.map(c => {
              const TypeIcon = typeIcons[c.type] ?? FileText;
              return (
                <Link
                  key={c.id}
                  href={`/lms/${c.id}`}
                  className="bg-card rounded-lg border p-4 hover:shadow-md hover:border-primary/30 transition-all block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${typeColors[c.type] || 'bg-gray-100'}`}>
                      <TypeIcon className="h-3 w-3" />
                      {c.type}
                    </span>
                    <span className={`text-xs ${c.isPublished ? 'text-green-600' : 'text-yellow-600'}`}>{c.isPublished ? 'Published' : 'Draft'}</span>
                  </div>
                  <h3 className="font-medium mb-1">{c.title}</h3>
                  {c.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{c.class?.name}</span><span>•</span><span>{c.subject?.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    by {c.uploader?.firstName} {c.uploader?.lastName}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

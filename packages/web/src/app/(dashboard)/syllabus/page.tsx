'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Search, Plus, Trash2, Edit3, X } from 'lucide-react';

interface Topic {
  id: string;
  title?: string;
  name?: string;
  isDelivered?: boolean;
  estimatedMinutes?: number;
}

interface Chapter {
  id: string;
  title?: string;
  name?: string;
  estimatedHours?: number;
  topics?: Topic[];
}

interface Syllabus {
  id: string;
  subject?: { name: string; code: string };
  class?: { name: string; grade: number };
  subjectName?: string;
  className?: string;
  chapters?: Chapter[];
}

interface ClassOption { id: string; name: string; grade: number; }

export default function SyllabusPage() {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSyllabus, setExpandedSyllabus] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [detailCache, setDetailCache] = useState<Record<string, Syllabus>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapterTo, setAddingChapterTo] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [createForm, setCreateForm] = useState({ subjectId: '', classId: '', chapters: '' });
  const [actionMsg, setActionMsg] = useState('');

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
  const jsonHeaders = () => ({ ...getHeaders(), 'Content-Type': 'application/json' });

  // Load classes
  useEffect(() => {
    fetch('/api/v1/classes', { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Load subjects when class selected
  useEffect(() => {
    if (!selectedClassId) { setSubjects([]); return; }
    fetch(`/api/v1/subjects?classId=${selectedClassId}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : []).then(d => setSubjects(Array.isArray(d) ? d : [])).catch(() => {});
  }, [selectedClassId]);

  // Load syllabi (optionally filtered by class)
  useEffect(() => {
    setLoading(true);
    const url = selectedClassId
      ? `/api/v1/syllabus?classId=${selectedClassId}`
      : '/api/v1/syllabus';
    fetch(url, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSyllabi(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedClassId]);

  async function toggleSyllabus(id: string) {
    if (expandedSyllabus === id) { setExpandedSyllabus(null); return; }
    setExpandedSyllabus(id);
    if (detailCache[id]) return;
    try {
      const res = await fetch(`/api/v1/syllabus/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const detail: Syllabus = await res.json();
        setDetailCache(prev => ({ ...prev, [id]: detail }));
      }
    } catch {}
  }

  function toggleChapter(chapterId: string) {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      next.has(chapterId) ? next.delete(chapterId) : next.add(chapterId);
      return next;
    });
  }

  // Filter by search
  const filtered = syllabi.filter(syl => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const subName = (syl.subject?.name || syl.subjectName || '').toLowerCase();
    const clsName = (syl.class?.name || syl.className || '').toLowerCase();
    return subName.includes(q) || clsName.includes(q);
  });

  // Group by class
  const grouped = new Map<string, Syllabus[]>();
  for (const syl of filtered) {
    const clsName = syl.class?.name || syl.className || 'Unknown';
    const existing = grouped.get(clsName) || [];
    existing.push(syl);
    grouped.set(clsName, existing);
  }

  // Sort groups by grade
  const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
    const gradeA = filtered.find(s => (s.class?.name || s.className) === a[0])?.class?.grade || 0;
    const gradeB = filtered.find(s => (s.class?.name || s.className) === b[0])?.class?.grade || 0;
    return gradeA - gradeB;
  });

  async function handleCreateSyllabus(e: React.FormEvent) {
    e.preventDefault(); setActionMsg('');
    const sessionId = sessions.length > 0 ? sessions[0]?.id : '';
    if (!createForm.subjectId || !createForm.classId) return;
    try {
      const res = await fetch('/api/v1/syllabus', {
        method: 'POST', headers: jsonHeaders(),
        body: JSON.stringify({ subjectId: createForm.subjectId, classId: createForm.classId || selectedClassId, academicSessionId: sessionId }),
      });
      if (res.ok) { setShowCreateForm(false); setCreateForm({ subjectId: '', classId: '', chapters: '' }); setActionMsg('Syllabus created!'); loadSyllabi(); }
      else setActionMsg('Failed to create syllabus');
    } catch { setActionMsg('Error creating syllabus'); }
  }

  async function handleAddChapter(syllabusId: string) {
    if (!newChapterTitle.trim()) return;
    try {
      const res = await fetch(`/api/v1/syllabus/${syllabusId}/chapters`, {
        method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ title: newChapterTitle }),
      });
      if (res.ok) { setNewChapterTitle(''); setAddingChapterTo(null); setDetailCache(prev => { const n = { ...prev }; delete n[syllabusId]; return n; }); toggleSyllabus(syllabusId); }
    } catch {}
  }

  async function handleDeleteChapter(chapterId: string, syllabusId: string) {
    if (!confirm('Delete this chapter and all its topics?')) return;
    try {
      await fetch(`/api/v1/syllabus/chapters/${chapterId}`, { method: 'DELETE', headers: getHeaders() });
      setDetailCache(prev => { const n = { ...prev }; delete n[syllabusId]; return n; });
      toggleSyllabus(syllabusId); // re-open to refresh
      setTimeout(() => toggleSyllabus(syllabusId), 100);
    } catch {}
  }

  async function handleAddTopic(chapterId: string, syllabusId: string) {
    if (!newTopicTitle.trim()) return;
    try {
      const res = await fetch(`/api/v1/syllabus/chapters/${chapterId}/topics`, {
        method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ title: newTopicTitle }),
      });
      if (res.ok) { setNewTopicTitle(''); setAddingTopicTo(null); setDetailCache(prev => { const n = { ...prev }; delete n[syllabusId]; return n; }); }
    } catch {}
  }

  async function handleDeleteTopic(topicId: string, syllabusId: string) {
    try {
      await fetch(`/api/v1/syllabus/topics/${topicId}`, { method: 'DELETE', headers: getHeaders() });
      setDetailCache(prev => { const n = { ...prev }; delete n[syllabusId]; return n; });
    } catch {}
  }

  function loadSyllabi() {
    setLoading(true);
    const url = selectedClassId ? `/api/v1/syllabus?classId=${selectedClassId}` : '/api/v1/syllabus';
    fetch(url, { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(data => { setSyllabi(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }

  const [sessions, setSessions2] = useState<{id:string;name:string}[]>([]);
  useEffect(() => {
    fetch('/api/v1/academic-sessions', { headers: getHeaders() }).then(r => r.ok ? r.json() : []).then(d => setSessions2(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Syllabus</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreateForm ? 'Cancel' : 'New Syllabus'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-4">Create New Syllabus</h2>
          <form onSubmit={handleCreateSyllabus} className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium mb-1">Class</label>
              <select value={createForm.classId || selectedClassId} onChange={e => { setCreateForm(p => ({ ...p, classId: e.target.value })); setSelectedClassId(e.target.value); }} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select value={createForm.subjectId} onChange={e => setCreateForm(p => ({ ...p, subjectId: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Create</button>
          </form>
        </div>
      )}

      {actionMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{actionMsg}</div>}

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={e => { setSelectedClassId(e.target.value); setExpandedSyllabus(null); }}
            className="border rounded-md px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Search Subject</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by subject name..."
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {filtered.length} syllab{filtered.length !== 1 ? 'i' : 'us'}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground text-sm">Loading syllabi...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground text-sm">
          {searchQuery ? 'No syllabi match your search.' : 'No syllabi found for this class.'}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([clsName, sylls]) => (
            <div key={clsName}>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{clsName} ({sylls.length} subjects)</h2>
              <div className="space-y-2">
                {sylls.map(syl => {
                  const detail = detailCache[syl.id] ?? syl;
                  const isOpen = expandedSyllabus === syl.id;
                  const chapters = detail.chapters ?? [];
                  const totalTopics = chapters.reduce((s, ch) => s + (ch.topics?.length ?? 0), 0);

                  return (
                    <div key={syl.id} className="bg-card rounded-lg border overflow-hidden">
                      <button
                        onClick={() => toggleSyllabus(syl.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-50">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{syl.subject?.name || syl.subjectName || 'Unknown Subject'}</p>
                            <p className="text-xs text-muted-foreground">
                              {syl.subject?.code || ''}
                              {isOpen && chapters.length > 0 ? ` · ${chapters.length} chapters · ${totalTopics} topics` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isOpen && <span className="text-xs text-muted-foreground">{chapters.length || '...'} chapters</span>}
                          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t px-4 pb-4">
                          {chapters.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">Loading chapters...</p>
                          ) : (
                            <div className="space-y-2 pt-3">
                              {/* Add Chapter */}
                              <div className="flex gap-2 mb-2">
                                {addingChapterTo === syl.id ? (
                                  <div className="flex gap-2 flex-1">
                                    <input value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} placeholder="Chapter title..." className="flex-1 border rounded px-2 py-1 text-sm" autoFocus />
                                    <button onClick={() => handleAddChapter(syl.id)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">Add</button>
                                    <button onClick={() => { setAddingChapterTo(null); setNewChapterTitle(''); }} className="px-2 py-1 border rounded text-xs">Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setAddingChapterTo(syl.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                                    <Plus className="h-3 w-3" /> Add Chapter
                                  </button>
                                )}
                              </div>
                              {chapters.map((ch, chIdx) => (
                                <div key={ch.id} className="border rounded-md overflow-hidden">
                                  <button
                                    onClick={() => toggleChapter(ch.id)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 text-left"
                                  >
                                    <span className="text-sm font-medium">
                                      Ch {chIdx + 1}: {ch.title || ch.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        {ch.topics?.length ?? 0} topics
                                        {ch.estimatedHours ? ` · ${ch.estimatedHours}h` : ''}
                                      </span>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteChapter(ch.id, syl.id); }} className="text-red-400 hover:text-red-600 ml-1" title="Delete chapter">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                      {expandedChapters.has(ch.id)
                                        ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                        : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                    </div>
                                  </button>
                                  {expandedChapters.has(ch.id) && (
                                    <div>
                                      <ul className="divide-y">
                                        {(ch.topics || []).map((topic, tIdx) => (
                                          <li key={topic.id} className="flex items-center justify-between px-4 py-2 text-sm group">
                                            <span className="text-muted-foreground">
                                              {chIdx + 1}.{tIdx + 1} &nbsp; {topic.title || topic.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-muted-foreground">
                                                {topic.estimatedMinutes ? `${topic.estimatedMinutes} min` : ''}
                                              </span>
                                              <button onClick={() => handleDeleteTopic(topic.id, syl.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete topic">
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                      {/* Add Topic */}
                                      <div className="px-4 py-2 border-t">
                                        {addingTopicTo === ch.id ? (
                                          <div className="flex gap-2">
                                            <input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="Topic title..." className="flex-1 border rounded px-2 py-1 text-sm" autoFocus />
                                            <button onClick={() => handleAddTopic(ch.id, syl.id)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">Add</button>
                                            <button onClick={() => { setAddingTopicTo(null); setNewTopicTitle(''); }} className="px-2 py-1 border rounded text-xs">Cancel</button>
                                          </div>
                                        ) : (
                                          <button onClick={() => setAddingTopicTo(ch.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                                            <Plus className="h-3 w-3" /> Add Topic
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

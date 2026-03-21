'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessagesSquare,
  Plus,
  X,
  Pin,
  Lock,
  ThumbsUp,
  Reply,
  Star,
  ChevronLeft,
  Clock,
  MessageCircle,
  BarChart2,
  Send,
  AlertCircle,
} from 'lucide-react';

interface ClassOption { id: string; name: string; }
interface SubjectOption { id: string; name: string; code: string; }

interface Forum {
  id: string;
  title: string;
  description?: string;
  classId: string;
  subjectId?: string;
  type: string;
  isLocked: boolean;
  isPinned: boolean;
  allowAnonymous: boolean;
  totalPoints?: number;
  dueDate?: string;
  createdAt: string;
  _count?: { posts: number };
}

interface Post {
  id: string;
  forumId: string;
  authorId: string;
  parentId?: string;
  content: string;
  isAnonymous: boolean;
  isPinned: boolean;
  likes: number;
  score?: number;
  createdAt: string;
  replies?: Post[];
}

interface ParticipationData {
  forumId: string;
  totalPosts: number;
  participants: { authorId: string; postCount: number; replyCount: number; score?: number }[];
}

const typeColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  GRADED: 'bg-purple-100 text-purple-700',
  Q_AND_A: 'bg-blue-100 text-blue-700',
  ANNOUNCEMENT: 'bg-orange-100 text-orange-700',
};

const typeLabels: Record<string, string> = {
  OPEN: 'Open',
  GRADED: 'Graded',
  Q_AND_A: 'Q & A',
  ANNOUNCEMENT: 'Announcement',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AuthorAvatar({ authorId, isAnonymous }: { authorId: string; isAnonymous: boolean }) {
  const initials = isAnonymous ? '?' : authorId.slice(0, 2).toUpperCase();
  const color = isAnonymous ? 'bg-gray-300' : 'bg-indigo-500';
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function DiscussionsPage() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '');
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [forums, setForums] = useState<Forum[]>([]);
  const [activeForum, setActiveForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [participation, setParticipation] = useState<ParticipationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showCreateForum, setShowCreateForum] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [view, setView] = useState<'forums' | 'forum'>('forums');

  const [forumForm, setForumForm] = useState({
    title: '',
    description: '',
    type: 'OPEN',
    allowAnonymous: false,
    totalPoints: '',
    dueDate: '',
  });

  useEffect(() => {
    fetch(`${base}/classes`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setSubjects([]); return; }
    fetch(`${base}/subjects?classId=${selectedClassId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [selectedClassId]);

  const fetchForums = useCallback(() => {
    if (!selectedClassId) return;
    setLoading(true);
    let url = `${base}/discussions?classId=${selectedClassId}`;
    if (selectedSubjectId) url += `&subjectId=${selectedSubjectId}`;
    fetch(url, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setForums(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedClassId, selectedSubjectId]);

  useEffect(() => { fetchForums(); }, [fetchForums]);

  const openForum = async (forum: Forum) => {
    setActiveForum(forum);
    setView('forum');
    setPostsLoading(true);
    try {
      const [postsRes, partRes] = await Promise.all([
        fetch(`${base}/discussions/${forum.id}/posts`, { headers: authHeaders() }),
        fetch(`${base}/discussions/${forum.id}/participation`, { headers: authHeaders() }),
      ]);
      const postsData = await postsRes.json();
      const partData = await partRes.json();
      setPosts(postsData.posts || []);
      setParticipation(partData);
    } finally { setPostsLoading(false); }
  };

  const createForum = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: forumForm.title,
      description: forumForm.description,
      classId: selectedClassId,
      subjectId: selectedSubjectId || undefined,
      type: forumForm.type,
      allowAnonymous: forumForm.allowAnonymous,
      totalPoints: forumForm.totalPoints ? parseFloat(forumForm.totalPoints) : undefined,
      dueDate: forumForm.dueDate || undefined,
    };
    const res = await fetch(`${base}/discussions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    if (res.ok) {
      setShowCreateForum(false);
      setForumForm({ title: '', description: '', type: 'OPEN', allowAnonymous: false, totalPoints: '', dueDate: '' });
      fetchForums();
    }
  };

  const submitPost = async (parentId?: string) => {
    const content = parentId ? replyContent : newPostContent;
    if (!content.trim() || !activeForum) return;
    const res = await fetch(`${base}/discussions/${activeForum.id}/posts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content, parentId }),
    });
    if (res.ok) {
      setNewPostContent('');
      setReplyContent('');
      setReplyingTo(null);
      openForum(activeForum);
    }
  };

  const likePost = async (postId: string) => {
    await fetch(`${base}/discussions/posts/${postId}/like`, { method: 'PATCH', headers: authHeaders() });
    if (activeForum) openForum(activeForum);
  };

  const lockForum = async (forumId: string, isLocked: boolean) => {
    await fetch(`${base}/discussions/${forumId}/lock`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ isLocked }),
    });
    fetchForums();
    if (activeForum?.id === forumId) setActiveForum((f) => f ? { ...f, isLocked } : f);
  };

  const PostCard = ({ post, depth = 0 }: { post: Post; depth?: number }) => (
    <div className={`${depth > 0 ? 'ml-10 border-l-2 border-indigo-100 pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        <AuthorAvatar authorId={post.authorId} isAnonymous={post.isAnonymous} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800">
              {post.isAnonymous ? 'Anonymous' : post.authorId.slice(0, 8) + '...'}
            </span>
            {post.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
            <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
            {post.score !== null && post.score !== undefined && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> {post.score} pts
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => likePost(post.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <ThumbsUp className="w-3.5 h-3.5" /> {post.likes}
            </button>
            {depth < 2 && (
              <button
                onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" /> Reply
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === post.id && (
            <div className="mt-3 flex gap-2">
              <input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitPost(post.id)}
              />
              <button
                onClick={() => submitPost(post.id)}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {post.replies?.map((reply) => (
        <PostCard key={reply.id} post={reply} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === 'forum' && (
            <button onClick={() => { setView('forums'); setActiveForum(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessagesSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {view === 'forum' && activeForum ? activeForum.title : 'Discussion Forums'}
            </h1>
            <p className="text-sm text-gray-500">
              {view === 'forum' ? 'Threaded discussions with replies' : 'Collaborative learning through discussion'}
            </p>
          </div>
        </div>
        {view === 'forums' && selectedClassId && (
          <button
            onClick={() => setShowCreateForum(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> New Forum
          </button>
        )}
        {view === 'forum' && activeForum && (
          <button
            onClick={() => lockForum(activeForum.id, !activeForum.isLocked)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${activeForum.isLocked ? 'border-green-300 text-green-600 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
          >
            <Lock className="w-4 h-4" />
            {activeForum.isLocked ? 'Unlock Forum' : 'Lock Forum'}
          </button>
        )}
      </div>

      {/* Forums List View */}
      {view === 'forums' && (
        <>
          <div className="flex gap-4 flex-wrap">
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); }}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              disabled={!selectedClassId}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : !selectedClassId ? (
            <div className="text-center py-16 text-gray-400">
              <MessagesSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a class to view forums</p>
            </div>
          ) : forums.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessagesSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No forums yet. Create the first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {forums.map((forum) => (
                <div
                  key={forum.id}
                  className="bg-white border rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => openForum(forum)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {forum.isPinned && <Pin className="w-4 h-4 text-amber-500" />}
                        <h3 className="font-semibold text-gray-900">{forum.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[forum.type]}`}>
                          {typeLabels[forum.type]}
                        </span>
                        {forum.isLocked && (
                          <span className="flex items-center gap-1 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                        {forum.allowAnonymous && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Anonymous</span>
                        )}
                      </div>
                      {forum.description && <p className="text-sm text-gray-500">{forum.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" /> {forum._count?.posts ?? 0} posts
                        </span>
                        {forum.totalPoints && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <Star className="w-3.5 h-3.5" /> {forum.totalPoints} pts
                          </span>
                        )}
                        {forum.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due {new Date(forum.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Forum Detail View */}
      {view === 'forum' && activeForum && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Column */}
          <div className="lg:col-span-2 space-y-4">
            {activeForum.isLocked && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2 text-sm">
                <AlertCircle className="w-4 h-4" /> This forum is locked. No new posts allowed.
              </div>
            )}

            {/* New Post Input */}
            {!activeForum.isLocked && (
              <div className="bg-white border rounded-xl p-4 space-y-3">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Start a discussion..."
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => submitPost()}
                    disabled={!newPostContent.trim()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <Send className="w-4 h-4" /> Post
                  </button>
                </div>
              </div>
            )}

            {/* Posts */}
            {postsLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="bg-white border rounded-xl divide-y">
                {posts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">No posts yet. Be the first to post!</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="px-4">
                      <PostCard post={post} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Participation Stats */}
          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Participation</h3>
              </div>
              {participation ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    Total posts: <span className="font-semibold text-gray-800">{participation.totalPosts}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Participants: <span className="font-semibold text-gray-800">{participation.participants.length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {participation.participants.slice(0, 10).map((p) => (
                      <div key={p.authorId} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <AuthorAvatar authorId={p.authorId} isAnonymous={false} />
                          <span className="text-gray-600 truncate max-w-24">{p.authorId.slice(0, 8)}...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{p.postCount}p {p.replyCount}r</span>
                          {p.score !== undefined && (
                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{p.score}pt</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Loading...</p>
              )}
            </div>

            {activeForum.totalPoints && (
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">Graded Forum</h3>
                </div>
                <p className="text-sm text-gray-600">Total Points: <strong>{activeForum.totalPoints}</strong></p>
                {activeForum.dueDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Due: <strong>{new Date(activeForum.dueDate).toLocaleDateString('en-IN')}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Forum Modal */}
      {showCreateForum && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create Discussion Forum</h2>
              <button onClick={() => setShowCreateForum(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createForum} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  required
                  value={forumForm.title}
                  onChange={(e) => setForumForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Discussion title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={forumForm.description}
                  onChange={(e) => setForumForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="What should students discuss?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={forumForm.type}
                    onChange={(e) => setForumForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="OPEN">Open</option>
                    <option value="GRADED">Graded</option>
                    <option value="Q_AND_A">Q & A</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                  </select>
                </div>
                {forumForm.type === 'GRADED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                    <input
                      type="number"
                      value={forumForm.totalPoints}
                      onChange={(e) => setForumForm((f) => ({ ...f, totalPoints: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g. 10"
                    />
                  </div>
                )}
              </div>
              {forumForm.type === 'GRADED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={forumForm.dueDate}
                    onChange={(e) => setForumForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forumForm.allowAnonymous}
                  onChange={(e) => setForumForm((f) => ({ ...f, allowAnonymous: e.target.checked }))}
                />
                Allow anonymous posts
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateForum(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
                  Create Forum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

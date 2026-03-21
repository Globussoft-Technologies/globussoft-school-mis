'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Trophy,
  Plus,
  X,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Zap,
  Crown,
  BookOpen,
  Clock,
  Users,
  BarChart2,
  ChevronRight,
} from 'lucide-react';

interface ClassOption { id: string; name: string; }

interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  category: string;
  criteria?: string;
  pointsValue: number;
  schoolId: string;
  _count?: { awards: number };
}

interface LeaderboardEntry {
  id: string;
  studentId: string;
  classId: string;
  totalPoints: number;
  level: number;
  rank: number;
  badgeCount: number;
  levelTitle: string;
}

interface StudentProfile {
  studentId: string;
  totalPoints: number;
  level: number;
  levelTitle: string;
  pointsToNextLevel: number;
  levelProgressPercent: number;
  rank?: number;
  badgeCount: number;
  badges: { id: string; badgeId: string; badge: BadgeTemplate; reason?: string; awardedAt: string }[];
  pointsHistory: { id: string; points: number; category: string; reason?: string; createdAt: string }[];
}

const categoryColors: Record<string, string> = {
  ACADEMIC: 'bg-blue-100 text-blue-700',
  ATTENDANCE: 'bg-green-100 text-green-700',
  PARTICIPATION: 'bg-purple-100 text-purple-700',
  SPORTS: 'bg-orange-100 text-orange-700',
  CONDUCT: 'bg-pink-100 text-pink-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
  HOMEWORK: 'bg-yellow-100 text-yellow-700',
  QUIZ: 'bg-indigo-100 text-indigo-700',
  EXTRA_CREDIT: 'bg-teal-100 text-teal-700',
};

const levelColors: Record<number, string> = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-green-100 text-green-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-purple-100 text-purple-700',
  5: 'bg-indigo-100 text-indigo-700',
  6: 'bg-amber-100 text-amber-700',
  7: 'bg-orange-100 text-orange-700',
  8: 'bg-red-100 text-red-700',
};

const getLevelColor = (level: number) => levelColors[Math.min(level, 8)] ?? 'bg-yellow-100 text-yellow-700';

const LevelBadge = ({ level, title }: { level: number; title: string }) => (
  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getLevelColor(level)}`}>
    Lv.{level} {title}
  </span>
);

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
};

export default function GamificationPage() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '');
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'profile' | 'award'>('leaderboard');

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<BadgeTemplate[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Award points form
  const [pointsForm, setPointsForm] = useState({ studentId: '', points: '', category: 'ACADEMIC', reason: '' });
  const [badgeForm, setBadgeForm] = useState({ studentId: '', badgeId: '', reason: '' });
  const [createBadgeForm, setCreateBadgeForm] = useState({ name: '', description: '', category: 'ACADEMIC', criteria: '', pointsValue: '', schoolId: '' });
  const [showCreateBadge, setShowCreateBadge] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState('');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    // Get school info
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    setSchoolId(user.schoolId || '');

    fetch(`${base}/classes`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    fetch(`${base}/gamification/badges?schoolId=${schoolId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setBadges(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [schoolId]);

  const fetchLeaderboard = useCallback(() => {
    if (!selectedClassId) return;
    setLeaderboardLoading(true);
    fetch(`${base}/gamification/leaderboard/${selectedClassId}?limit=20`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  }, [selectedClassId]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const fetchProfile = async (studentId: string) => {
    if (!studentId) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`${base}/gamification/profile/${studentId}`, { headers: authHeaders() });
      const data = await res.json();
      setStudentProfile(data);
    } finally { setProfileLoading(false); }
  };

  useEffect(() => {
    if (selectedStudentId) fetchProfile(selectedStudentId);
  }, [selectedStudentId]);

  const awardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${base}/gamification/points`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...pointsForm, points: parseInt(pointsForm.points) }),
    });
    if (res.ok) {
      setAwardSuccess('Points awarded successfully!');
      setPointsForm({ studentId: '', points: '', category: 'ACADEMIC', reason: '' });
      setTimeout(() => setAwardSuccess(''), 3000);
      fetchLeaderboard();
    }
  };

  const awardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${base}/gamification/badges/award`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(badgeForm),
    });
    if (res.ok) {
      setAwardSuccess('Badge awarded successfully!');
      setBadgeForm({ studentId: '', badgeId: '', reason: '' });
      setTimeout(() => setAwardSuccess(''), 3000);
      fetchLeaderboard();
    }
  };

  const createBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${base}/gamification/badges`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...createBadgeForm, pointsValue: parseInt(createBadgeForm.pointsValue || '0'), schoolId }),
    });
    if (res.ok) {
      setShowCreateBadge(false);
      setCreateBadgeForm({ name: '', description: '', category: 'ACADEMIC', criteria: '', pointsValue: '', schoolId: '' });
      // Refresh badges
      fetch(`${base}/gamification/badges?schoolId=${schoolId}`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((data) => setBadges(Array.isArray(data) ? data : []));
    }
  };

  const refreshLeaderboard = async () => {
    if (!selectedClassId) return;
    setRefreshing(true);
    try {
      await fetch(`${base}/gamification/leaderboard/${selectedClassId}/refresh`, {
        method: 'POST', headers: authHeaders(),
      });
      fetchLeaderboard();
    } finally { setRefreshing(false); }
  };

  const tabs = [
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { key: 'badges', label: 'Badges', icon: Award },
    { key: 'profile', label: 'Student Profile', icon: Users },
    { key: 'award', label: 'Award', icon: Zap },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Trophy className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gamification</h1>
          <p className="text-sm text-gray-500">Badges, points, leaderboards, and levels</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-white shadow text-yellow-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selectedClassId && (
              <button
                onClick={refreshLeaderboard}
                disabled={refreshing}
                className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <BarChart2 className="w-4 h-4" />
                {refreshing ? 'Refreshing...' : 'Refresh Rankings'}
              </button>
            )}
          </div>

          {leaderboardLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : !selectedClassId ? (
            <div className="text-center py-16 text-gray-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a class to view leaderboard</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No leaderboard data yet. Award points to students!</p>
            </div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden">
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-4 p-6 bg-gradient-to-b from-yellow-50 to-white">
                  {/* 2nd place */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                      {leaderboard[1]?.studentId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs font-medium text-gray-600">{leaderboard[1]?.levelTitle}</div>
                    <div className="text-sm font-bold text-gray-800">{leaderboard[1]?.totalPoints} pts</div>
                    <div className="w-16 h-16 bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <span className="text-2xl font-black text-gray-500">2</span>
                    </div>
                  </div>
                  {/* 1st place */}
                  <div className="flex flex-col items-center">
                    <Crown className="w-6 h-6 text-yellow-500 mb-1" />
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                      {leaderboard[0]?.studentId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs font-medium text-yellow-700">{leaderboard[0]?.levelTitle}</div>
                    <div className="text-sm font-bold text-gray-800">{leaderboard[0]?.totalPoints} pts</div>
                    <div className="w-16 h-24 bg-yellow-200 rounded-t-lg flex items-center justify-center">
                      <span className="text-3xl font-black text-yellow-600">1</span>
                    </div>
                  </div>
                  {/* 3rd place */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                      {leaderboard[2]?.studentId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs font-medium text-gray-600">{leaderboard[2]?.levelTitle}</div>
                    <div className="text-sm font-bold text-gray-800">{leaderboard[2]?.totalPoints} pts</div>
                    <div className="w-16 h-12 bg-amber-100 rounded-t-lg flex items-center justify-center">
                      <span className="text-2xl font-black text-amber-600">3</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Full List */}
              <div className="divide-y">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setSelectedStudentId(entry.studentId); setActiveTab('profile'); }}
                  >
                    <div className="flex items-center justify-center w-8">
                      <RankIcon rank={entry.rank} />
                    </div>
                    <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {entry.studentId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800 truncate">{entry.studentId.slice(0, 12)}...</span>
                        <LevelBadge level={entry.level} title={entry.levelTitle} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Points</div>
                        <div className="text-sm font-bold text-gray-900">{entry.totalPoints}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Badges</div>
                        <div className="text-sm font-bold text-purple-600">{entry.badgeCount}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateBadge(true)}
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Badge
            </button>
          </div>

          {badges.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No badges yet. Create your first badge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      {badge.iconUrl ? (
                        <img src={badge.iconUrl} alt={badge.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <Award className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{badge.name}</h3>
                      {badge.description && <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[badge.category] || 'bg-gray-100 text-gray-600'}`}>
                          {badge.category}
                        </span>
                        {badge.pointsValue > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" /> +{badge.pointsValue} pts
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{badge._count?.awards ?? 0} awarded</span>
                      </div>
                      {badge.criteria && (
                        <p className="text-xs text-gray-400 mt-1 italic">{badge.criteria}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Badge Modal */}
          {showCreateBadge && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">Create Badge</h2>
                  <button onClick={() => setShowCreateBadge(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={createBadge} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input required value={createBadgeForm.name} onChange={(e) => setCreateBadgeForm((f) => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Badge name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input value={createBadgeForm.description} onChange={(e) => setCreateBadgeForm((f) => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="What is this badge for?" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select value={createBadgeForm.category} onChange={(e) => setCreateBadgeForm((f) => ({ ...f, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                        {['ACADEMIC', 'ATTENDANCE', 'PARTICIPATION', 'SPORTS', 'CONDUCT', 'CUSTOM'].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points Value</label>
                      <input type="number" value={createBadgeForm.pointsValue} onChange={(e) => setCreateBadgeForm((f) => ({ ...f, pointsValue: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Criteria</label>
                    <textarea value={createBadgeForm.criteria} onChange={(e) => setCreateBadgeForm((f) => ({ ...f, criteria: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="How to earn this badge..." />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateBadge(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="flex-1 bg-yellow-500 text-white rounded-lg py-2 text-sm hover:bg-yellow-600">Create Badge</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <div className="flex gap-3">
              <input
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                placeholder="Enter student ID"
              />
              <button onClick={() => fetchProfile(selectedStudentId)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                Load
              </button>
            </div>
          </div>

          {profileLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : studentProfile ? (
            <div className="space-y-4">
              {/* Level Card */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-indigo-200 text-sm">Student</p>
                    <h3 className="text-xl font-bold">{studentProfile.studentId.slice(0, 12)}...</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black">{studentProfile.totalPoints}</div>
                    <div className="text-indigo-200 text-sm">Total Points</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                    Level {studentProfile.level} — {studentProfile.levelTitle}
                  </span>
                  {studentProfile.rank && (
                    <span className="bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full">
                      Rank #{studentProfile.rank}
                    </span>
                  )}
                </div>
                {/* Progress bar to next level */}
                <div>
                  <div className="flex justify-between text-xs text-indigo-200 mb-1">
                    <span>Level {studentProfile.level}</span>
                    <span>{studentProfile.pointsToNextLevel} pts to Level {studentProfile.level + 1}</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${studentProfile.levelProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Earned Badges ({studentProfile.badgeCount})</h3>
                </div>
                {studentProfile.badges.length === 0 ? (
                  <p className="text-sm text-gray-400">No badges earned yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {studentProfile.badges.map((ba) => (
                      <div key={ba.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <Award className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-800">{ba.badge.name}</p>
                          {ba.reason && <p className="text-xs text-gray-400">{ba.reason}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Points History */}
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">Points History</h3>
                </div>
                <div className="space-y-2">
                  {studentProfile.pointsHistory.length === 0 ? (
                    <p className="text-sm text-gray-400">No points history</p>
                  ) : (
                    studentProfile.pointsHistory.map((ph) => (
                      <div key={ph.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ph.points > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[ph.category] || 'bg-gray-100 text-gray-600'}`}>{ph.category}</span>
                            {ph.reason && <span className="text-xs text-gray-600 truncate">{ph.reason}</span>}
                          </div>
                        </div>
                        <div className={`text-sm font-bold flex-shrink-0 ${ph.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {ph.points > 0 ? '+' : ''}{ph.points}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Enter a student ID to view their gamification profile</p>
            </div>
          )}
        </div>
      )}

      {/* Award Tab */}
      {activeTab === 'award' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Award Points */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Award Points</h3>
            </div>
            <form onSubmit={awardPoints} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input required value={pointsForm.studentId} onChange={(e) => setPointsForm((f) => ({ ...f, studentId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Student ID" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points *</label>
                  <input required type="number" min="1" value={pointsForm.points} onChange={(e) => setPointsForm((f) => ({ ...f, points: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={pointsForm.category} onChange={(e) => setPointsForm((f) => ({ ...f, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {['ACADEMIC', 'ATTENDANCE', 'PARTICIPATION', 'HOMEWORK', 'QUIZ', 'EXTRA_CREDIT'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input value={pointsForm.reason} onChange={(e) => setPointsForm((f) => ({ ...f, reason: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Excellent quiz performance" />
              </div>
              <button type="submit" className="w-full bg-yellow-500 text-white rounded-lg py-2 text-sm hover:bg-yellow-600 font-medium">
                Award Points
              </button>
            </form>
          </div>

          {/* Award Badge */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">Award Badge</h3>
            </div>
            <form onSubmit={awardBadge} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input required value={badgeForm.studentId} onChange={(e) => setBadgeForm((f) => ({ ...f, studentId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Student ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge *</label>
                <select required value={badgeForm.badgeId} onChange={(e) => setBadgeForm((f) => ({ ...f, badgeId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select a badge</option>
                  {badges.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.category}) — {b.pointsValue} pts</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input value={badgeForm.reason} onChange={(e) => setBadgeForm((f) => ({ ...f, reason: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Why are you awarding this badge?" />
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white rounded-lg py-2 text-sm hover:bg-purple-700 font-medium">
                Award Badge
              </button>
            </form>
          </div>

          {/* Level Titles Reference */}
          <div className="bg-white border rounded-xl p-6 md:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Level Titles & Points
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { level: 1, title: 'Beginner', range: '0–99 pts', color: 'bg-gray-50 border-gray-200' },
                { level: 2, title: 'Explorer', range: '100–299 pts', color: 'bg-green-50 border-green-200' },
                { level: 4, title: 'Scholar', range: '300–499 pts', color: 'bg-blue-50 border-blue-200' },
                { level: 6, title: 'Expert', range: '500–799 pts', color: 'bg-purple-50 border-purple-200' },
                { level: 9, title: 'Master', range: '800+ pts', color: 'bg-yellow-50 border-yellow-200' },
              ].map(({ level, title, range, color }) => (
                <div key={level} className={`border rounded-lg p-3 text-center ${color}`}>
                  <div className="text-2xl mb-1">
                    {level === 1 ? '🌱' : level === 2 ? '🌿' : level === 4 ? '📚' : level === 6 ? '⭐' : '👑'}
                  </div>
                  <LevelBadge level={level} title={title} />
                  <p className="text-xs text-gray-400 mt-1">{range}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {awardSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
          <Zap className="w-4 h-4" />
          {awardSuccess}
        </div>
      )}
    </div>
  );
}

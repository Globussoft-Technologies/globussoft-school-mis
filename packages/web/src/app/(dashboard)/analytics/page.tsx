'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Users } from 'lucide-react';

interface ClassItem { id: string; name: string; }

interface ClassAnalytics {
  classAverage?: number;
  topScore?: number;
  atRiskCount?: number;
  complianceScore?: number;
  gradeDistribution?: Record<string, number>;
  weakAreas?: Array<{ subjectName: string; averageScore: number; studentsBelow60: number }>;
  totalStudents?: number;
  attendanceRate?: number;
}

export default function AnalyticsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    fetch('/api/v1/classes', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setAnalytics(null); return; }
    setLoading(true);
    setError('');
    fetch(`/api/v1/analytics/class/${selectedClassId}`, { headers: headers() })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(data => { setAnalytics(data); setLoading(false); })
      .catch(err => { setError(`Failed to load analytics: ${err.message}`); setLoading(false); });
  }, [selectedClassId]);

  const stats = [
    {
      label: 'Class Average',
      value: analytics?.classAverage != null ? `${analytics.classAverage.toFixed(1)}%` : '--',
      icon: BarChart3,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      label: 'Top Score',
      value: analytics?.topScore != null ? `${analytics.topScore.toFixed(1)}%` : '--',
      icon: TrendingUp,
      bg: 'bg-green-50',
      color: 'text-green-600',
    },
    {
      label: 'At-Risk Students',
      value: analytics?.atRiskCount != null ? String(analytics.atRiskCount) : '--',
      icon: AlertTriangle,
      bg: 'bg-red-50',
      color: 'text-red-600',
    },
    {
      label: 'Compliance Score',
      value: analytics?.complianceScore != null ? `${analytics.complianceScore.toFixed(1)}%` : '--',
      icon: Users,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
    },
  ];

  const gradeEntries = analytics?.gradeDistribution
    ? Object.entries(analytics.gradeDistribution).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const maxGradeCount = gradeEntries.reduce((m, [, v]) => Math.max(m, v), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Performance Analytics</h1>

      {/* Class Selector */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <label className="block text-sm font-medium mb-1">Select Class</label>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="w-full max-w-xs border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Select a class to view analytics</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-lg border p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${loading ? 'text-muted-foreground' : ''}`}>
                  {loading ? '...' : s.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade Distribution */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4">Grade Distribution</h2>
            {gradeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grade distribution data.</p>
            ) : (
              <div className="space-y-3">
                {gradeEntries.map(([grade, count]) => (
                  <div key={grade} className="flex items-center gap-3">
                    <span className="text-sm font-bold w-8">{grade}</span>
                    <div className="flex-1 bg-muted rounded-full h-4">
                      <div
                        className="bg-primary h-4 rounded-full"
                        style={{ width: maxGradeCount > 0 ? `${(count / maxGradeCount) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
            {analytics.totalStudents != null && (
              <p className="text-xs text-muted-foreground mt-4">Total students: {analytics.totalStudents}</p>
            )}
          </div>

          {/* Weak Area Interventions */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4">Weak Area Interventions</h2>
            {!analytics.weakAreas || analytics.weakAreas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No students flagged for intervention at this time.
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.weakAreas.map(area => (
                  <div key={area.subjectName} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{area.subjectName}</p>
                      <p className="text-xs text-muted-foreground">Avg: {area.averageScore.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                        {area.studentsBelow60} below 60%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {analytics.attendanceRate != null && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attendance Rate</span>
                  <span className={`font-bold text-sm ${analytics.attendanceRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.attendanceRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedClassId && !loading && (
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground text-sm">
          Select a class above to view performance analytics.
        </div>
      )}
    </div>
  );
}

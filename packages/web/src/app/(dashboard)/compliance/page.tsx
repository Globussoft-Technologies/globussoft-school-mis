'use client';

import { useEffect, useState } from 'react';

interface ClassItem { id: string; name: string; }

interface ComplianceReport {
  subjectName: string;
  totalTopics: number;
  deliveredTopics: number;
  completionPercent: number;
}

interface Delivery {
  id: string;
  subjectName: string;
  topicName: string;
  teacherName: string;
  deliveredAt: string;
  classId?: string;
  className?: string;
}

export default function CompliancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    fetch('/api/v1/classes', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
    // Load recent deliveries on mount
    fetch('/api/v1/compliance/deliveries', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setDeliveries(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setReports([]); return; }
    setLoading(true);
    fetch(`/api/v1/compliance/report?classId=${selectedClassId}`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setReports(Array.isArray(data) ? data : data.subjects ?? data.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedClassId]);

  const overallPct = reports.length > 0
    ? Math.round(reports.reduce((s, r) => s + r.completionPercent, 0) / reports.length)
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Teaching Compliance</h1>

      {/* Class Selector */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select class to view report</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {reports.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Overall: <span className={`font-bold ${overallPct >= 90 ? 'text-green-600' : overallPct >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{overallPct}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Syllabus Coverage */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Syllabus Coverage</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !selectedClassId ? (
            <p className="text-sm text-muted-foreground">Select a class to view coverage.</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No compliance data for this class.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div key={r.subjectName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.subjectName}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.deliveredTopics}/{r.totalTopics} topics
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          r.completionPercent >= 90 ? 'bg-green-500' :
                          r.completionPercent >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(r.completionPercent, 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold w-10 text-right ${
                      r.completionPercent >= 90 ? 'text-green-600' :
                      r.completionPercent >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{r.completionPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deliveries */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Recent Deliveries</h2>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No delivery logs found.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {deliveries.slice(0, 20).map(d => (
                <div key={d.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{d.topicName}</p>
                    <p className="text-xs text-muted-foreground">{d.subjectName} · {d.teacherName}</p>
                    {d.className && <p className="text-xs text-muted-foreground">{d.className}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {new Date(d.deliveredAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

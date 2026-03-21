'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';

interface ClassItem { id: string; name: string; }
interface Section { id: string; name: string; }

interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  term?: string;
  status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PUBLISHED' | string;
  publishedAt?: string;
  totalMarks?: number;
  percentage?: number;
  grade?: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  GENERATED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  GENERATED: 'Ready for Review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
};

export default function ReportCardsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState('TERM_1');
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    fetch('/api/v1/classes', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setSections([]); setSelectedSectionId(''); return; }
    fetch(`/api/v1/sections?classId=${selectedClassId}`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(setSections)
      .catch(() => {});
    setSelectedSectionId('');
  }, [selectedClassId]);

  async function loadReportCard() {
    if (!selectedStudentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/report-cards/student/${selectedStudentId}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setReportCards(Array.isArray(data) ? data : [data]);
      } else {
        setError(`Failed to load report cards (${res.status})`);
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedStudentId) loadReportCard();
  }, [selectedStudentId]);

  async function handleGenerate() {
    if (!selectedClassId) { setError('Select a class first.'); return; }
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/v1/report-cards/generate', {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId, sectionId: selectedSectionId || undefined, term }),
      });
      if (res.ok) {
        const data = await res.json();
        setReportCards(Array.isArray(data) ? data : data.reportCards ?? []);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Report Cards</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Generate Report Cards */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Generate Report Cards</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section (optional)</label>
              <select
                value={selectedSectionId}
                onChange={e => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">All sections</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Term</label>
              <select
                value={term}
                onChange={e => setTerm(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="TERM_1">Term 1</option>
                <option value="TERM_2">Term 2</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedClassId}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm w-full disabled:opacity-60"
            >
              {generating ? 'Generating...' : 'Generate Report Cards'}
            </button>
          </div>
        </div>

        {/* View by Student */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4">View Student Report Card</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                placeholder="Enter student ID"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={loadReportCard}
              disabled={!selectedStudentId || loading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm w-full disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Load Report Card'}
            </button>
          </div>

          {/* Publication Status Legend */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Status Guide</h3>
            <div className="space-y-2">
              {Object.entries(statusLabels).map(([key, label]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">{label}</span>
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[key]}`}>{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards List */}
      {reportCards.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Report Cards ({reportCards.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Class</th>
                  <th className="text-left px-4 py-3 font-medium">Term</th>
                  <th className="text-right px-4 py-3 font-medium">Marks</th>
                  <th className="text-right px-4 py-3 font-medium">Percentage</th>
                  <th className="text-center px-4 py-3 font-medium">Grade</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {reportCards.map(rc => (
                  <tr key={rc.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{rc.studentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rc.className ?? '--'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rc.term ?? '--'}</td>
                    <td className="px-4 py-3 text-right">{rc.totalMarks ?? '--'}</td>
                    <td className="px-4 py-3 text-right">
                      {rc.percentage != null ? `${rc.percentage.toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rc.grade ? (
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">{rc.grade}</span>
                      ) : '--'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[rc.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {statusLabels[rc.status] ?? rc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline mx-auto">
                        <Download className="h-3 w-3" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportCards.length === 0 && !loading && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Generate report cards or search by student ID to view them here.</p>
        </div>
      )}
    </div>
  );
}

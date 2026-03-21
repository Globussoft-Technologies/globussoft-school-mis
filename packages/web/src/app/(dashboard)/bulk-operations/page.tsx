'use client';

import { useEffect, useState, useCallback } from 'react';
import { Upload, Download, FileJson, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  grade: string;
}

interface SectionItem {
  id: string;
  name: string;
  classId: string;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

interface ImportResult {
  imported: number;
  errors: string[];
}

const STUDENT_TEMPLATE = [
  {
    admissionNo: 'STU-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@school.edu',
    classGrade: '10',
    sectionName: 'A',
    dateOfBirth: '2008-05-15',
    gender: 'MALE',
  },
  {
    admissionNo: 'STU-002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@school.edu',
    classGrade: '10',
    sectionName: 'B',
    dateOfBirth: '2008-07-22',
    gender: 'FEMALE',
  },
];

const PAYMENT_TEMPLATE = [
  {
    studentAdmissionNo: 'STU-001',
    feeHeadName: 'Tuition Fee',
    amount: 5000,
    method: 'CASH',
    receiptNo: 'RCP-2024-001',
    date: '2024-04-01',
  },
  {
    studentAdmissionNo: 'STU-002',
    feeHeadName: 'Lab Fee',
    amount: 1000,
    method: 'ONLINE',
    receiptNo: 'RCP-2024-002',
    date: '2024-04-02',
  },
];

function downloadJson(data: unknown[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = String(row[h] ?? '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkOperationsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Import state
  const [importType, setImportType] = useState<'students' | 'payments'>('students');
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  // Export state
  const [exportType, setExportType] = useState<'students' | 'attendance' | 'grades'>('students');
  const [exportClassId, setExportClassId] = useState('');
  const [exportSectionId, setExportSectionId] = useState('');
  const [exportSubjectId, setExportSubjectId] = useState('');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportPreview, setExportPreview] = useState<Record<string, unknown>[] | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? '' : '';

  const loadMeta = useCallback(async () => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [clsRes, subjRes] = await Promise.all([
        fetch('/api/v1/classes', { headers }),
        fetch('/api/v1/subjects', { headers }),
      ]);
      if (clsRes.ok) {
        const d = await clsRes.json();
        setClasses(Array.isArray(d) ? d : d.data ?? []);
      }
      if (subjRes.ok) {
        const d = await subjRes.json();
        setSubjects(Array.isArray(d) ? d : d.data ?? []);
      }
    } catch {}
  }, []);

  const loadSections = useCallback(async (classId: string) => {
    if (!classId) { setSections([]); return; }
    const token = getToken();
    try {
      const res = await fetch(`/api/v1/sections?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSections(Array.isArray(d) ? d : d.data ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadSections(exportClassId);
    setExportSectionId('');
  }, [exportClassId, loadSections]);

  async function handleImport() {
    setImportError('');
    setImportResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(importJson.trim());
    } catch {
      setImportError('Invalid JSON. Please check your input.');
      return;
    }

    const list = Array.isArray(parsed) ? parsed : [parsed];
    if (list.length === 0) {
      setImportError('No data to import.');
      return;
    }

    setImporting(true);
    try {
      const token = getToken();
      const body = importType === 'students'
        ? { students: list }
        : { payments: list };

      const res = await fetch(`/api/v1/bulk/import/${importType === 'students' ? 'students' : 'payments'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data: ImportResult = await res.json();
        setImportResult(data);
        if (data.imported > 0) setImportJson('');
      } else {
        const data = await res.json().catch(() => ({}));
        setImportError(data?.message ?? `Server error ${res.status}`);
      }
    } catch {
      setImportError('Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    setExportError('');
    setExportPreview(null);

    const token = getToken();
    let url = '';

    if (exportType === 'students') {
      const params = new URLSearchParams();
      if (exportClassId) params.set('classId', exportClassId);
      if (exportSectionId) params.set('sectionId', exportSectionId);
      url = `/api/v1/bulk/export/students?${params}`;
    } else if (exportType === 'attendance') {
      if (!exportClassId || !exportStartDate || !exportEndDate) {
        setExportError('Class, start date, and end date are required for attendance export.');
        return;
      }
      const params = new URLSearchParams({ classId: exportClassId, startDate: exportStartDate, endDate: exportEndDate });
      if (exportSectionId) params.set('sectionId', exportSectionId);
      url = `/api/v1/bulk/export/attendance?${params}`;
    } else if (exportType === 'grades') {
      if (!exportClassId) {
        setExportError('Class is required for grades export.');
        return;
      }
      const params = new URLSearchParams({ classId: exportClassId });
      if (exportSubjectId) params.set('subjectId', exportSubjectId);
      url = `/api/v1/bulk/export/grades?${params}`;
    }

    setExporting(true);
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: Record<string, unknown>[] = await res.json();
        setExportPreview(data);

        const filename = `${exportType}-export-${new Date().toISOString().split('T')[0]}`;
        if (exportFormat === 'json') {
          downloadJson(data, `${filename}.json`);
        } else {
          downloadCsv(data, `${filename}.csv`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setExportError(data?.message ?? `Server error ${res.status}`);
      }
    } catch {
      setExportError('Network error. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportJson((ev.target?.result as string) ?? '');
    };
    reader.readAsText(file);
  }

  const currentTemplate = importType === 'students' ? STUDENT_TEMPLATE : PAYMENT_TEMPLATE;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Upload className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Bulk Operations</h1>
          <p className="text-sm text-muted-foreground">Import and export data in bulk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── IMPORT ─────────────────────────────────────────── */}
        <div className="bg-card rounded-lg border">
          <div className="p-5 border-b flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Import Data</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Type selector */}
            <div>
              <p className="text-sm font-medium mb-2">Import Type</p>
              <div className="flex gap-4">
                {(['students', 'payments'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value={t}
                      checked={importType === t}
                      onChange={() => { setImportType(t); setImportResult(null); setImportError(''); }}
                      className="accent-primary"
                    />
                    <span className="text-sm capitalize">{t === 'payments' ? 'Fee Payments' : 'Students'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="text-sm font-medium block mb-1">Upload JSON File</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:text-sm file:bg-muted file:cursor-pointer"
              />
            </div>

            {/* JSON textarea */}
            <div>
              <label className="text-sm font-medium block mb-1">Or Paste JSON Data</label>
              <textarea
                rows={8}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={`Paste a JSON array here...\n[\n  { "admissionNo": "...", ... }\n]`}
                className="w-full border rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
            </div>

            {/* Error / Result */}
            {importError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Import Complete
                </div>
                <p className="text-green-800">Successfully imported: <strong>{importResult.imported}</strong> records</p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-700 font-medium">Errors ({importResult.errors.length}):</p>
                    <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <li key={i} className="text-red-600 text-xs">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importing || !importJson.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import'}
            </button>

            {/* Sample template */}
            <div className="border rounded-md overflow-hidden">
              <button
                onClick={() => setShowTemplate((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 text-sm font-medium hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  Sample JSON Template
                </div>
                {showTemplate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showTemplate && (
                <div className="relative">
                  <pre className="p-3 text-xs font-mono bg-muted/30 overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(currentTemplate, null, 2)}
                  </pre>
                  <button
                    onClick={() => setImportJson(JSON.stringify(currentTemplate, null, 2))}
                    className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded"
                  >
                    Use Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── EXPORT ─────────────────────────────────────────── */}
        <div className="bg-card rounded-lg border">
          <div className="p-5 border-b flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Export Data</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Export type */}
            <div>
              <p className="text-sm font-medium mb-2">Export Type</p>
              <div className="flex flex-wrap gap-4">
                {(['students', 'attendance', 'grades'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportType"
                      value={t}
                      checked={exportType === t}
                      onChange={() => { setExportType(t); setExportPreview(null); setExportError(''); }}
                      className="accent-primary"
                    />
                    <span className="text-sm capitalize">{t === 'attendance' ? 'Attendance' : t === 'grades' ? 'Grades' : 'Students'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-sm font-medium mb-2">Download Format</p>
              <div className="flex gap-4">
                {(['csv', 'json'] as const).map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value={f}
                      checked={exportFormat === f}
                      onChange={() => setExportFormat(f)}
                      className="accent-primary"
                    />
                    <span className="text-sm uppercase">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Class {exportType !== 'students' && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={exportClassId}
                  onChange={(e) => setExportClassId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.grade} - {c.name}</option>
                  ))}
                </select>
              </div>

              {exportType !== 'grades' && (
                <div>
                  <label className="text-sm font-medium block mb-1">Section</label>
                  <select
                    value={exportSectionId}
                    onChange={(e) => setExportSectionId(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={!exportClassId}
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {exportType === 'grades' && (
                <div>
                  <label className="text-sm font-medium block mb-1">Subject</label>
                  <select
                    value={exportSubjectId}
                    onChange={(e) => setExportSubjectId(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">All Subjects</option>
                    {subjects
                      .filter((s) => !exportClassId || s.classId === exportClassId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date range for attendance */}
            {exportType === 'attendance' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            {/* Export error */}
            {exportError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
            </button>

            {/* Preview */}
            {exportPreview && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span>Preview (first 5 rows of {exportPreview.length} total)</span>
                  <span className="text-xs text-muted-foreground font-normal">Total: {exportPreview.length} records</span>
                </p>
                {exportPreview.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded">No records found for the selected filters.</p>
                ) : (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          {Object.keys(exportPreview[0]).map((col) => (
                            <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exportPreview.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                                {String(val ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

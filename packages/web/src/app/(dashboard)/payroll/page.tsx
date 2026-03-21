'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wallet, Plus, CheckCircle, DollarSign, X, Settings, ChevronDown } from 'lucide-react';

interface PayrollRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  approvedBy?: string;
  paidAt?: string;
  remarks?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface SalaryStructure {
  id: string;
  role: string;
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  pf: number;
  tax: number;
}

interface Summary {
  month: number;
  year: number;
  totalRecords: number;
  totalPayroll: number;
  approvedPayroll: number;
  paidPayroll: number;
  draftPayroll: number;
  countByStatus: { DRAFT: number; APPROVED: number; PAID: number };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
};

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const staffRoles = [
  'SUPER_ADMIN','ADMIN','IT_ADMIN','DIRECTOR','ACADEMIC_COORDINATOR',
  'CLASS_TEACHER','SUBJECT_TEACHER','ACCOUNTANT','TRANSPORT_MANAGER','HOBBY_COORDINATOR',
];

export default function PayrollPage() {
  const now = new Date();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'payroll' | 'structures'>('payroll');

  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState('');

  const [showGenerate, setShowGenerate] = useState(false);
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [genForm, setGenForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });

  const [structureForm, setStructureForm] = useState({
    role: 'CLASS_TEACHER', basicSalary: '', hra: '', da: '', ta: '', pf: '', tax: '',
  });

  const base = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.set('month', filterMonth);
      if (filterYear) params.set('year', filterYear);
      if (filterStatus) params.set('status', filterStatus);

      const [recRes, strRes, sumRes] = await Promise.all([
        fetch(`${base}/payroll?${params}`, { headers }),
        fetch(`${base}/payroll/structures`, { headers }),
        fetch(`${base}/payroll/summary?month=${filterMonth}&year=${filterYear}`, { headers }),
      ]);
      if (recRes.ok) setRecords(await recRes.json());
      if (strRes.ok) setStructures(await strRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch {}
    setLoading(false);
  }, [base, filterMonth, filterYear, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function generatePayroll() {
    setSaving(true);
    try {
      const res = await fetch(`${base}/payroll/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ month: parseInt(genForm.month, 10), year: parseInt(genForm.year, 10) }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Generated ${data.created} payroll records. Skipped ${data.skipped}.`);
        setShowGenerate(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to generate payroll');
      }
    } catch {}
    setSaving(false);
  }

  async function approveRecord(id: string) {
    try {
      const res = await fetch(`${base}/payroll/${id}/approve`, { method: 'PATCH', headers });
      if (res.ok) fetchData();
    } catch {}
  }

  async function markPaid(id: string) {
    try {
      const res = await fetch(`${base}/payroll/${id}/pay`, { method: 'PATCH', headers });
      if (res.ok) fetchData();
    } catch {}
  }

  async function saveStructure() {
    setSaving(true);
    try {
      const res = await fetch(`${base}/payroll/structures`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          role: structureForm.role,
          basicSalary: parseFloat(structureForm.basicSalary) || 0,
          hra: parseFloat(structureForm.hra) || 0,
          da: parseFloat(structureForm.da) || 0,
          ta: parseFloat(structureForm.ta) || 0,
          pf: parseFloat(structureForm.pf) || 0,
          tax: parseFloat(structureForm.tax) || 0,
        }),
      });
      if (res.ok) {
        setShowStructureForm(false);
        setStructureForm({ role: 'CLASS_TEACHER', basicSalary: '', hra: '', da: '', ta: '', pf: '', tax: '' });
        fetchData();
      }
    } catch {}
    setSaving(false);
  }

  function editStructure(s: SalaryStructure) {
    setStructureForm({
      role: s.role,
      basicSalary: String(s.basicSalary),
      hra: String(s.hra),
      da: String(s.da),
      ta: String(s.ta),
      pf: String(s.pf),
      tax: String(s.tax),
    });
    setShowStructureForm(true);
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Staff Payroll</h1>
            <p className="text-sm text-muted-foreground">Manage monthly payroll and salary structures</p>
          </div>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Generate Monthly Payroll
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Payroll</p>
            <p className="text-xl font-bold mt-1">{fmt(summary.totalPayroll)}</p>
            <p className="text-xs text-muted-foreground">{summary.totalRecords} staff</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Draft</p>
            <p className="text-xl font-bold mt-1 text-gray-600">{fmt(summary.draftPayroll)}</p>
            <p className="text-xs text-muted-foreground">{summary.countByStatus.DRAFT} records</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-xl font-bold mt-1 text-blue-600">{fmt(summary.approvedPayroll)}</p>
            <p className="text-xs text-muted-foreground">{summary.countByStatus.APPROVED} records</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-xl font-bold mt-1 text-green-600">{fmt(summary.paidPayroll)}</p>
            <p className="text-xs text-muted-foreground">{summary.countByStatus.PAID} records</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab('payroll')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'payroll' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Payroll Records
        </button>
        <button
          onClick={() => setTab('structures')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'structures' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="h-4 w-4 inline mr-1" /> Salary Structures
        </button>
      </div>

      {tab === 'payroll' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm"
            >
              {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm"
            >
              {[2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading payroll...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No payroll records for this period. Generate payroll to get started.
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Staff</th>
                    <th className="text-left px-4 py-3 font-semibold">Role</th>
                    <th className="text-right px-4 py-3 font-semibold">Basic</th>
                    <th className="text-right px-4 py-3 font-semibold">Allowances</th>
                    <th className="text-right px-4 py-3 font-semibold">Deductions</th>
                    <th className="text-right px-4 py-3 font-semibold">Net</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                    <th className="text-center px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {r.user ? `${r.user.firstName} ${r.user.lastName}` : r.userId.slice(0, 8) + '…'}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.user?.role?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(r.basicSalary)}</td>
                      <td className="px-4 py-3 text-right text-green-600">+{fmt(r.allowances)}</td>
                      <td className="px-4 py-3 text-right text-red-600">-{fmt(r.deductions)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmt(r.netSalary)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[r.status] ?? 'bg-gray-100'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.status === 'DRAFT' && (
                            <button
                              onClick={() => approveRecord(r.id)}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                            >
                              Approve
                            </button>
                          )}
                          {r.status === 'APPROVED' && (
                            <button
                              onClick={() => markPaid(r.id)}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                            >
                              Mark Paid
                            </button>
                          )}
                          {r.status === 'PAID' && (
                            <span className="text-xs text-muted-foreground">
                              {r.paidAt ? new Date(r.paidAt).toLocaleDateString() : 'Paid'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'structures' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowStructureForm(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted"
            >
              <Plus className="h-4 w-4" /> Add / Update Structure
            </button>
          </div>
          {structures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No salary structures defined yet.
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Role</th>
                    <th className="text-right px-4 py-3 font-semibold">Basic</th>
                    <th className="text-right px-4 py-3 font-semibold">HRA</th>
                    <th className="text-right px-4 py-3 font-semibold">DA</th>
                    <th className="text-right px-4 py-3 font-semibold">TA</th>
                    <th className="text-right px-4 py-3 font-semibold">PF</th>
                    <th className="text-right px-4 py-3 font-semibold">Tax</th>
                    <th className="text-right px-4 py-3 font-semibold">Net</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {structures.map((s) => {
                    const net = s.basicSalary + s.hra + s.da + s.ta - s.pf - s.tax;
                    return (
                      <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{s.role.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-right">{fmt(s.basicSalary)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{fmt(s.hra)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{fmt(s.da)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{fmt(s.ta)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{fmt(s.pf)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{fmt(s.tax)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{fmt(net)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => editStructure(s)}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Generate Monthly Payroll</h2>
              <button onClick={() => setShowGenerate(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                This will create payroll records for all staff based on their salary structures.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Month</label>
                  <select
                    value={genForm.month}
                    onChange={(e) => setGenForm({ ...genForm, month: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Year</label>
                  <select
                    value={genForm.year}
                    onChange={(e) => setGenForm({ ...genForm, year: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {[2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowGenerate(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button
                  onClick={generatePayroll}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
                >
                  {saving ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Structure Form Modal */}
      {showStructureForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Salary Structure</h2>
              <button onClick={() => setShowStructureForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Role *</label>
                <select
                  value={structureForm.role}
                  onChange={(e) => setStructureForm({ ...structureForm, role: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {staffRoles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Basic Salary (₹) *</label>
                <input
                  type="number" min="0"
                  value={structureForm.basicSalary}
                  onChange={(e) => setStructureForm({ ...structureForm, basicSalary: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="30000"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['hra', 'da', 'ta'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium block mb-1">{field.toUpperCase()} (₹)</label>
                    <input
                      type="number" min="0"
                      value={structureForm[field]}
                      onChange={(e) => setStructureForm({ ...structureForm, [field]: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['pf', 'tax'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium block mb-1">{field.toUpperCase()} Deduction (₹)</label>
                    <input
                      type="number" min="0"
                      value={structureForm[field]}
                      onChange={(e) => setStructureForm({ ...structureForm, [field]: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowStructureForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button
                  onClick={saveStructure}
                  disabled={saving || !structureForm.basicSalary}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Structure'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

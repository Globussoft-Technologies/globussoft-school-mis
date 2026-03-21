'use client';

import { useEffect, useState } from 'react';
import { Receipt, Plus, X, CheckCircle, Ban, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface TransportBill {
  id: string;
  studentId: string;
  routeId: string;
  month: number;
  year: number;
  amount: number;
  status: string;
  paidAt?: string;
  receiptNo?: string;
  remarks?: string;
  createdAt: string;
}

interface MonthlyReport {
  month: number;
  year: number;
  totalBilled: number;
  collected: number;
  waived: number;
  pending: number;
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  waivedCount: number;
  routeBreakdown: { routeId: string; total: number; paid: number; pending: number; count: number }[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  WAIVED: 'bg-gray-100 text-gray-500',
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TransportBillingPage() {
  const now = new Date();
  const [bills, setBills] = useState<TransportBill[]>([]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(now.getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPayModal, setShowPayModal] = useState<TransportBill | null>(null);
  const [showWaiveModal, setShowWaiveModal] = useState<TransportBill | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [genForm, setGenForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: 1500,
  });
  const [payForm, setPayForm] = useState({ receiptNo: '' });
  const [waiveForm, setWaiveForm] = useState({ remarks: '' });

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  async function loadBills() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('month', monthFilter.toString());
      params.set('year', yearFilter.toString());
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${base}/transport-billing?${params}`, { headers: getHeaders() });
      if (res.ok) setBills(await res.json());
    } catch {}
    setLoading(false);
  }

  async function loadReport() {
    try {
      const res = await fetch(`${base}/transport-billing/report?month=${monthFilter}&year=${yearFilter}`, { headers: getHeaders() });
      if (res.ok) setReport(await res.json());
    } catch {}
  }

  useEffect(() => {
    loadBills();
    loadReport();
  }, [monthFilter, yearFilter, statusFilter]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch(`${base}/transport-billing/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(genForm),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Generated ${data.generated} bill(s) for ${monthNames[genForm.month - 1]} ${genForm.year}`);
        setShowGenerate(false);
        setMonthFilter(genForm.month);
        setYearFilter(genForm.year);
        loadBills();
        loadReport();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to generate bills');
      }
    } catch { alert('Network error'); }
    setGenerating(false);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!showPayModal) return;
    setSaving(true);
    try {
      const res = await fetch(`${base}/transport-billing/${showPayModal.id}/pay`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ receiptNo: payForm.receiptNo || undefined }),
      });
      if (res.ok) {
        setShowPayModal(null);
        setPayForm({ receiptNo: '' });
        loadBills();
        loadReport();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to record payment');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleWaive(e: React.FormEvent) {
    e.preventDefault();
    if (!showWaiveModal) return;
    setSaving(true);
    try {
      const res = await fetch(`${base}/transport-billing/${showWaiveModal.id}/waive`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ remarks: waiveForm.remarks || undefined }),
      });
      if (res.ok) {
        setShowWaiveModal(null);
        setWaiveForm({ remarks: '' });
        loadBills();
        loadReport();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to waive bill');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN');
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Transport Billing</h1>
            <p className="text-sm text-muted-foreground">Monthly bus fee billing and collection</p>
          </div>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Generate Monthly Bills
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={monthFilter} onChange={(e) => setMonthFilter(parseInt(e.target.value, 10))}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          {monthNames.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(parseInt(e.target.value, 10))}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="WAIVED">Waived</option>
        </select>
      </div>

      {/* Report Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">Total Billed</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(report.totalBilled)}</div>
            <div className="text-xs text-muted-foreground mt-1">{report.totalStudents} students</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground font-medium">Collected</span>
            </div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(report.collected)}</div>
            <div className="text-xs text-muted-foreground mt-1">{report.paidCount} paid</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground font-medium">Pending</span>
            </div>
            <div className="text-xl font-bold text-yellow-600">{formatCurrency(report.pending)}</div>
            <div className="text-xs text-muted-foreground mt-1">{report.pendingCount} pending</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-muted-foreground font-medium">Waived</span>
            </div>
            <div className="text-xl font-bold text-gray-500">{formatCurrency(report.waived)}</div>
            <div className="text-xs text-muted-foreground mt-1">{report.waivedCount} waived</div>
          </div>
        </div>
      )}

      {/* Bills Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="px-4 py-3 bg-muted/30 border-b">
          <span className="text-sm font-semibold">
            Bills — {monthNames[monthFilter - 1]} {yearFilter}
          </span>
          <span className="text-xs text-muted-foreground ml-2">({bills.length} records)</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Student ID</th>
              <th className="text-left px-4 py-3 font-medium">Route</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Paid At</th>
              <th className="text-left px-4 py-3 font-medium">Receipt No.</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No billing records for {monthNames[monthFilter - 1]} {yearFilter}.
                  <br />
                  <button onClick={() => setShowGenerate(true)} className="mt-2 text-primary text-sm hover:underline">
                    Generate bills now
                  </button>
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{bill.studentId}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{bill.routeId}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(bill.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[bill.status] || 'bg-gray-100 text-gray-700'}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(bill.paidAt)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{bill.receiptNo || '—'}</td>
                  <td className="px-4 py-3">
                    {bill.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setShowPayModal(bill); setPayForm({ receiptNo: '' }); }}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3" /> Pay
                        </button>
                        <button
                          onClick={() => { setShowWaiveModal(bill); setWaiveForm({ remarks: '' }); }}
                          className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-muted text-gray-600"
                        >
                          <Ban className="h-3 w-3" /> Waive
                        </button>
                      </div>
                    )}
                    {bill.status !== 'PENDING' && (
                      <span className="text-xs text-muted-foreground italic">{bill.status === 'PAID' ? 'Paid' : 'Waived'}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Generate Monthly Bills</h2>
              <button onClick={() => setShowGenerate(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                This will create billing records for all students with active bus assignments.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <select value={genForm.month} onChange={(e) => setGenForm({ ...genForm, month: parseInt(e.target.value, 10) })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {monthNames.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <select value={genForm.year} onChange={(e) => setGenForm({ ...genForm, year: parseInt(e.target.value, 10) })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Amount per Student (₹)</label>
                  <input type="number" min="1" value={genForm.amount} onChange={(e) => setGenForm({ ...genForm, amount: parseFloat(e.target.value) })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={generating}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate Bills'}
                </button>
                <button type="button" onClick={() => setShowGenerate(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowPayModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-sm font-medium">Student: {showPayModal.studentId}</div>
                <div className="text-lg font-bold text-green-600 mt-1">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(showPayModal.amount)}</div>
                <div className="text-xs text-muted-foreground">{monthNames[showPayModal.month - 1]} {showPayModal.year}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receipt Number</label>
                <input type="text" value={payForm.receiptNo} onChange={(e) => setPayForm({ receiptNo: e.target.value })}
                  placeholder="Auto-generated if blank"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Recording...' : 'Mark as Paid'}
                </button>
                <button type="button" onClick={() => setShowPayModal(null)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Modal */}
      {showWaiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Waive Bill</h2>
              <button onClick={() => setShowWaiveModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleWaive} className="p-6 space-y-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-sm font-medium">Student: {showWaiveModal.studentId}</div>
                <div className="text-lg font-bold mt-1">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(showWaiveModal.amount)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Waiver</label>
                <input type="text" value={waiveForm.remarks} onChange={(e) => setWaiveForm({ remarks: e.target.value })}
                  placeholder="Reason (optional)"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
                  {saving ? 'Waiving...' : 'Waive Bill'}
                </button>
                <button type="button" onClick={() => setShowWaiveModal(null)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

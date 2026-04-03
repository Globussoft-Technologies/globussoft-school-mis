'use client';

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, AlertTriangle, TrendingDown, DollarSign, Phone, X, Plus } from 'lucide-react';

interface FeeHead {
  id: string;
  name: string;
  class: string | { name: string };
  amount: number;
  frequency: string;
}

interface Payment {
  id: string;
  studentName: string;
  class: string;
  amount: number;
  feeHead: string;
  paidAt: string;
  mode: string;
}

interface Defaulter {
  id: string;
  studentName: string;
  class: string;
  outstanding: number;
  months: number;
  callStatus: string;
}

const callStatusColors: Record<string, string> = {
  NOT_CALLED: 'bg-gray-100 text-gray-700',
  CALLED: 'bg-blue-100 text-blue-700',
  PROMISED: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
};

const EMPTY_PAYMENT_FORM = {
  studentId: '',
  feeHeadId: '',
  amount: '',
  paidAmount: '',
  method: 'CASH',
  receiptNo: '',
  transactionId: '',
};

export default function FeesPage() {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [stats, setStats] = useState({
    totalCollections: 0,
    outstanding: 0,
    defaultersCount: 0,
    todaysCollection: 0,
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const load = useCallback(async () => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [fhRes, dfRes] = await Promise.all([
        fetch('/api/v1/fees/heads', { headers }),
        fetch('/api/v1/fees/defaulters', { headers }),
      ]);
      if (fhRes.ok) {
        const data = await fhRes.json();
        setFeeHeads(Array.isArray(data) ? data : data.data ?? []);
      }
      if (dfRes.ok) {
        const data = await dfRes.json();
        const list: Defaulter[] = Array.isArray(data) ? data : data.data ?? [];
        setDefaulters(list);
        setStats(prev => ({ ...prev, defaultersCount: list.length }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handlePaymentChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = getToken();
      const payload: Record<string, string | number> = {
        studentId: paymentForm.studentId,
        feeHeadId: paymentForm.feeHeadId,
        amount: Number(paymentForm.amount),
        paidAmount: Number(paymentForm.paidAmount),
        method: paymentForm.method,
        receiptNo: paymentForm.receiptNo,
      };
      if (paymentForm.transactionId) payload.transactionId = paymentForm.transactionId;

      const res = await fetch('/api/v1/fees/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowPaymentForm(false);
        setPaymentForm(EMPTY_PAYMENT_FORM);
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <button
          onClick={() => { setShowPaymentForm((v) => !v); setError(''); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm"
        >
          {showPaymentForm ? <X className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
          {showPaymentForm ? 'Cancel' : 'Record Payment'}
        </button>
      </div>

      {/* Record Payment Form */}
      {showPaymentForm && (
        <div className="bg-card rounded-lg border p-6 mb-6 animate-in slide-in-from-top-2">
          <h2 className="text-lg font-semibold mb-4">Record Fee Payment</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handlePaymentSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student ID *</label>
                <input
                  required
                  name="studentId"
                  value={paymentForm.studentId}
                  onChange={handlePaymentChange}
                  placeholder="Student ID"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fee Head *</label>
                <select
                  required
                  name="feeHeadId"
                  value={paymentForm.feeHeadId}
                  onChange={handlePaymentChange}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select fee head</option>
                  {feeHeads.map((fh) => (
                    <option key={fh.id} value={fh.id}>{fh.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentChange}
                  placeholder="0"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Paid Amount (₹) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  name="paidAmount"
                  value={paymentForm.paidAmount}
                  onChange={handlePaymentChange}
                  placeholder="0"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  name="method"
                  value={paymentForm.method}
                  onChange={handlePaymentChange}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receipt No *</label>
                <input
                  required
                  name="receiptNo"
                  value={paymentForm.receiptNo}
                  onChange={handlePaymentChange}
                  placeholder="RCP-2024-001"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID</label>
                <input
                  name="transactionId"
                  value={paymentForm.transactionId}
                  onChange={handlePaymentChange}
                  placeholder="Optional"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowPaymentForm(false); setError(''); setPaymentForm(EMPTY_PAYMENT_FORM); }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-60"
              >
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Collections</p>
            <p className="text-xl font-bold">
              {stats.totalCollections > 0 ? `₹${stats.totalCollections.toLocaleString()}` : '--'}
            </p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-xl font-bold">
              {stats.outstanding > 0 ? `₹${stats.outstanding.toLocaleString()}` : '--'}
            </p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-50">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Defaulters</p>
            <p className="text-xl font-bold">{stats.defaultersCount || '--'}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Today's Collection</p>
            <p className="text-xl font-bold">
              {stats.todaysCollection > 0 ? `₹${stats.todaysCollection.toLocaleString()}` : '--'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fee Heads Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Fee Heads</h2>
          </div>
          {feeHeads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No fee heads configured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Name</th>
                    <th className="text-left px-4 py-2 font-medium">Class</th>
                    <th className="text-right px-4 py-2 font-medium">Amount</th>
                    <th className="text-left px-4 py-2 font-medium">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {feeHeads.map((fh) => (
                    <tr key={fh.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2">{fh.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{typeof fh.class === "object" ? fh.class?.name : fh.class}</td>
                      <td className="px-4 py-2 text-right font-medium">₹{fh.amount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-muted-foreground">{fh.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Payments</h2>
          </div>
          {payments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Student</th>
                    <th className="text-left px-4 py-2 font-medium">Fee Head</th>
                    <th className="text-right px-4 py-2 font-medium">Amount</th>
                    <th className="text-left px-4 py-2 font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <p className="font-medium">{p.studentName}</p>
                        <p className="text-xs text-muted-foreground">{typeof p.class === "object" ? p.class?.name : p.class}</p>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{typeof p.feeHead === "object" ? p.feeHead?.name : p.feeHead}</td>
                      <td className="px-4 py-2 text-right font-medium text-green-600">₹{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-muted-foreground">{p.mode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Defaulter List */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Defaulter List</h2>
        </div>
        {defaulters.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No defaulters found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Student</th>
                  <th className="text-left px-4 py-2 font-medium">Class</th>
                  <th className="text-right px-4 py-2 font-medium">Outstanding</th>
                  <th className="text-center px-4 py-2 font-medium">Months Due</th>
                  <th className="text-center px-4 py-2 font-medium">Call Status</th>
                  <th className="text-center px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{d.studentName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{typeof d.class === "object" ? d.class?.name : d.class}</td>
                    <td className="px-4 py-2 text-right font-medium text-red-600">₹{d.outstanding.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">{d.months}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${callStatusColors[d.callStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {d.callStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline mx-auto">
                        <Phone className="h-3 w-3" /> Call
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  X,
  Check,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Filter,
  Receipt,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  vendor?: string;
  invoiceNo?: string;
  description?: string;
  status: string;
  approvedBy?: string;
  paidBy?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month?: number;
  year: number;
}

interface Summary {
  total: number;
  approved: number;
  pending: number;
  breakdown: { category: string; actual: number; budget: number; variance: number }[];
  month: number;
  year: number;
}

const CATEGORIES = [
  'SALARY', 'MAINTENANCE', 'UTILITIES', 'SUPPLIES',
  'TRANSPORT', 'EVENTS', 'INFRASTRUCTURE', 'OTHER',
];

const STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'];

const CATEGORY_COLORS: Record<string, string> = {
  SALARY: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  UTILITIES: 'bg-yellow-100 text-yellow-800',
  SUPPLIES: 'bg-green-100 text-green-800',
  TRANSPORT: 'bg-indigo-100 text-indigo-800',
  EVENTS: 'bg-pink-100 text-pink-800',
  INFRASTRUCTURE: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-700',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const CATEGORY_BAR_COLORS: Record<string, string> = {
  SALARY: 'bg-blue-500',
  MAINTENANCE: 'bg-orange-500',
  UTILITIES: 'bg-yellow-500',
  SUPPLIES: 'bg-green-500',
  TRANSPORT: 'bg-indigo-500',
  EVENTS: 'bg-pink-500',
  INFRASTRUCTURE: 'bg-purple-500',
  OTHER: 'bg-gray-500',
};

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const EMPTY_FORM = {
  title: '',
  category: 'SUPPLIES',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  invoiceNo: '',
  description: '',
};

const EMPTY_BUDGET_FORM = {
  category: 'SALARY',
  amount: '',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [budgetForm, setBudgetForm] = useState(EMPTY_BUDGET_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'budget'>('list');
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());

  const fetchExpenses = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (filterStatus) params.set('status', filterStatus);
    if (filterStart) params.set('startDate', filterStart);
    if (filterEnd) params.set('endDate', filterEnd);
    const res = await fetch(`${API}/expenses?${params}`, { headers: authHeaders() });
    if (res.ok) setExpenses(await res.json());
  }, [filterCategory, filterStatus, filterStart, filterEnd]);

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`${API}/expenses/summary?month=${summaryMonth}&year=${summaryYear}`, {
      headers: authHeaders(),
    });
    if (res.ok) setSummary(await res.json());
  }, [summaryMonth, summaryYear]);

  const fetchBudgets = useCallback(async () => {
    const res = await fetch(`${API}/expenses/budgets?year=${summaryYear}`, { headers: authHeaders() });
    if (res.ok) setBudgets(await res.json());
  }, [summaryYear]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchExpenses(), fetchSummary(), fetchBudgets()]);
      setLoading(false);
    }
    load();
  }, [fetchExpenses, fetchSummary, fetchBudgets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/expenses`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        await fetchExpenses();
        await fetchSummary();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/expenses/budgets`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          category: budgetForm.category,
          amount: parseFloat(budgetForm.amount),
          month: budgetForm.month ? parseInt(budgetForm.month) : undefined,
          year: parseInt(budgetForm.year),
        }),
      });
      if (res.ok) {
        setShowBudgetForm(false);
        setBudgetForm(EMPTY_BUDGET_FORM);
        await fetchBudgets();
        await fetchSummary();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(id: string) {
    await fetch(`${API}/expenses/${id}/approve`, { method: 'PATCH', headers: authHeaders() });
    await fetchExpenses();
    await fetchSummary();
  }

  async function handlePay(id: string) {
    await fetch(`${API}/expenses/${id}/pay`, { method: 'PATCH', headers: authHeaders() });
    await fetchExpenses();
    await fetchSummary();
  }

  async function handleReject(id: string) {
    await fetch(`${API}/expenses/${id}/reject`, { method: 'PATCH', headers: authHeaders() });
    await fetchExpenses();
    await fetchSummary();
  }

  const totalExpenses = expenses.reduce((s, e) => s + (e.status !== 'REJECTED' ? e.amount : 0), 0);
  const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED' || e.status === 'PAID').reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING').reduce((s, e) => s + e.amount, 0);
  const thisMonthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === summaryMonth - 1 && d.getFullYear() === summaryYear;
    })
    .reduce((s, e) => s + (e.status !== 'REJECTED' ? e.amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Expense Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track, approve, and manage school expenses and budgets
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBudgetForm(true)}
            className="px-4 py-2 border rounded-md text-sm hover:bg-muted flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Set Budget
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-md">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved / Paid</p>
              <p className="text-xl font-bold">{formatCurrency(approvedExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-md">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
              <p className="text-xl font-bold">{formatCurrency(pendingExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-md">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-xl font-bold">{formatCurrency(thisMonthExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['list', 'budget'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'list' ? 'Expense List' : 'Budget vs Actual'}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                placeholder="Start Date"
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                placeholder="End Date"
                className="border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>

          {/* Expense Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No expenses found
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{expense.title}</div>
                          {expense.invoiceNo && (
                            <div className="text-xs text-muted-foreground">#{expense.invoiceNo}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[expense.category] ?? 'bg-gray-100 text-gray-700'}`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{expense.vendor ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[expense.status] ?? 'bg-gray-100'}`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {expense.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(expense.id)}
                                  className="p-1 rounded hover:bg-green-100 text-green-600"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(expense.id)}
                                  className="p-1 rounded hover:bg-red-100 text-red-600"
                                  title="Reject"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {expense.status === 'APPROVED' && (
                              <button
                                onClick={() => handlePay(expense.id)}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-4">
          {/* Month/Year selector for summary */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Period:</label>
            <select
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(parseInt(e.target.value))}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={summaryYear}
              onChange={(e) => setSummaryYear(parseInt(e.target.value))}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Budget vs Actual progress bars */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-base">Budget vs Actual Spending</h3>
            {summary?.breakdown.map((item) => {
              const pct = item.budget > 0 ? Math.min((item.actual / item.budget) * 100, 100) : 0;
              const overBudget = item.actual > item.budget && item.budget > 0;
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.category}</span>
                    <span className={overBudget ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                      {formatCurrency(item.actual)} / {item.budget > 0 ? formatCurrency(item.budget) : 'No budget set'}
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : CATEGORY_BAR_COLORS[item.category] ?? 'bg-gray-400'}`}
                      style={{ width: item.budget > 0 ? `${pct}%` : '0%' }}
                    />
                  </div>
                  {item.budget > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {overBudget
                        ? `Over budget by ${formatCurrency(Math.abs(item.variance))}`
                        : `${formatCurrency(item.variance)} remaining`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Budgets list */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Configured Budgets ({summaryYear})</h3>
            </div>
            {budgets.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No budgets set for {summaryYear}. Click &quot;Set Budget&quot; to add one.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Budget Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => (
                    <tr key={b.id} className="border-t">
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[b.category] ?? 'bg-gray-100'}`}>
                          {b.category}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {b.month ? new Date(2000, b.month - 1).toLocaleString('en', { month: 'long' }) : 'Annual'}
                      </td>
                      <td className="px-4 py-2 font-semibold">{formatCurrency(b.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add New Expense</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="e.g. Staff Salaries March 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <input
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Vendor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice No.</label>
                  <input
                    value={form.invoiceNo}
                    onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="INV-2026-001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  rows={3}
                  placeholder="Expense details..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Set Budget</h2>
              <button onClick={() => setShowBudgetForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBudgetSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  required
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Budget Amount (₹) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Month (optional)</label>
                  <select
                    value={budgetForm.month}
                    onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Annual</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year *</label>
                  <select
                    required
                    value={budgetForm.year}
                    onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

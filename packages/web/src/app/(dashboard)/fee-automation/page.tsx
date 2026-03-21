'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  DollarSign,
  Bell,
  Clock,
  RefreshCw,
  Send,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ClassBreakdown {
  className: string;
  count: number;
  total: number;
}

interface TopDefaulter {
  id: string;
  studentName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  feeHeadName: string;
  amountDue: number;
  daysOverdue: number;
  callAttempts: number;
  lastCallAt: string | null;
  status: string;
}

interface Summary {
  totalOutstanding: number;
  totalDefaulters: number;
  remindersToday: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  classBreakdown: ClassBreakdown[];
  topDefaulters: TopDefaulter[];
}

interface ActionResult {
  type: 'success' | 'error';
  message: string;
}

export default function FeeAutomationPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? '' : '';

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/fee-automation/summary', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data: Summary = await res.json();
        setSummary(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function handleAction(action: 'check-defaulters' | 'send-reminders') {
    setActionLoading(action);
    setActionResult(null);
    try {
      const res = await fetch(`/api/v1/fee-automation/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (action === 'check-defaulters') {
          setActionResult({
            type: 'success',
            message: `Defaulter check complete. Created: ${data.created}, Skipped: ${data.skipped}`,
          });
        } else {
          setActionResult({
            type: 'success',
            message: `Reminders sent to ${data.remindersGenerated} defaulters.`,
          });
        }
        await loadSummary();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionResult({ type: 'error', message: data?.message ?? `Error ${res.status}` });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendReminder(defaulterId: string) {
    setReminderLoading(defaulterId);
    try {
      const res = await fetch(`/api/v1/fee-automation/remind/${defaulterId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        await loadSummary();
      }
    } catch {}
    setReminderLoading(null);
  }

  const summaryCards = summary
    ? [
        {
          label: 'Total Outstanding',
          value: `₹${summary.totalOutstanding.toLocaleString()}`,
          icon: DollarSign,
          color: 'text-red-600',
          bg: 'bg-red-50',
        },
        {
          label: 'Total Defaulters',
          value: summary.totalDefaulters.toString(),
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
        },
        {
          label: 'Reminders Sent Today',
          value: summary.remindersToday.toString(),
          icon: Bell,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          label: 'Overdue > 30 Days',
          value: summary.overdue30.toString(),
          icon: Clock,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Fee Automation</h1>
            <p className="text-sm text-muted-foreground">Manage defaulters and automated reminders</p>
          </div>
        </div>
        <button
          onClick={loadSummary}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Action Feedback */}
      {actionResult && (
        <div className={`flex items-start gap-2 p-4 rounded-lg border mb-4 text-sm ${
          actionResult.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionResult.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{actionResult.message}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => handleAction('check-defaulters')}
          disabled={!!actionLoading}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          {actionLoading === 'check-defaulters' ? 'Running...' : 'Run Defaulter Check'}
        </button>
        <button
          onClick={() => handleAction('send-reminders')}
          disabled={!!actionLoading}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {actionLoading === 'send-reminders' ? 'Sending...' : 'Send Bulk Reminders'}
        </button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-7 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-card rounded-lg border p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overdue Buckets */}
      {summary && (
        <div className="bg-card rounded-lg border p-4 mb-6">
          <h3 className="font-semibold mb-3">Overdue Breakdown</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-sm">&gt; 30 days: <strong>{summary.overdue30}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
              <span className="text-sm">&gt; 60 days: <strong>{summary.overdue60}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">&gt; 90 days: <strong>{summary.overdue90}</strong></span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Class-wise Breakdown */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Class-wise Defaulter Breakdown</h2>
          </div>
          {!summary || summary.classBreakdown.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {loading ? 'Loading...' : 'No active defaulters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Class</th>
                    <th className="text-center px-4 py-2 font-medium">Defaulters</th>
                    <th className="text-right px-4 py-2 font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.classBreakdown.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{row.className}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                          {row.count}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-red-600">
                        ₹{row.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top 10 Defaulters */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Top 10 Defaulters by Amount</h2>
          </div>
          {!summary || summary.topDefaulters.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {loading ? 'Loading...' : 'No active defaulters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">#</th>
                    <th className="text-left px-4 py-2 font-medium">Student</th>
                    <th className="text-right px-4 py-2 font-medium">Amount</th>
                    <th className="text-center px-4 py-2 font-medium">Days</th>
                    <th className="text-center px-4 py-2 font-medium">Attempts</th>
                    <th className="text-center px-4 py-2 font-medium">Remind</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topDefaulters.map((d, i) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium">{d.studentName}</p>
                        <p className="text-xs text-muted-foreground">{d.admissionNo} · {d.className}</p>
                        <p className="text-xs text-muted-foreground">{d.feeHeadName}</p>
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-red-600">
                        ₹{d.amountDue.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          d.daysOverdue > 90
                            ? 'bg-red-100 text-red-700'
                            : d.daysOverdue > 60
                            ? 'bg-orange-100 text-orange-700'
                            : d.daysOverdue > 30
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {d.daysOverdue}d
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center text-muted-foreground">
                        {d.callAttempts}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleSendReminder(d.id)}
                          disabled={reminderLoading === d.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                          <Bell className="h-3 w-3" />
                          {reminderLoading === d.id ? '...' : 'Remind'}
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
    </div>
  );
}

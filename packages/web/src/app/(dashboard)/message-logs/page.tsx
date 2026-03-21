'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mail, RefreshCw, CheckCircle, XCircle, Clock, Send } from 'lucide-react';

interface MessageLog {
  id: string;
  type: string;
  recipient: string;
  recipientName?: string;
  subject?: string;
  content: string;
  status: string;
  provider?: string;
  providerRef?: string;
  sentAt?: string;
  deliveredAt?: string;
  failReason?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  queued: number;
  byType: { type: string; count: number }[];
}

const typeColors: Record<string, string> = {
  SMS: 'bg-green-100 text-green-700',
  EMAIL: 'bg-blue-100 text-blue-700',
  WHATSAPP: 'bg-teal-100 text-teal-700',
  PUSH: 'bg-purple-100 text-purple-700',
};

const statusColors: Record<string, string> = {
  QUEUED: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  BOUNCED: 'bg-orange-100 text-orange-700',
};

const API = '/api/v1';

export default function MessageLogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const headers = { Authorization: `Bearer ${getToken()}` };
      const [logsRes, statsRes] = await Promise.all([
        fetch(`${API}/message-logs?${params}`, { headers }),
        fetch(`${API}/message-logs/stats`, { headers }),
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {}
    finally { setLoading(false); }
  }, [typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await fetch(`${API}/message-logs/${id}/retry`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      load();
    } catch {}
    finally { setRetrying(null); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mail className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Message Logs</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage all outgoing messages across channels</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Total Sent</span>
            </div>
            <p className="text-2xl font-bold">{stats.sent + stats.delivered}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Delivered</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Queued</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.queued}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Types</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="PUSH">Push</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Statuses</option>
          <option value="QUEUED">Queued</option>
          <option value="SENT">Sent</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="BOUNCED">Bounced</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background"
          placeholder="Start date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background"
          placeholder="End date"
        />
        <span className="text-sm text-muted-foreground ml-auto">{logs.length} message(s)</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Recipient</th>
              <th className="text-left px-4 py-3 font-medium">Subject</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Timestamp</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No messages found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[log.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{log.recipientName || log.recipient}</div>
                    {log.recipientName && <div className="text-xs text-muted-foreground">{log.recipient}</div>}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={log.subject || log.content}>
                    {log.subject || log.content.substring(0, 50) + (log.content.length > 50 ? '...' : '')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[log.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {log.status}
                    </span>
                    {log.failReason && (
                      <p className="text-xs text-red-600 mt-0.5 truncate max-w-[100px]" title={log.failReason}>
                        {log.failReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.provider || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {log.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(log.id)}
                        disabled={retrying === log.id}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50 ml-auto disabled:opacity-60"
                      >
                        <RefreshCw className={`h-3 w-3 ${retrying === log.id ? 'animate-spin' : ''}`} />
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

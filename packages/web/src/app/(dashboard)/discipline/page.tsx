'use client';

import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Flag } from 'lucide-react';

interface Incident {
  id: string;
  studentName: string;
  class: string;
  type: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS';
  status: string;
  date: string;
  description?: string;
}

interface RedFlag {
  id: string;
  studentName: string;
  class: string;
  reason: string;
  raisedAt: string;
  raisedBy: string;
}

const severityColors: Record<string, string> = {
  MINOR: 'bg-yellow-100 text-yellow-700',
  MODERATE: 'bg-orange-100 text-orange-700',
  SERIOUS: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  ESCALATED: 'bg-red-100 text-red-700',
};

export default function DisciplinePage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };

    async function load() {
      try {
        const [incRes, rfRes] = await Promise.all([
          fetch('/api/v1/discipline/incidents', { headers }),
          fetch('/api/v1/discipline/red-flags', { headers }),
        ]);
        if (incRes.ok) {
          const data = await incRes.json();
          setIncidents(Array.isArray(data) ? data : data.data ?? []);
        }
        if (rfRes.ok) {
          const data = await rfRes.json();
          setRedFlags(Array.isArray(data) ? data : data.data ?? []);
        }
      } catch {}
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Discipline</h1>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          <Shield className="h-4 w-4" /> Log Incident
        </button>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-50">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Minor Incidents</p>
            <p className="text-xl font-bold">{incidents.filter((i) => i.severity === 'MINOR').length || '--'}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Moderate Incidents</p>
            <p className="text-xl font-bold">{incidents.filter((i) => i.severity === 'MODERATE').length || '--'}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <Flag className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Red Flags</p>
            <p className="text-xl font-bold">{redFlags.length || '--'}</p>
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-card rounded-lg border mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Incidents</h2>
        </div>
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No incidents recorded. Great discipline!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Student</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-center px-4 py-2 font-medium">Severity</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <p className="font-medium">{inc.studentName}</p>
                      <p className="text-xs text-muted-foreground">{inc.class}</p>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{inc.type}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${severityColors[inc.severity] || 'bg-gray-100 text-gray-700'}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[inc.status] || 'bg-gray-100 text-gray-700'}`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(inc.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Red Flags */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center gap-2">
          <Flag className="h-4 w-4 text-red-600" />
          <h2 className="font-semibold">Active Red Flags</h2>
        </div>
        {redFlags.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No active red flags at the moment.
          </div>
        ) : (
          <div className="divide-y">
            {redFlags.map((rf) => (
              <div key={rf.id} className="p-4 hover:bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{rf.studentName}</p>
                    <p className="text-xs text-muted-foreground">{rf.class}</p>
                    <p className="text-sm mt-1">{rf.reason}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(rf.raisedAt).toLocaleDateString()}</p>
                    <p>by {rf.raisedBy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

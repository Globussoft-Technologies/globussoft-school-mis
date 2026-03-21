'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, BookOpen, CreditCard, Bus, Bell, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

interface TestScore {
  id: string;
  subject: string;
  testName: string;
  score: number;
  maxScore: number;
  date: string;
  grade: string;
}

interface FeeStatus {
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  nextDueDate?: string;
}

interface PortalNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

export default function ParentPortalPage() {
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [wardName, setWardName] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };
    const base = process.env.NEXT_PUBLIC_API_URL;

    async function load() {
      try {
        const [attRes, scRes, feeRes, notifRes, profileRes] = await Promise.all([
          fetch(`${base}/parent-portal/attendance`, { headers }),
          fetch(`${base}/parent-portal/test-scores`, { headers }),
          fetch(`${base}/parent-portal/fees`, { headers }),
          fetch(`${base}/parent-portal/notifications`, { headers }),
          fetch(`${base}/parent-portal/profile`, { headers }),
        ]);
        if (attRes.ok) setAttendance(await attRes.json());
        if (scRes.ok) setScores(await scRes.json());
        if (feeRes.ok) setFeeStatus(await feeRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setWardName(profile.wardName || '');
        }
      } catch {}
    }
    load();
  }, []);

  const attendancePct = attendance?.percentage ?? 0;
  const attendanceColor =
    attendancePct >= 75 ? 'text-green-600' : attendancePct >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Parent Portal</h1>
        {wardName && <p className="text-muted-foreground mt-1">Ward: {wardName}</p>}
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Attendance */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium">Attendance</p>
          </div>
          {attendance ? (
            <>
              <p className={`text-2xl font-bold ${attendanceColor}`}>{attendancePct.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {attendance.presentDays} present / {attendance.totalDays} days
              </p>
            </>
          ) : (
            <p className="text-xl font-bold text-muted-foreground">--</p>
          )}
        </div>

        {/* Recent Score Average */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm font-medium">Avg. Score</p>
          </div>
          {scores.length > 0 ? (
            <>
              <p className="text-2xl font-bold">
                {(scores.reduce((acc, s) => acc + (s.score / s.maxScore) * 100, 0) / scores.length).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Based on {scores.length} recent tests</p>
            </>
          ) : (
            <p className="text-xl font-bold text-muted-foreground">--</p>
          )}
        </div>

        {/* Fee Status */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm font-medium">Fee Status</p>
          </div>
          {feeStatus ? (
            <>
              <p className={`text-2xl font-bold ${feeStatus.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {feeStatus.outstanding > 0 ? `₹${feeStatus.outstanding.toLocaleString()} due` : 'Paid'}
              </p>
              {feeStatus.nextDueDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(feeStatus.nextDueDate).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-xl font-bold text-muted-foreground">--</p>
          )}
        </div>

        {/* Unread Notifications */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-yellow-50">
              <Bell className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-sm font-medium">Notifications</p>
          </div>
          <p className="text-2xl font-bold">{notifications.filter((n) => !n.isRead).length}</p>
          <p className="text-xs text-muted-foreground mt-1">unread</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Test Scores */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <h2 className="font-semibold">Recent Test Scores</h2>
          </div>
          {scores.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No test results available.</div>
          ) : (
            <div className="divide-y">
              {scores.slice(0, 6).map((s) => {
                const pct = Math.round((s.score / s.maxScore) * 100);
                return (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.testName}</p>
                      <p className="text-xs text-muted-foreground">{s.subject} · {new Date(s.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{s.score}/{s.maxScore}</p>
                      <p className={`text-xs ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {pct}% · {s.grade}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b flex items-center gap-2">
            <Bell className="h-4 w-4 text-yellow-600" />
            <h2 className="font-semibold">Recent Notifications</h2>
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No notifications yet.</div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 6).map((n) => (
                <div key={n.id} className={`px-4 py-3 ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bus Tracking Link */}
      <div className="bg-card rounded-lg border p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50">
            <Bus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">Bus Tracking</p>
            <p className="text-sm text-muted-foreground">Track your ward's school bus in real-time.</p>
          </div>
        </div>
        <Link
          href="/bus"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          Track Now
        </Link>
      </div>
    </div>
  );
}

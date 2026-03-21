'use client';

import { useEffect, useState } from 'react';
import { UserCheck, CheckCircle, XCircle, Clock, CalendarOff, FileText } from 'lucide-react';

interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

interface LeaveApplication {
  id: string;
  applicantId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700',
  ABSENT: 'bg-red-100 text-red-700',
  LATE: 'bg-yellow-100 text-yellow-700',
  HALF_DAY: 'bg-orange-100 text-orange-700',
  ON_LEAVE: 'bg-blue-100 text-blue-700',
};

const leaveStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function TeacherAttendancePage() {
  const today = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>('');
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function loadAttendance(date: string) {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`${base}/teacher-attendance/all?date=${date}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        setAttendanceRecords(await res.json());
      }
    } catch {
      // silently handle network errors
    } finally {
      setLoadingAttendance(false);
    }
  }

  async function loadLeaves(status?: string) {
    setLoadingLeaves(true);
    try {
      const params = status ? `?status=${status}` : '';
      const res = await fetch(`${base}/teacher-attendance/leaves${params}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        setLeaves(await res.json());
      }
    } catch {
      // silently handle network errors
    } finally {
      setLoadingLeaves(false);
    }
  }

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadLeaves(leaveStatusFilter);
  }, [leaveStatusFilter]);

  async function handleApproveLeave(leaveId: string, status: 'APPROVED' | 'REJECTED') {
    setApprovingId(leaveId);
    try {
      const res = await fetch(`${base}/teacher-attendance/leaves/${leaveId}/approve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadLeaves(leaveStatusFilter);
      }
    } catch {
      // silently handle network errors
    } finally {
      setApprovingId(null);
    }
  }

  const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
  const onLeaveCount = attendanceRecords.filter((r) => r.status === 'ON_LEAVE').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Teacher Attendance</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="text-xl font-bold text-green-600">{presentCount}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="text-xl font-bold text-red-600">{absentCount}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-50">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Late</p>
            <p className="text-xl font-bold text-yellow-600">{lateCount}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <CalendarOff className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On Leave</p>
            <p className="text-xl font-bold text-blue-600">{onLeaveCount}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending Leaves</p>
            <p className="text-xl font-bold text-orange-600">{pendingLeaves}</p>
          </div>
        </div>
      </div>

      {/* Today's Attendance Section */}
      <div className="bg-card rounded-lg border mb-6">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold">Daily Attendance</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loadingAttendance ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading attendance...</div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No attendance records found for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Teacher ID</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  <th className="text-center px-4 py-2 font-medium">Check In</th>
                  <th className="text-center px-4 py-2 font-medium">Check Out</th>
                  <th className="text-left px-4 py-2 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">{record.teacherId}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          statusColors[record.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground">
                      {record.checkIn || '—'}
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground">
                      {record.checkOut || '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {record.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Applications Section */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Leave Applications</h2>
          </div>
          <select
            value={leaveStatusFilter}
            onChange={(e) => setLeaveStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {loadingLeaves ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No leave applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Applicant</th>
                  <th className="text-center px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Period</th>
                  <th className="text-left px-4 py-2 font-medium">Reason</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  <th className="text-center px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => {
                  const start = new Date(leave.startDate + (leave.startDate.includes('T') ? '' : 'T00:00:00'));
                  const end = new Date(leave.endDate + (leave.endDate.includes('T') ? '' : 'T00:00:00'));
                  const days =
                    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <tr key={leave.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{leave.applicantId}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                          {leave.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        <p>{start.toLocaleDateString()} — {end.toLocaleDateString()}</p>
                        <p className="text-muted-foreground">{days} day{days !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">
                        {leave.reason}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            leaveStatusColors[leave.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {leave.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveLeave(leave.id, 'APPROVED')}
                              disabled={approvingId === leave.id}
                              className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {approvingId === leave.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleApproveLeave(leave.id, 'REJECTED')}
                              disabled={approvingId === leave.id}
                              className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {approvingId === leave.id ? '...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {leave.approvedAt
                              ? new Date(leave.approvedAt).toLocaleDateString()
                              : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

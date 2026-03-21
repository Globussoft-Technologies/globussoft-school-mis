'use client';

import { useState } from 'react';
import { Printer } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

type ReportType = 'report-card' | 'fee-receipt' | 'attendance' | 'student-profile';

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = Record<string, any> | null;

// ─── Helpers ──────────────────────────────────────────────────────

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── School Letterhead ───────────────────────────────────────────

function Letterhead({ school }: { school: SchoolInfo }) {
  return (
    <div className="text-center border-b pb-4 mb-6 print:pb-4 print:mb-6">
      {school.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={school.logoUrl} alt="School Logo" className="h-16 mx-auto mb-2" />
      )}
      <h1 className="text-xl font-bold text-gray-800">{school.name}</h1>
      {school.address && <p className="text-sm text-gray-600">{school.address}</p>}
      <div className="flex justify-center gap-4 text-xs text-gray-500 mt-1">
        {school.phone && <span>Ph: {school.phone}</span>}
        {school.email && <span>Email: {school.email}</span>}
      </div>
    </div>
  );
}

// ─── Report Renderers ─────────────────────────────────────────────

function ReportCardView({ data }: { data: ReportData }) {
  if (!data) return null;
  return (
    <div className="report-content">
      <Letterhead school={data.school} />
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold">Report Card</h2>
          <p className="text-sm text-gray-600">Term: {data.term}</p>
          <p className="text-sm text-gray-600">Academic Year: {data.academicSession?.name}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">{data.student?.firstName} {data.student?.lastName}</p>
          <p className="text-gray-600">Admission No: {data.student?.admissionNo}</p>
          <p className="text-gray-600">Class: {data.student?.class} {data.student?.section ? `- ${data.student.section}` : ''}</p>
          <p className="text-gray-600">Gender: {data.student?.gender}</p>
        </div>
      </div>

      {/* Subject Results */}
      <table className="w-full text-sm border-collapse border mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Subject</th>
            <th className="border p-2 text-center">Marks Obtained</th>
            <th className="border p-2 text-center">Max Marks</th>
            <th className="border p-2 text-center">Percentage</th>
            <th className="border p-2 text-center">Grade</th>
            <th className="border p-2 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.subjectResults?.length > 0 ? (
            data.subjectResults.map((r: Record<string, unknown>, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2">{r.subject as string}</td>
                <td className="border p-2 text-center">{r.marksObtained as number}</td>
                <td className="border p-2 text-center">{r.maxMarks as number}</td>
                <td className="border p-2 text-center">{r.percentage as number}%</td>
                <td className="border p-2 text-center font-medium">{r.grade as string}</td>
                <td className="border p-2 text-gray-600">{r.remarks as string}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="border p-4 text-center text-gray-500">No subject results available.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3 text-sm">Attendance Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Total Days:</span>
            <span>{data.attendanceSummary?.totalDays}</span>
            <span className="text-gray-600">Present:</span>
            <span>{data.attendanceSummary?.presentDays}</span>
            <span className="text-gray-600">Absent:</span>
            <span>{data.attendanceSummary?.absentDays}</span>
            <span className="text-gray-600">Percentage:</span>
            <span className="font-medium">{data.attendanceSummary?.attendancePercentage}%</span>
          </div>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3 text-sm">Overall Result</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Overall %:</span>
            <span className="font-medium">{data.overallPercentage ?? '—'}</span>
            <span className="text-gray-600">Overall Grade:</span>
            <span className="font-bold text-lg">{data.overallGrade ?? '—'}</span>
            <span className="text-gray-600">Rank:</span>
            <span>{data.rank ?? '—'}</span>
          </div>
        </div>
      </div>

      {(data.teacherRemarks || data.principalRemarks) && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {data.teacherRemarks && (
            <div className="border rounded p-3">
              <p className="font-medium mb-1">Teacher&apos;s Remarks</p>
              <p className="text-gray-700">{data.teacherRemarks}</p>
            </div>
          )}
          {data.principalRemarks && (
            <div className="border rounded p-3">
              <p className="font-medium mb-1">Principal&apos;s Remarks</p>
              <p className="text-gray-700">{data.principalRemarks}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 text-right">Generated: {formatDate(data.generatedAt)}</p>
    </div>
  );
}

function FeeReceiptView({ data }: { data: ReportData }) {
  if (!data) return null;
  return (
    <div className="report-content">
      <Letterhead school={data.school} />
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-bold">Fee Receipt</h2>
        <div className="text-right text-sm">
          <p className="font-mono font-bold">Receipt No: {data.receipt?.receiptNo}</p>
          <p className="text-gray-600">Date: {formatDate(data.receipt?.date)}</p>
          <p className="text-gray-600">Session: {data.academicSession}</p>
        </div>
      </div>

      <div className="border rounded p-4 mb-6 text-sm">
        <h3 className="font-semibold mb-2">Student Details</h3>
        <div className="grid grid-cols-2 gap-2">
          <span className="text-gray-600">Name:</span>
          <span>{data.student?.firstName} {data.student?.lastName}</span>
          <span className="text-gray-600">Admission No:</span>
          <span>{data.student?.admissionNo}</span>
          <span className="text-gray-600">Class:</span>
          <span>{data.student?.class} {data.student?.section ? `- ${data.student.section}` : ''}</span>
        </div>
      </div>

      <table className="w-full text-sm border-collapse border mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Description</th>
            <th className="border p-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">{data.receipt?.feeHead}</td>
            <td className="border p-2 text-right">{data.receipt?.amount?.toFixed(2)}</td>
          </tr>
          {data.receipt?.discount > 0 && (
            <tr>
              <td className="border p-2 text-green-700">Discount</td>
              <td className="border p-2 text-right text-green-700">- {data.receipt.discount.toFixed(2)}</td>
            </tr>
          )}
          <tr className="bg-gray-50 font-semibold">
            <td className="border p-2">Net Payable</td>
            <td className="border p-2 text-right">₹ {data.receipt?.netPayable?.toFixed(2)}</td>
          </tr>
          <tr className="font-bold">
            <td className="border p-2">Amount Paid</td>
            <td className="border p-2 text-right text-green-700">₹ {data.receipt?.paidAmount?.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Payment Method: </span>
          <span className="font-medium">{data.receipt?.method}</span>
        </div>
        {data.receipt?.transactionId && (
          <div>
            <span className="text-gray-600">Transaction ID: </span>
            <span className="font-mono">{data.receipt.transactionId}</span>
          </div>
        )}
        <div>
          <span className="text-gray-600">Status: </span>
          <span className={`font-medium ${data.receipt?.status === 'PAID' ? 'text-green-700' : 'text-yellow-700'}`}>
            {data.receipt?.status}
          </span>
        </div>
        {data.receipt?.receivedBy && (
          <div>
            <span className="text-gray-600">Received By: </span>
            <span>{data.receipt.receivedBy}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-right">Generated: {formatDate(data.generatedAt)}</p>
    </div>
  );
}

function AttendanceReportView({ data }: { data: ReportData }) {
  if (!data) return null;
  return (
    <div className="report-content">
      <Letterhead school={data.school} />
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Attendance Report</h2>
          <p className="text-sm text-gray-600">Class: {data.class?.name}</p>
          {data.period?.startDate && (
            <p className="text-sm text-gray-600">
              Period: {formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}
            </p>
          )}
        </div>
        <div className="text-right text-sm border rounded p-3">
          <p>Total Students: <strong>{data.summary?.totalStudents}</strong></p>
          <p>Avg Attendance: <strong>{data.summary?.averageAttendance}%</strong></p>
        </div>
      </div>

      <table className="w-full text-sm border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">#</th>
            <th className="border p-2 text-left">Admission No</th>
            <th className="border p-2 text-left">Student Name</th>
            <th className="border p-2 text-center">Section</th>
            <th className="border p-2 text-center">Total Days</th>
            <th className="border p-2 text-center">Present</th>
            <th className="border p-2 text-center">Absent</th>
            <th className="border p-2 text-center">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {data.students?.map((s: Record<string, unknown>, i: number) => (
            <tr key={s.studentId as string} className="hover:bg-gray-50">
              <td className="border p-2 text-center">{i + 1}</td>
              <td className="border p-2 font-mono text-xs">{s.admissionNo as string}</td>
              <td className="border p-2">{s.name as string}</td>
              <td className="border p-2 text-center">{s.section as string}</td>
              <td className="border p-2 text-center">{s.totalDays as number}</td>
              <td className="border p-2 text-center text-green-700">{s.presentDays as number}</td>
              <td className="border p-2 text-center text-red-600">{s.absentDays as number}</td>
              <td className={`border p-2 text-center font-medium ${(s.attendancePercentage as number) < 75 ? 'text-red-600' : 'text-green-700'}`}>
                {s.attendancePercentage as number}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-gray-400 mt-4 text-right">Generated: {formatDate(data.generatedAt)}</p>
    </div>
  );
}

function StudentProfileView({ data }: { data: ReportData }) {
  if (!data) return null;
  return (
    <div className="report-content">
      <Letterhead school={data.school} />
      <h2 className="text-lg font-bold mb-4">Student Profile</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3 text-sm border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Admission No:</span>
            <span className="font-mono">{data.student?.admissionNo}</span>
            <span className="text-gray-600">Full Name:</span>
            <span>{data.student?.firstName} {data.student?.lastName}</span>
            <span className="text-gray-600">Date of Birth:</span>
            <span>{formatDate(data.student?.dateOfBirth)}</span>
            <span className="text-gray-600">Gender:</span>
            <span>{data.student?.gender}</span>
            <span className="text-gray-600">Blood Group:</span>
            <span>{data.student?.bloodGroup ?? '—'}</span>
            <span className="text-gray-600">Email:</span>
            <span className="text-xs">{data.student?.email}</span>
            <span className="text-gray-600">Phone:</span>
            <span>{data.student?.phone ?? '—'}</span>
          </div>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3 text-sm border-b pb-2">Academic Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Class:</span>
            <span>{data.student?.class}</span>
            <span className="text-gray-600">Section:</span>
            <span>{data.student?.section}</span>
            <span className="text-gray-600">Roll No:</span>
            <span>{data.student?.rollNo ?? '—'}</span>
            <span className="text-gray-600">Session:</span>
            <span>{data.academicSession?.name}</span>
            <span className="text-gray-600">Status:</span>
            <span className={data.student?.isActive ? 'text-green-700' : 'text-red-600'}>
              {data.student?.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-gray-600">Joined:</span>
            <span>{formatDate(data.student?.joinedAt)}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      {data.student?.address?.line1 && (
        <div className="border rounded p-4 mb-6 text-sm">
          <h3 className="font-semibold mb-2">Address</h3>
          <p>{data.student.address.line1}</p>
          <p>{[data.student.address.city, data.student.address.state, data.student.address.pincode].filter(Boolean).join(', ')}</p>
          <p>{data.student.address.country}</p>
        </div>
      )}

      {/* Guardians */}
      {data.guardians?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">Guardians / Parents</h3>
          <table className="w-full text-sm border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Relation</th>
                <th className="border p-2 text-left">Phone</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Occupation</th>
              </tr>
            </thead>
            <tbody>
              {data.guardians.map((g: Record<string, unknown>, i: number) => (
                <tr key={i}>
                  <td className="border p-2">{g.name as string}</td>
                  <td className="border p-2">{g.relation as string}</td>
                  <td className="border p-2">{g.phone as string}</td>
                  <td className="border p-2">{(g.email as string) ?? '—'}</td>
                  <td className="border p-2">{(g.occupation as string) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4 text-sm">
          <h3 className="font-semibold mb-2">Attendance Summary (Last 30 days)</h3>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-600">Days Tracked:</span>
            <span>{data.attendanceSummary?.recentDays}</span>
            <span className="text-gray-600">Present:</span>
            <span className="text-green-700">{data.attendanceSummary?.presentDays}</span>
            <span className="text-gray-600">Absent:</span>
            <span className="text-red-600">{data.attendanceSummary?.absentDays}</span>
            <span className="text-gray-600">Percentage:</span>
            <span className="font-bold">{data.attendanceSummary?.attendancePercentage}%</span>
          </div>
        </div>

        {/* Recent Payments */}
        {data.recentPayments?.length > 0 && (
          <div className="border rounded p-4 text-sm">
            <h3 className="font-semibold mb-2">Recent Payments</h3>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="text-left">Fee Head</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p: Record<string, unknown>, i: number) => (
                  <tr key={i}>
                    <td>{(p.feeHead as Record<string, string>)?.name}</td>
                    <td className="text-right">₹{p.paidAmount as number}</td>
                    <td className={`text-center text-xs ${p.status === 'PAID' ? 'text-green-700' : 'text-yellow-700'}`}>
                      {p.status as string}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">Generated: {formatDate(data.generatedAt)}</p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('report-card');
  const [reportData, setReportData] = useState<ReportData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Report-card inputs
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState('TERM_1');

  // Fee receipt inputs
  const [paymentId, setPaymentId] = useState('');

  // Attendance inputs
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Student profile inputs
  const [profileStudentId, setProfileStudentId] = useState('');

  async function generateReport() {
    setLoading(true);
    setError('');
    setReportData(null);

    try {
      let url = '';
      switch (reportType) {
        case 'report-card':
          url = `${process.env.NEXT_PUBLIC_API_URL}/reports/report-card/${studentId}?term=${term}`;
          break;
        case 'fee-receipt':
          url = `${process.env.NEXT_PUBLIC_API_URL}/reports/fee-receipt/${paymentId}`;
          break;
        case 'attendance':
          url = `${process.env.NEXT_PUBLIC_API_URL}/reports/attendance/${classId}?${sectionId ? `sectionId=${sectionId}&` : ''}${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`;
          break;
        case 'student-profile':
          url = `${process.env.NEXT_PUBLIC_API_URL}/reports/student-profile/${profileStudentId}`;
          break;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        setReportData(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'report-card', label: 'Report Card' },
    { value: 'fee-receipt', label: 'Fee Receipt' },
    { value: 'attendance', label: 'Attendance Report' },
    { value: 'student-profile', label: 'Student Profile' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        {reportData && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        )}
      </div>

      {/* Controls — hidden when printing */}
      <div className="print:hidden">
        {/* Report type selector */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4">Select Report Type</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {reportTypes.map((rt) => (
              <button
                key={rt.value}
                onClick={() => { setReportType(rt.value); setReportData(null); setError(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === rt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Inputs per report type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportType === 'report-card' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Student ID *</label>
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student UUID"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Term *</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="TERM_1">Term 1</option>
                    <option value="TERM_2">Term 2</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </>
            )}

            {reportType === 'fee-receipt' && (
              <div>
                <label className="block text-sm font-medium mb-1">Payment ID *</label>
                <input
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="Enter payment UUID"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {reportType === 'attendance' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Class ID *</label>
                  <input
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    placeholder="Enter class UUID"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section ID (optional)</label>
                  <input
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    placeholder="Enter section UUID"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </>
            )}

            {reportType === 'student-profile' && (
              <div>
                <label className="block text-sm font-medium mb-1">Student ID *</label>
                <input
                  value={profileStudentId}
                  onChange={(e) => setProfileStudentId(e.target.value)}
                  placeholder="Enter student UUID"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Report Display Area */}
      {reportData && (
        <div
          id="report-print-area"
          className="bg-white border rounded-lg p-8 shadow-sm print:shadow-none print:border-none print:p-0"
        >
          {reportType === 'report-card' && <ReportCardView data={reportData} />}
          {reportType === 'fee-receipt' && <FeeReceiptView data={reportData} />}
          {reportType === 'attendance' && <AttendanceReportView data={reportData} />}
          {reportType === 'student-profile' && <StudentProfileView data={reportData} />}
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-print-area,
          #report-print-area * {
            visibility: visible;
          }
          #report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

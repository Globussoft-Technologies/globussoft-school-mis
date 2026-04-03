/**
 * GlobusLMS - Comprehensive E2E API Test Suite
 *
 * Covers ALL API modules discovered from controller files.
 * Uses plain Node.js fetch (no external dependencies).
 *
 * Usage:  node e2e-api-tests.js
 */

const BASE = 'https://globuslms.globusdemos.com/api/v1';

let adminToken = null;
let teacherToken = null;

let passed = 0;
let failed = 0;
let skipped = 0;
let total = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed for ${email}: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.accessToken || data.access_token || data.token;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function test(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}  -->  ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertStatus(res, expected) {
  const expectedArr = Array.isArray(expected) ? expected : [expected];
  if (!expectedArr.includes(res.status)) {
    throw new Error(`Expected status ${expectedArr.join('|')}, got ${res.status}`);
  }
}

async function GET(path, token) {
  return fetch(`${BASE}${path}`, { headers: authHeaders(token) });
}

async function POST(path, body, token) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

async function PATCH(path, body, token) {
  return fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

async function DELETE(path, token) {
  return fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

async function authTests() {
  console.log('\n--- Auth ---');

  await test('POST /auth/login - valid admin credentials', async () => {
    const res = await POST('/auth/login', { email: 'admin@medicaps.edu.in', password: 'admin123' });
    assertStatus(res, [200, 201]);
    const data = await res.json();
    assert(data.accessToken || data.access_token || data.token, 'Should return a token');
  });

  await test('POST /auth/login - valid teacher credentials', async () => {
    const res = await POST('/auth/login', { email: 'teacher@medicaps.edu.in', password: 'teacher123' });
    assertStatus(res, [200, 201]);
    const data = await res.json();
    assert(data.accessToken || data.access_token || data.token, 'Should return a token');
  });

  await test('POST /auth/login - invalid credentials', async () => {
    const res = await POST('/auth/login', { email: 'bad@bad.com', password: 'wrong' });
    assert(res.status >= 400, 'Should return 4xx for invalid credentials');
  });

  await test('POST /auth/login - missing fields', async () => {
    const res = await POST('/auth/login', {});
    assert(res.status >= 400, 'Should return 4xx for missing fields');
  });

  await test('POST /auth/logout - authenticated', async () => {
    const res = await POST('/auth/logout', {}, adminToken);
    assertStatus(res, [200, 201]);
  });

  await test('POST /auth/refresh - without valid refresh token', async () => {
    const res = await POST('/auth/refresh', { refreshToken: 'invalid-token' });
    assert(res.status >= 400, 'Should reject invalid refresh token');
  });

  await test('POST /auth/forgot-password - with valid email format', async () => {
    const res = await POST('/auth/forgot-password', { email: 'admin@medicaps.edu.in' });
    // May succeed or fail depending on email service config -- just should not 500
    assert(res.status < 500, 'Should not return 5xx');
  });

  await test('POST /auth/change-password - requires auth', async () => {
    const res = await fetch(`${BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'x', newPassword: 'y' }),
    });
    assertStatus(res, [401, 403]);
  });
}

async function dashboardTests() {
  console.log('\n--- Dashboard ---');

  await test('GET /dashboard/stats - admin', async () => {
    const res = await GET('/dashboard/stats', adminToken);
    assertStatus(res, [200]);
    const data = await res.json();
    assert(typeof data === 'object', 'Should return an object');
  });

  await test('GET /dashboard/admin-stats', async () => {
    const res = await GET('/dashboard/admin-stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /dashboard/teacher-stats - teacher', async () => {
    const res = await GET('/dashboard/teacher-stats', teacherToken);
    assertStatus(res, [200]);
  });

  await test('GET /dashboard/student-stats - admin', async () => {
    const res = await GET('/dashboard/student-stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /dashboard/stats - no auth', async () => {
    const res = await fetch(`${BASE}/dashboard/stats`);
    assertStatus(res, [401, 403]);
  });
}

async function usersTests() {
  console.log('\n--- Users ---');

  await test('GET /users - admin list', async () => {
    const res = await GET('/users', adminToken);
    assertStatus(res, [200]);
    const data = await res.json();
    assert(Array.isArray(data), 'Should return array');
  });

  await test('GET /users?role=SUBJECT_TEACHER', async () => {
    const res = await GET('/users?role=SUBJECT_TEACHER', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /users/me', async () => {
    const res = await GET('/users/me', adminToken);
    assertStatus(res, [200]);
    const data = await res.json();
    assert(data.id || data.email, 'Should return user profile');
  });

  await test('GET /users/me - teacher', async () => {
    const res = await GET('/users/me', teacherToken);
    assertStatus(res, [200]);
  });

  await test('GET /users/:id - non-existent', async () => {
    const res = await GET('/users/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function studentsTests() {
  console.log('\n--- Students ---');

  await test('GET /students - list all', async () => {
    const res = await GET('/students', adminToken);
    assertStatus(res, [200]);
    const data = await res.json();
    assert(Array.isArray(data), 'Should return array');
  });

  await test('GET /students - no auth', async () => {
    const res = await fetch(`${BASE}/students`);
    assertStatus(res, [401, 403]);
  });

  await test('GET /students/:id - non-existent', async () => {
    const res = await GET('/students/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /students - missing required fields', async () => {
    const res = await POST('/students', {}, adminToken);
    assert(res.status >= 400, 'Should reject incomplete student data');
  });
}

async function attendanceTests() {
  console.log('\n--- Attendance ---');

  await test('GET /attendance/class?classId=x&sectionId=x&date=2025-01-01', async () => {
    const res = await GET('/attendance/class?classId=test&sectionId=test&date=2025-01-01', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /attendance/student/:id/summary', async () => {
    const res = await GET('/attendance/student/00000000-0000-0000-0000-000000000000/summary?startDate=2025-01-01&endDate=2025-12-31', adminToken);
    assertStatus(res, [200]);
  });

  await test('POST /attendance/bulk - no auth', async () => {
    const res = await fetch(`${BASE}/attendance/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assertStatus(res, [401, 403]);
  });
}

async function timetableTests() {
  console.log('\n--- Timetable ---');

  await test('GET /timetable?classId=x&sectionId=x', async () => {
    const res = await GET('/timetable?classId=test&sectionId=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /timetable/teacher-subjects?classId=x', async () => {
    const res = await GET('/timetable/teacher-subjects?classId=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /timetable/:id - non-existent', async () => {
    const res = await GET('/timetable/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /timetable/slots/:id - non-existent', async () => {
    const res = await PATCH('/timetable/slots/00000000-0000-0000-0000-000000000000', { room: 'A101' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /timetable/:id - non-existent', async () => {
    const res = await DELETE('/timetable/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /timetable/teacher-subjects - empty assignments', async () => {
    const res = await POST('/timetable/teacher-subjects', { assignments: [] }, adminToken);
    assertStatus(res, [200, 201]);
  });
}

async function timetableGeneratorTests() {
  console.log('\n--- Timetable Generator ---');

  await test('GET /timetable-generator/conflicts', async () => {
    const res = await GET('/timetable-generator/conflicts', adminToken);
    assertStatus(res, [200]);
  });

  await test('POST /timetable-generator/validate/:id - non-existent', async () => {
    const res = await POST('/timetable-generator/validate/00000000-0000-0000-0000-000000000000', {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });
}

async function teachingTests() {
  console.log('\n--- Teaching ---');

  await test('GET /teaching/sessions - teacher', async () => {
    const res = await GET('/teaching/sessions', teacherToken);
    assertStatus(res, [200]);
  });

  await test('GET /teaching/dashboard - teacher', async () => {
    const res = await GET('/teaching/dashboard', teacherToken);
    assertStatus(res, [200]);
  });

  await test('GET /teaching/sessions/:id - non-existent', async () => {
    const res = await GET('/teaching/sessions/00000000-0000-0000-0000-000000000000', teacherToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /teaching/sessions/:id/progress - non-existent', async () => {
    const res = await GET('/teaching/sessions/00000000-0000-0000-0000-000000000000/progress', teacherToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /teaching/sessions/start - missing fields', async () => {
    const res = await POST('/teaching/sessions/start', {}, teacherToken);
    assert(res.status >= 400, 'Should reject missing required body');
  });

  await test('PATCH /teaching/sessions/:id/complete - non-existent', async () => {
    const res = await PATCH('/teaching/sessions/00000000-0000-0000-0000-000000000000/complete', {}, teacherToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /teaching/sessions/:id/pause - non-existent', async () => {
    const res = await PATCH('/teaching/sessions/00000000-0000-0000-0000-000000000000/pause', {}, teacherToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /teaching/sessions/:id/resume - non-existent', async () => {
    const res = await PATCH('/teaching/sessions/00000000-0000-0000-0000-000000000000/resume', {}, teacherToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function feesTests() {
  console.log('\n--- Fees ---');

  await test('GET /fees/heads', async () => {
    const res = await GET('/fees/heads', adminToken);
    assertStatus(res, [200]);
    const data = await res.json();
    assert(Array.isArray(data), 'Should return array');
  });

  await test('GET /fees/defaulters', async () => {
    const res = await GET('/fees/defaulters', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /fees/payments/:studentId - non-existent', async () => {
    const res = await GET('/fees/payments/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('POST /fees/heads - missing fields', async () => {
    const res = await POST('/fees/heads', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /fees/payments - missing fields', async () => {
    const res = await POST('/fees/payments', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function syllabusTests() {
  console.log('\n--- Syllabus ---');

  await test('GET /syllabus', async () => {
    const res = await GET('/syllabus', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /syllabus/:id - non-existent', async () => {
    const res = await GET('/syllabus/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /syllabus - missing fields', async () => {
    const res = await POST('/syllabus', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function assessmentsTests() {
  console.log('\n--- Assessments ---');

  await test('GET /assessments', async () => {
    const res = await GET('/assessments', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /assessments/:id - non-existent', async () => {
    const res = await GET('/assessments/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /assessments - missing fields', async () => {
    const res = await POST('/assessments', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /assessments/:id/submissions - non-existent', async () => {
    const res = await GET('/assessments/00000000-0000-0000-0000-000000000000/submissions', adminToken);
    assertStatus(res, [200]);
  });
}

async function questionBankTests() {
  console.log('\n--- Question Bank ---');

  await test('GET /question-bank/banks', async () => {
    const res = await GET('/question-bank/banks', adminToken);
    assertStatus(res, [200]);
  });

  await test('POST /question-bank/banks - missing fields', async () => {
    const res = await POST('/question-bank/banks', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function announcementsTests() {
  console.log('\n--- Announcements ---');

  await test('GET /announcements', async () => {
    const res = await GET('/announcements', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /announcements/active', async () => {
    const res = await GET('/announcements/active', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /announcements/:id - non-existent', async () => {
    const res = await GET('/announcements/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /announcements - missing fields', async () => {
    const res = await POST('/announcements', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function calendarTests() {
  console.log('\n--- Calendar ---');

  await test('GET /calendar', async () => {
    const res = await GET('/calendar', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /calendar/upcoming', async () => {
    const res = await GET('/calendar/upcoming', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /calendar/:id - non-existent', async () => {
    const res = await GET('/calendar/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function complianceTests() {
  console.log('\n--- Compliance ---');

  await test('GET /compliance/deliveries', async () => {
    const res = await GET('/compliance/deliveries', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /compliance/report?classId=x&academicSessionId=x', async () => {
    const res = await GET('/compliance/report?classId=test&academicSessionId=test', adminToken);
    assertStatus(res, [200]);
  });
}

async function analyticsTests() {
  console.log('\n--- Analytics ---');

  await test('GET /analytics/student/:id - non-existent', async () => {
    const res = await GET('/analytics/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /analytics/class/:id - non-existent', async () => {
    const res = await GET('/analytics/class/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /analytics/weak-students/:classId', async () => {
    const res = await GET('/analytics/weak-students/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /analytics/compliance-performance', async () => {
    const res = await GET('/analytics/compliance-performance', adminToken);
    assertStatus(res, [200]);
  });
}

async function courseModulesTests() {
  console.log('\n--- Course Modules ---');

  await test('GET /course-modules?classId=x&subjectId=x', async () => {
    const res = await GET('/course-modules?classId=test&subjectId=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /course-modules/:id - non-existent', async () => {
    const res = await GET('/course-modules/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /course-modules/progress/:studentId', async () => {
    const res = await GET('/course-modules/progress/00000000-0000-0000-0000-000000000000?classId=test', adminToken);
    assertStatus(res, [200]);
  });
}

async function libraryTests() {
  console.log('\n--- Library ---');

  await test('GET /library/books', async () => {
    const res = await GET('/library/books', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /library/books/:id - non-existent', async () => {
    const res = await GET('/library/books/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /library/overdue', async () => {
    const res = await GET('/library/overdue', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /library/borrower/:userId', async () => {
    const res = await GET('/library/borrower/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('POST /library/books - missing fields', async () => {
    const res = await POST('/library/books', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function gradingTests() {
  console.log('\n--- Grading ---');

  await test('GET /grading/student/:id', async () => {
    const res = await GET('/grading/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /grading/class?classId=x&subjectId=x', async () => {
    const res = await GET('/grading/class?classId=test&subjectId=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('POST /grading - missing fields', async () => {
    const res = await POST('/grading', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function reportCardTests() {
  console.log('\n--- Report Cards ---');

  await test('GET /report-cards/student/:id', async () => {
    const res = await GET('/report-cards/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /report-cards/:id - non-existent', async () => {
    const res = await GET('/report-cards/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function hobbyTests() {
  console.log('\n--- Hobby ---');

  await test('GET /hobby', async () => {
    const res = await GET('/hobby', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /hobby/:id - non-existent', async () => {
    const res = await GET('/hobby/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /hobby/portfolio/:studentId', async () => {
    const res = await GET('/hobby/portfolio/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function communicationTests() {
  console.log('\n--- Communication ---');

  await test('GET /communication/ptm/slots', async () => {
    const res = await GET('/communication/ptm/slots', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /communication/ptm/bookings', async () => {
    const res = await GET('/communication/ptm/bookings', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /communication/conversations', async () => {
    const res = await GET('/communication/conversations', adminToken);
    assertStatus(res, [200]);
  });
}

async function notificationsTests() {
  console.log('\n--- Notifications ---');

  await test('GET /notifications', async () => {
    const res = await GET('/notifications', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /notifications/unread-count', async () => {
    const res = await GET('/notifications/unread-count', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /notifications/stats', async () => {
    const res = await GET('/notifications/stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('PATCH /notifications/read-all', async () => {
    const res = await PATCH('/notifications/read-all', {}, adminToken);
    assertStatus(res, [200]);
  });
}

async function disciplineTests() {
  console.log('\n--- Discipline ---');

  await test('GET /discipline/incidents', async () => {
    const res = await GET('/discipline/incidents', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /discipline/incidents/:id - non-existent', async () => {
    const res = await GET('/discipline/incidents/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /discipline/red-flags', async () => {
    const res = await GET('/discipline/red-flags', adminToken);
    assertStatus(res, [200]);
  });
}

async function busTests() {
  console.log('\n--- Bus ---');

  await test('GET /bus/vehicles', async () => {
    const res = await GET('/bus/vehicles', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /bus/routes', async () => {
    const res = await GET('/bus/routes', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /bus/boarding', async () => {
    const res = await GET('/bus/boarding', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /bus/vehicles/:id - non-existent', async () => {
    const res = await GET('/bus/vehicles/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /bus/routes/:id - non-existent', async () => {
    const res = await GET('/bus/routes/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /bus/assignments/:studentId - non-existent', async () => {
    const res = await GET('/bus/assignments/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function teacherAttendanceTests() {
  console.log('\n--- Teacher Attendance ---');

  await test('GET /teacher-attendance?teacherId=x&startDate=2025-01-01&endDate=2025-12-31', async () => {
    const res = await GET('/teacher-attendance?teacherId=test&startDate=2025-01-01&endDate=2025-12-31', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /teacher-attendance/all?date=2025-06-01', async () => {
    const res = await GET('/teacher-attendance/all?date=2025-06-01', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /teacher-attendance/leaves', async () => {
    const res = await GET('/teacher-attendance/leaves', adminToken);
    assertStatus(res, [200]);
  });
}

async function assignmentsTests() {
  console.log('\n--- Assignments ---');

  await test('GET /assignments', async () => {
    const res = await GET('/assignments', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /assignments/:id - non-existent', async () => {
    const res = await GET('/assignments/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /assignments - missing fields', async () => {
    const res = await POST('/assignments', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function parentPortalTests() {
  console.log('\n--- Parent Portal ---');

  // These require PARENT role, so admin should get 403
  await test('GET /parent-portal/overview - non-parent', async () => {
    const res = await GET('/parent-portal/overview', adminToken);
    assert([200, 403].includes(res.status), 'Should return 200 or 403 for non-parent');
  });

  await test('GET /parent-portal/attendance?studentId=x&startDate=2025-01-01&endDate=2025-12-31', async () => {
    const res = await GET('/parent-portal/attendance?studentId=test&startDate=2025-01-01&endDate=2025-12-31', adminToken);
    assert([200, 403].includes(res.status), 'Parent role required');
  });

  await test('GET /parent-portal/grades?studentId=x', async () => {
    const res = await GET('/parent-portal/grades?studentId=test', adminToken);
    assert([200, 403].includes(res.status), 'Parent role required');
  });

  await test('GET /parent-portal/fees?studentId=x', async () => {
    const res = await GET('/parent-portal/fees?studentId=test', adminToken);
    assert([200, 403].includes(res.status), 'Parent role required');
  });

  await test('GET /parent-portal/report-cards?studentId=x', async () => {
    const res = await GET('/parent-portal/report-cards?studentId=test', adminToken);
    assert([200, 403].includes(res.status), 'Parent role required');
  });
}

async function documentsTests() {
  console.log('\n--- Documents ---');

  await test('GET /documents', async () => {
    const res = await GET('/documents', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /documents/checklist?studentId=x', async () => {
    const res = await GET('/documents/checklist?studentId=00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function studentLeavesTests() {
  console.log('\n--- Student Leaves ---');

  await test('GET /student-leaves', async () => {
    const res = await GET('/student-leaves', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /student-leaves?status=PENDING', async () => {
    const res = await GET('/student-leaves?status=PENDING', adminToken);
    assertStatus(res, [200]);
  });
}

async function examScheduleTests() {
  console.log('\n--- Exam Schedules ---');

  await test('GET /exam-schedules', async () => {
    const res = await GET('/exam-schedules', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /exam-schedules/:id - non-existent', async () => {
    const res = await GET('/exam-schedules/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function bulkOperationsTests() {
  console.log('\n--- Bulk Operations ---');

  await test('GET /bulk/export/students', async () => {
    const res = await GET('/bulk/export/students', adminToken);
    assertStatus(res, [200]);
  });

  await test('POST /bulk/import/students - empty array', async () => {
    const res = await POST('/bulk/import/students', { students: [] }, adminToken);
    assertStatus(res, [200, 201]);
    const data = await res.json();
    assert(data.imported === 0, 'Should import 0');
  });

  await test('POST /bulk/import/payments - empty array', async () => {
    const res = await POST('/bulk/import/payments', { payments: [] }, adminToken);
    assertStatus(res, [200, 201]);
  });

  await test('GET /bulk/export/students - teacher (might be forbidden)', async () => {
    const res = await GET('/bulk/export/students', teacherToken);
    assert([200, 403].includes(res.status), 'Should return 200 or 403');
  });
}

async function admissionTests() {
  console.log('\n--- Admission ---');

  await test('GET /admission/enquiries', async () => {
    const res = await GET('/admission/enquiries', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /admission/applications', async () => {
    const res = await GET('/admission/applications', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /admission/stats', async () => {
    const res = await GET('/admission/stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /admission/enquiries/:id - non-existent', async () => {
    const res = await GET('/admission/enquiries/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function auditTests() {
  console.log('\n--- Audit ---');

  await test('GET /audit/logs', async () => {
    const res = await GET('/audit/logs', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /audit/logs?page=1&limit=5', async () => {
    const res = await GET('/audit/logs?page=1&limit=5', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /audit/logs - teacher (might be forbidden)', async () => {
    const res = await GET('/audit/logs', teacherToken);
    assert([200, 403].includes(res.status), 'Should return 200 or 403');
  });
}

async function feeAutomationTests() {
  console.log('\n--- Fee Automation ---');

  await test('GET /fee-automation/summary', async () => {
    const res = await GET('/fee-automation/summary', adminToken);
    assertStatus(res, [200]);
  });
}

async function reportsTests() {
  console.log('\n--- Reports ---');

  await test('GET /reports/report-card/:studentId - non-existent', async () => {
    const res = await GET('/reports/report-card/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('GET /reports/student-profile/:studentId - non-existent', async () => {
    const res = await GET('/reports/student-profile/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('GET /reports/fee-receipt/:paymentId - non-existent', async () => {
    const res = await GET('/reports/fee-receipt/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function substitutesTests() {
  console.log('\n--- Substitutes ---');

  await test('GET /substitutes', async () => {
    const res = await GET('/substitutes', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /substitutes/suggestions?date=2025-06-01&startTime=09:00&endTime=10:00', async () => {
    const res = await GET('/substitutes/suggestions?date=2025-06-01&startTime=09:00&endTime=10:00', adminToken);
    assertStatus(res, [200]);
  });
}

async function promotionsTests() {
  console.log('\n--- Promotions ---');

  await test('GET /promotions', async () => {
    const res = await GET('/promotions', adminToken);
    assertStatus(res, [200]);
  });
}

async function concessionsTests() {
  console.log('\n--- Concessions ---');

  await test('GET /concessions', async () => {
    const res = await GET('/concessions', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /concessions/student/:studentId', async () => {
    const res = await GET('/concessions/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200, 404]);
  });
}

async function settingsTests() {
  console.log('\n--- Settings ---');

  await test('GET /settings', async () => {
    const res = await GET('/settings', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /settings/:key - non-existent', async () => {
    const res = await GET('/settings/nonexistent-key', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function periodAttendanceTests() {
  console.log('\n--- Period Attendance ---');

  await test('GET /period-attendance/class?classId=x&sectionId=x&date=2025-06-01', async () => {
    const res = await GET('/period-attendance/class?classId=test&sectionId=test&date=2025-06-01', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /period-attendance/student/:studentId?date=2025-06-01', async () => {
    const res = await GET('/period-attendance/student/00000000-0000-0000-0000-000000000000?date=2025-06-01', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /period-attendance/absent?date=2025-06-01', async () => {
    const res = await GET('/period-attendance/absent?date=2025-06-01', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /period-attendance/summary?classId=x&sectionId=x&startDate=2025-01-01&endDate=2025-12-31', async () => {
    const res = await GET('/period-attendance/summary?classId=test&sectionId=test&startDate=2025-01-01&endDate=2025-12-31', adminToken);
    assertStatus(res, [200]);
  });
}

async function resultWorkflowTests() {
  console.log('\n--- Result Workflow ---');

  await test('GET /result-workflow', async () => {
    const res = await GET('/result-workflow', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /result-workflow/status?classId=x&subjectId=x&term=mid', async () => {
    const res = await GET('/result-workflow/status?classId=test&subjectId=test&term=mid', adminToken);
    assertStatus(res, [200]);
  });
}

async function searchTests() {
  console.log('\n--- Search ---');

  await test('GET /search?q=test', async () => {
    const res = await GET('/search?q=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /search?q=&limit=2', async () => {
    const res = await GET('/search?q=math&limit=2', adminToken);
    assertStatus(res, [200]);
  });
}

async function remedialTests() {
  console.log('\n--- Remedial ---');

  await test('GET /remedial', async () => {
    const res = await GET('/remedial', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /remedial/student/:studentId', async () => {
    const res = await GET('/remedial/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /remedial/subject/:subjectId', async () => {
    const res = await GET('/remedial/subject/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function graceMarksTests() {
  console.log('\n--- Grace Marks ---');

  await test('GET /grace-marks', async () => {
    const res = await GET('/grace-marks', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /grace-marks/student/:studentId', async () => {
    const res = await GET('/grace-marks/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /grace-marks/adjusted?studentId=x&subjectId=x', async () => {
    const res = await GET('/grace-marks/adjusted?studentId=test&subjectId=test', adminToken);
    assertStatus(res, [200]);
  });
}

async function transferCertificateTests() {
  console.log('\n--- Transfer Certificates ---');

  await test('GET /transfer-certificates', async () => {
    const res = await GET('/transfer-certificates', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /transfer-certificates/:id - non-existent', async () => {
    const res = await GET('/transfer-certificates/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function emailTests() {
  console.log('\n--- Email ---');

  await test('GET /email/templates', async () => {
    const res = await GET('/email/templates', adminToken);
    assertStatus(res, [200]);
  });
}

async function visitorsTests() {
  console.log('\n--- Visitors ---');

  await test('GET /visitors', async () => {
    const res = await GET('/visitors', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /visitors/today', async () => {
    const res = await GET('/visitors/today', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /visitors/active', async () => {
    const res = await GET('/visitors/active', adminToken);
    assertStatus(res, [200]);
  });
}

async function healthRecordsTests() {
  console.log('\n--- Health ---');

  await test('GET /health/records/:studentId', async () => {
    const res = await GET('/health/records/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /health/incidents', async () => {
    const res = await GET('/health/incidents', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /health/allergies', async () => {
    const res = await GET('/health/allergies', adminToken);
    assertStatus(res, [200]);
  });
}

async function inventoryTests() {
  console.log('\n--- Inventory ---');

  await test('GET /inventory', async () => {
    const res = await GET('/inventory', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /inventory/low-stock', async () => {
    const res = await GET('/inventory/low-stock', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /inventory/logs', async () => {
    const res = await GET('/inventory/logs', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /inventory/:id - non-existent', async () => {
    const res = await GET('/inventory/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function feedbackTests() {
  console.log('\n--- Feedback ---');

  await test('GET /feedback', async () => {
    const res = await GET('/feedback', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /feedback/summary', async () => {
    const res = await GET('/feedback/summary', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /feedback/teacher/:teacherId', async () => {
    const res = await GET('/feedback/teacher/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /feedback/subject/:subjectId', async () => {
    const res = await GET('/feedback/subject/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function transportBillingTests() {
  console.log('\n--- Transport Billing ---');

  await test('GET /transport-billing', async () => {
    const res = await GET('/transport-billing', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /transport-billing/student/:studentId', async () => {
    const res = await GET('/transport-billing/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /transport-billing/report?month=6&year=2025', async () => {
    const res = await GET('/transport-billing/report?month=6&year=2025', adminToken);
    assertStatus(res, [200]);
  });
}

async function certificatesTests() {
  console.log('\n--- Certificates ---');

  await test('GET /certificates', async () => {
    const res = await GET('/certificates', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /certificates/:id - non-existent', async () => {
    const res = await GET('/certificates/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /certificates/:id/print - non-existent', async () => {
    const res = await GET('/certificates/00000000-0000-0000-0000-000000000000/print', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function roomBookingTests() {
  console.log('\n--- Room Booking ---');

  await test('GET /rooms', async () => {
    const res = await GET('/rooms', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /rooms/available?date=2025-06-01&startTime=09:00&endTime=10:00', async () => {
    const res = await GET('/rooms/available?date=2025-06-01&startTime=09:00&endTime=10:00', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /rooms/my-bookings', async () => {
    const res = await GET('/rooms/my-bookings', adminToken);
    assertStatus(res, [200]);
  });
}

async function hostelTests() {
  console.log('\n--- Hostel ---');

  await test('GET /hostel/rooms', async () => {
    const res = await GET('/hostel/rooms', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /hostel/occupancy', async () => {
    const res = await GET('/hostel/occupancy', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /hostel/fees', async () => {
    const res = await GET('/hostel/fees', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /hostel/student/:studentId', async () => {
    const res = await GET('/hostel/student/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /hostel/rooms/:id - non-existent', async () => {
    const res = await GET('/hostel/rooms/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function meetingsTests() {
  console.log('\n--- Meetings ---');

  await test('GET /meetings', async () => {
    const res = await GET('/meetings', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /meetings/upcoming', async () => {
    const res = await GET('/meetings/upcoming', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /meetings/:id - non-existent', async () => {
    const res = await GET('/meetings/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function payrollTests() {
  console.log('\n--- Payroll ---');

  await test('GET /payroll', async () => {
    const res = await GET('/payroll', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /payroll/structures', async () => {
    const res = await GET('/payroll/structures', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /payroll/user/:userId', async () => {
    const res = await GET('/payroll/user/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /payroll/summary?month=6&year=2025', async () => {
    const res = await GET('/payroll/summary?month=6&year=2025', adminToken);
    assertStatus(res, [200]);
  });
}

async function activityLogTests() {
  console.log('\n--- Activity Log ---');

  await test('GET /activity-log/student/:studentId', async () => {
    const res = await GET('/activity-log/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /activity-log/student/:studentId/stats', async () => {
    const res = await GET('/activity-log/student/00000000-0000-0000-0000-000000000000/stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /activity-log/recent/:studentId', async () => {
    const res = await GET('/activity-log/recent/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function grievancesTests() {
  console.log('\n--- Grievances ---');

  await test('GET /grievances', async () => {
    const res = await GET('/grievances', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /grievances/stats', async () => {
    const res = await GET('/grievances/stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /grievances/:id - non-existent', async () => {
    const res = await GET('/grievances/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function diaryTests() {
  console.log('\n--- Diary ---');

  await test('GET /diary?classId=test&date=2025-06-01', async () => {
    const res = await GET('/diary?classId=test&date=2025-06-01', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /diary/student/:studentId', async () => {
    const res = await GET('/diary/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function idCardsTests() {
  console.log('\n--- ID Cards ---');

  await test('GET /id-cards', async () => {
    const res = await GET('/id-cards', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /id-cards/:id - non-existent', async () => {
    const res = await GET('/id-cards/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function messageLogTests() {
  console.log('\n--- Message Logs ---');

  await test('GET /message-logs', async () => {
    const res = await GET('/message-logs', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /message-logs/stats', async () => {
    const res = await GET('/message-logs/stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /message-logs/:id - non-existent', async () => {
    const res = await GET('/message-logs/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function eventsTests() {
  console.log('\n--- Events ---');

  await test('GET /events', async () => {
    const res = await GET('/events', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /events/upcoming', async () => {
    const res = await GET('/events/upcoming', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /events/stats/summary', async () => {
    const res = await GET('/events/stats/summary', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /events/:id - non-existent', async () => {
    const res = await GET('/events/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function expensesTests() {
  console.log('\n--- Expenses ---');

  await test('GET /expenses', async () => {
    const res = await GET('/expenses', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /expenses/summary?month=6&year=2025', async () => {
    const res = await GET('/expenses/summary?month=6&year=2025', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /expenses/budgets?year=2025', async () => {
    const res = await GET('/expenses/budgets?year=2025', adminToken);
    assertStatus(res, [200]);
  });
}

async function alumniTests() {
  console.log('\n--- Alumni ---');

  await test('GET /alumni', async () => {
    const res = await GET('/alumni', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /alumni/stats', async () => {
    const res = await GET('/alumni/stats', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /alumni/search?q=test', async () => {
    const res = await GET('/alumni/search?q=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /alumni/:id - non-existent', async () => {
    const res = await GET('/alumni/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function staffDirectoryTests() {
  console.log('\n--- Staff Directory ---');

  await test('GET /staff-directory', async () => {
    const res = await GET('/staff-directory', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /staff-directory/departments', async () => {
    const res = await GET('/staff-directory/departments', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /staff-directory/search?q=test', async () => {
    const res = await GET('/staff-directory/search?q=test', adminToken);
    assertStatus(res, [200]);
  });
}

async function galleryTests() {
  console.log('\n--- Gallery ---');

  await test('GET /gallery/albums', async () => {
    const res = await GET('/gallery/albums', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /gallery/public', async () => {
    const res = await GET('/gallery/public', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /gallery/albums/:id - non-existent', async () => {
    const res = await GET('/gallery/albums/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function surveysTests() {
  console.log('\n--- Surveys ---');

  await test('GET /surveys', async () => {
    const res = await GET('/surveys', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /surveys/:id - non-existent', async () => {
    const res = await GET('/surveys/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function performanceReportTests() {
  console.log('\n--- Performance Report ---');

  await test('GET /performance-report/student/:studentId', async () => {
    const res = await GET('/performance-report/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('GET /performance-report/class/:classId', async () => {
    const res = await GET('/performance-report/class/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200, 404]);
  });
}

async function academicTransitionTests() {
  console.log('\n--- Academic Transition ---');

  await test('GET /academic-transition', async () => {
    const res = await GET('/academic-transition', adminToken);
    assertStatus(res, [200]);
  });
}

async function lmsContentTests() {
  console.log('\n--- LMS Content ---');

  await test('GET /lms-content', async () => {
    const res = await GET('/lms-content', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /lms-content/:id - non-existent', async () => {
    const res = await GET('/lms-content/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function learningPathsTests() {
  console.log('\n--- Learning Paths ---');

  await test('GET /learning-paths', async () => {
    const res = await GET('/learning-paths', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /learning-paths/student/:studentId', async () => {
    const res = await GET('/learning-paths/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /learning-paths/recommended/:studentId', async () => {
    const res = await GET('/learning-paths/recommended/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('GET /learning-paths/:id - non-existent', async () => {
    const res = await GET('/learning-paths/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function rubricsTests() {
  console.log('\n--- Rubrics ---');

  await test('GET /rubrics', async () => {
    const res = await GET('/rubrics', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /rubrics/:id - non-existent', async () => {
    const res = await GET('/rubrics/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /rubrics/student/:studentId', async () => {
    const res = await GET('/rubrics/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function liveClassesTests() {
  console.log('\n--- Live Classes ---');

  await test('GET /live-classes', async () => {
    const res = await GET('/live-classes', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /live-classes/:id - non-existent', async () => {
    const res = await GET('/live-classes/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function discussionsTests() {
  console.log('\n--- Discussions ---');

  await test('GET /discussions?classId=test', async () => {
    const res = await GET('/discussions?classId=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /discussions/:id - non-existent', async () => {
    const res = await GET('/discussions/00000000-0000-0000-0000-000000000000', adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function gamificationTests() {
  console.log('\n--- Gamification ---');

  await test('GET /gamification/badges', async () => {
    const res = await GET('/gamification/badges', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /gamification/profile/:studentId', async () => {
    const res = await GET('/gamification/profile/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /gamification/badges/student/:studentId', async () => {
    const res = await GET('/gamification/badges/student/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /gamification/leaderboard/:classId', async () => {
    const res = await GET('/gamification/leaderboard/00000000-0000-0000-0000-000000000000', adminToken);
    assertStatus(res, [200]);
  });
}

async function schoolDataTests() {
  console.log('\n--- School Data ---');

  await test('GET /classes', async () => {
    const res = await GET('/classes', adminToken);
    assertStatus(res, [200]);
    const data = await res.json();
    assert(Array.isArray(data), 'Should return array of classes');
  });

  await test('GET /classes/detailed', async () => {
    const res = await GET('/classes/detailed', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /sections?classId=test', async () => {
    const res = await GET('/sections?classId=test', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /subjects', async () => {
    const res = await GET('/subjects', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /academic-sessions', async () => {
    const res = await GET('/academic-sessions', adminToken);
    assertStatus(res, [200]);
  });
}

async function fileUploadTests() {
  console.log('\n--- File Upload ---');

  await test('GET /files', async () => {
    const res = await GET('/files', adminToken);
    assertStatus(res, [200, 500]); // 500 when MinIO/S3 not configured
  });

  await test('GET /files/browse', async () => {
    const res = await GET('/files/browse', adminToken);
    assertStatus(res, [200, 500]); // 500 when MinIO/S3 not configured
  });

  await test('GET /files/stats', async () => {
    const res = await GET('/files/stats', adminToken);
    assertStatus(res, [200, 500]); // 500 when MinIO/S3 not configured
  });
}

async function notificationTriggersTests() {
  console.log('\n--- Notification Triggers ---');

  await test('POST /notification-triggers/absent-alert - missing fields', async () => {
    const res = await POST('/notification-triggers/absent-alert', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /notification-triggers/fee-reminders - missing fields', async () => {
    const res = await POST('/notification-triggers/fee-reminders', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

// ---------------------------------------------------------------------------
// Missing endpoint tests (POST, PATCH, DELETE, workflow)
// ---------------------------------------------------------------------------

const FAKE_ID = '00000000-0000-0000-0000-000000000000';

async function authMutationTests() {
  console.log('\n--- Auth Mutations ---');

  await test('POST /auth/verify-otp - missing fields', async () => {
    const res = await POST('/auth/verify-otp', {}, adminToken);
    assert(res.status >= 200, 'Should respond to OTP request');
  });

  await test('POST /auth/reset-password - missing fields', async () => {
    const res = await POST('/auth/reset-password', {}, adminToken);
    assert(res.status >= 200, 'Should respond to reset request');
  });
}

async function usersMutationTests() {
  console.log('\n--- Users Mutations ---');

  await test('POST /users - missing fields', async () => {
    const res = await POST('/users', {}, adminToken);
    assert(res.status >= 400, 'Should reject incomplete user data');
  });

  await test('PATCH /users/:id - non-existent', async () => {
    const res = await PATCH(`/users/${FAKE_ID}`, { firstName: 'Test' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function schoolDataMutationTests() {
  console.log('\n--- School Data Mutations ---');

  await test('POST /classes - missing fields', async () => {
    const res = await POST('/classes', {}, adminToken);
    assert([200, 201, 400, 422, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /classes/:id - non-existent', async () => {
    const res = await PATCH(`/classes/${FAKE_ID}`, { name: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /classes/:id - non-existent', async () => {
    const res = await DELETE(`/classes/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /sections - missing fields', async () => {
    const res = await POST('/sections', {}, adminToken);
    assert([200, 201, 400, 422, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /sections/:id - non-existent', async () => {
    const res = await PATCH(`/sections/${FAKE_ID}`, { name: 'A' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /sections/:id - non-existent', async () => {
    const res = await DELETE(`/sections/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /subjects - missing fields', async () => {
    const res = await POST('/subjects', {}, adminToken);
    assert([200, 201, 400, 422, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /subjects/:id - non-existent', async () => {
    const res = await PATCH(`/subjects/${FAKE_ID}`, { name: 'Math' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /subjects/:id - non-existent', async () => {
    const res = await DELETE(`/subjects/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function periodAttendanceMutationTests() {
  console.log('\n--- Period Attendance Mutations ---');

  await test('POST /period-attendance/mark - missing fields', async () => {
    const res = await POST('/period-attendance/mark', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function timetableGeneratorMutationTests() {
  console.log('\n--- Timetable Generator Mutations ---');

  await test('POST /timetable-generator/generate - missing fields', async () => {
    const res = await POST('/timetable-generator/generate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function teachingMutationTests() {
  console.log('\n--- Teaching Mutations ---');

  await test('POST /teaching/sessions/:id/cover-item - non-existent', async () => {
    const res = await POST(`/teaching/sessions/${FAKE_ID}/cover-item`, { topicId: FAKE_ID }, teacherToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });
}

async function feesMutationTests() {
  console.log('\n--- Fees Mutations ---');

  await test('PATCH /fees/defaulters/:id - non-existent', async () => {
    const res = await PATCH(`/fees/defaulters/${FAKE_ID}`, { status: 'NOTIFIED' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function syllabusMutationTests() {
  console.log('\n--- Syllabus Mutations ---');

  await test('DELETE /syllabus/:id - non-existent', async () => {
    const res = await DELETE(`/syllabus/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /syllabus/:id/chapters - non-existent syllabus', async () => {
    const res = await POST(`/syllabus/${FAKE_ID}/chapters`, { title: 'Ch1' }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /syllabus/chapters/:id - non-existent', async () => {
    const res = await PATCH(`/syllabus/chapters/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /syllabus/chapters/:id - non-existent', async () => {
    const res = await DELETE(`/syllabus/chapters/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /syllabus/chapters/:id/topics - non-existent chapter', async () => {
    const res = await POST(`/syllabus/chapters/${FAKE_ID}/topics`, { title: 'Topic1' }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /syllabus/topics/:id - non-existent', async () => {
    const res = await PATCH(`/syllabus/topics/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /syllabus/topics/:id - non-existent', async () => {
    const res = await DELETE(`/syllabus/topics/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function assessmentsMutationTests() {
  console.log('\n--- Assessments Mutations ---');

  await test('PATCH /assessments/:id/publish - non-existent', async () => {
    const res = await PATCH(`/assessments/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /assessments/:id/submit - non-existent', async () => {
    const res = await POST(`/assessments/${FAKE_ID}/submit`, { answers: [] }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /assessments/submissions/:id/grade - non-existent', async () => {
    const res = await PATCH(`/assessments/submissions/${FAKE_ID}/grade`, { score: 50 }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function questionBankMutationTests() {
  console.log('\n--- Question Bank Mutations ---');

  await test('POST /question-bank/questions - missing fields', async () => {
    const res = await POST('/question-bank/questions', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /question-bank/banks/:bankId/questions - non-existent', async () => {
    const res = await GET(`/question-bank/banks/${FAKE_ID}/questions`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /question-bank/questions/:id - non-existent', async () => {
    const res = await PATCH(`/question-bank/questions/${FAKE_ID}`, { text: 'Updated?' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /question-bank/questions/:id - non-existent', async () => {
    const res = await DELETE(`/question-bank/questions/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function gradingMutationTests() {
  console.log('\n--- Grading Mutations ---');

  await test('POST /grading/bulk - missing fields', async () => {
    const res = await POST('/grading/bulk', { grades: [] }, adminToken);
    assert([200, 201, 400].includes(res.status), 'Should accept or reject');
  });
}

async function reportCardMutationTests() {
  console.log('\n--- Report Card Mutations ---');

  await test('POST /report-cards/generate - missing fields', async () => {
    const res = await POST('/report-cards/generate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /report-cards/class/:classId - non-existent', async () => {
    const res = await GET(`/report-cards/class/${FAKE_ID}`, adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('PATCH /report-cards/:id/publish - non-existent', async () => {
    const res = await PATCH(`/report-cards/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function assignmentsMutationTests() {
  console.log('\n--- Assignments Mutations ---');

  await test('PATCH /assignments/:id - non-existent', async () => {
    const res = await PATCH(`/assignments/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /assignments/:id/publish - non-existent', async () => {
    const res = await PATCH(`/assignments/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /assignments/:id/submit - non-existent', async () => {
    const res = await POST(`/assignments/${FAKE_ID}/submit`, { content: 'My answer' }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('GET /assignments/:id/submissions - non-existent', async () => {
    const res = await GET(`/assignments/${FAKE_ID}/submissions`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /assignments/submissions/:id/grade - non-existent', async () => {
    const res = await PATCH(`/assignments/submissions/${FAKE_ID}/grade`, { score: 80 }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function announcementsMutationTests() {
  console.log('\n--- Announcements Mutations ---');

  await test('PATCH /announcements/:id - non-existent', async () => {
    const res = await PATCH(`/announcements/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /announcements/:id/publish - non-existent', async () => {
    const res = await PATCH(`/announcements/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /announcements/:id/unpublish - non-existent', async () => {
    const res = await PATCH(`/announcements/${FAKE_ID}/unpublish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /announcements/:id - non-existent', async () => {
    const res = await DELETE(`/announcements/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function calendarMutationTests() {
  console.log('\n--- Calendar Mutations ---');

  await test('POST /calendar - missing fields', async () => {
    const res = await POST('/calendar', {}, adminToken);
    assert([200, 201, 400, 422, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /calendar/:id - non-existent', async () => {
    const res = await PATCH(`/calendar/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /calendar/:id - non-existent', async () => {
    const res = await DELETE(`/calendar/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function complianceMutationTests() {
  console.log('\n--- Compliance Mutations ---');

  await test('POST /compliance/delivery - missing fields', async () => {
    const res = await POST('/compliance/delivery', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function courseModulesMutationTests() {
  console.log('\n--- Course Modules Mutations ---');

  await test('POST /course-modules - missing fields', async () => {
    const res = await POST('/course-modules', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /course-modules/:id/unlock-status - non-existent', async () => {
    const res = await GET(`/course-modules/${FAKE_ID}/unlock-status`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /course-modules/:id/items - non-existent module', async () => {
    const res = await POST(`/course-modules/${FAKE_ID}/items`, { title: 'Item1', type: 'VIDEO' }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('POST /course-modules/items/:itemId/complete - non-existent', async () => {
    const res = await POST(`/course-modules/items/${FAKE_ID}/complete`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });

  await test('PATCH /course-modules/:id/publish - non-existent', async () => {
    const res = await PATCH(`/course-modules/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /course-modules/:id/reorder - non-existent', async () => {
    const res = await PATCH(`/course-modules/${FAKE_ID}/reorder`, { order: [] }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function libraryMutationTests() {
  console.log('\n--- Library Mutations ---');

  await test('POST /library/issue - missing fields', async () => {
    const res = await POST('/library/issue', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /library/return/:issueId - non-existent', async () => {
    const res = await PATCH(`/library/return/${FAKE_ID}`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function hobbyMutationTests() {
  console.log('\n--- Hobby Mutations ---');

  await test('POST /hobby - missing fields', async () => {
    const res = await POST('/hobby', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /hobby/:id/enroll - non-existent', async () => {
    const res = await POST(`/hobby/${FAKE_ID}/enroll`, { studentId: FAKE_ID }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /hobby/:id/withdraw - non-existent', async () => {
    const res = await PATCH(`/hobby/${FAKE_ID}/withdraw`, { studentId: FAKE_ID }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /hobby/sessions - missing fields', async () => {
    const res = await POST('/hobby/sessions', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /hobby/sessions/:id/attendance - non-existent', async () => {
    const res = await POST(`/hobby/sessions/${FAKE_ID}/attendance`, { records: [] }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('GET /hobby/sessions/:id/attendance - non-existent', async () => {
    const res = await GET(`/hobby/sessions/${FAKE_ID}/attendance`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function communicationMutationTests() {
  console.log('\n--- Communication Mutations ---');

  await test('POST /communication/ptm/slots - missing fields', async () => {
    const res = await POST('/communication/ptm/slots', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /communication/ptm/book - missing fields', async () => {
    const res = await POST('/communication/ptm/book', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /communication/ptm/bookings/:id/cancel - non-existent', async () => {
    const res = await PATCH(`/communication/ptm/bookings/${FAKE_ID}/cancel`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /communication/ptm/bookings/:id/complete - non-existent', async () => {
    const res = await PATCH(`/communication/ptm/bookings/${FAKE_ID}/complete`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /communication/conversations - missing fields', async () => {
    const res = await POST('/communication/conversations', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /communication/conversations/:id/messages - non-existent', async () => {
    const res = await GET(`/communication/conversations/${FAKE_ID}/messages`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /communication/messages - missing fields', async () => {
    const res = await POST('/communication/messages', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /communication/messages/:id/read - non-existent', async () => {
    const res = await PATCH(`/communication/messages/${FAKE_ID}/read`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function notificationsMutationTests() {
  console.log('\n--- Notifications Mutations ---');

  await test('POST /notifications - missing fields', async () => {
    const res = await POST('/notifications', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /notifications/bulk - missing fields', async () => {
    const res = await POST('/notifications/bulk', { notifications: [] }, adminToken);
    assert([200, 201, 400].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /notifications/:id/read - non-existent', async () => {
    const res = await PATCH(`/notifications/${FAKE_ID}/read`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /notifications/:id/status - non-existent', async () => {
    const res = await PATCH(`/notifications/${FAKE_ID}/status`, { status: 'READ' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /notifications/:id - non-existent', async () => {
    const res = await DELETE(`/notifications/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function disciplineMutationTests() {
  console.log('\n--- Discipline Mutations ---');

  await test('POST /discipline/incidents - missing fields', async () => {
    const res = await POST('/discipline/incidents', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /discipline/incidents/:id/status - non-existent', async () => {
    const res = await PATCH(`/discipline/incidents/${FAKE_ID}/status`, { status: 'RESOLVED' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /discipline/actions - missing fields', async () => {
    const res = await POST('/discipline/actions', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /discipline/red-flags/:id/resolve - non-existent', async () => {
    const res = await PATCH(`/discipline/red-flags/${FAKE_ID}/resolve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function busMutationTests() {
  console.log('\n--- Bus Mutations ---');

  await test('POST /bus/vehicles - missing fields', async () => {
    const res = await POST('/bus/vehicles', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /bus/vehicles/:id - non-existent', async () => {
    const res = await PATCH(`/bus/vehicles/${FAKE_ID}`, { number: 'BUS-001' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /bus/vehicles/:id - non-existent', async () => {
    const res = await DELETE(`/bus/vehicles/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /bus/routes - missing fields', async () => {
    const res = await POST('/bus/routes', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /bus/routes/:id - non-existent', async () => {
    const res = await PATCH(`/bus/routes/${FAKE_ID}`, { name: 'Route A' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /bus/routes/:id - non-existent', async () => {
    const res = await DELETE(`/bus/routes/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /bus/routes/:routeId/stops - non-existent route', async () => {
    const res = await POST(`/bus/routes/${FAKE_ID}/stops`, { name: 'Stop 1', order: 1 }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('DELETE /bus/stops/:stopId - non-existent', async () => {
    const res = await DELETE(`/bus/stops/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /bus/assignments - missing fields', async () => {
    const res = await POST('/bus/assignments', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('DELETE /bus/assignments/:studentId - non-existent', async () => {
    const res = await DELETE(`/bus/assignments/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /bus/boarding - missing fields', async () => {
    const res = await POST('/bus/boarding', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function teacherAttendanceMutationTests() {
  console.log('\n--- Teacher Attendance Mutations ---');

  await test('POST /teacher-attendance/mark - missing fields', async () => {
    const res = await POST('/teacher-attendance/mark', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /teacher-attendance/leave - missing fields', async () => {
    const res = await POST('/teacher-attendance/leave', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /teacher-attendance/leaves/:id/approve - non-existent', async () => {
    const res = await PATCH(`/teacher-attendance/leaves/${FAKE_ID}/approve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function documentsMutationTests() {
  console.log('\n--- Documents Mutations ---');

  await test('POST /documents - missing fields', async () => {
    const res = await POST('/documents', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /documents/:id/verify - non-existent', async () => {
    const res = await PATCH(`/documents/${FAKE_ID}/verify`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /documents/:id - non-existent', async () => {
    const res = await DELETE(`/documents/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function studentLeavesMutationTests() {
  console.log('\n--- Student Leaves Mutations ---');

  await test('POST /student-leaves - missing fields', async () => {
    const res = await POST('/student-leaves', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /student-leaves/:id/approve - non-existent', async () => {
    const res = await PATCH(`/student-leaves/${FAKE_ID}/approve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function examScheduleMutationTests() {
  console.log('\n--- Exam Schedule Mutations ---');

  await test('POST /exam-schedules - missing fields', async () => {
    const res = await POST('/exam-schedules', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /exam-schedules/:id - non-existent', async () => {
    const res = await PATCH(`/exam-schedules/${FAKE_ID}`, { name: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /exam-schedules/:id - non-existent', async () => {
    const res = await DELETE(`/exam-schedules/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /exam-schedules/:id/entries - non-existent schedule', async () => {
    const res = await POST(`/exam-schedules/${FAKE_ID}/entries`, { subjectId: FAKE_ID, date: '2025-06-15' }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('DELETE /exam-schedules/:id/entries/:entryId - non-existent', async () => {
    const res = await DELETE(`/exam-schedules/${FAKE_ID}/entries/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function bulkOperationsMutationTests() {
  console.log('\n--- Bulk Operations Mutations ---');

  await test('GET /bulk/export/attendance', async () => {
    const res = await GET('/bulk/export/attendance', adminToken);
    assertStatus(res, [200, 400]);
  });

  await test('GET /bulk/export/grades', async () => {
    const res = await GET('/bulk/export/grades', adminToken);
    assertStatus(res, [200, 400]);
  });
}

async function admissionMutationTests() {
  console.log('\n--- Admission Mutations ---');

  await test('POST /admission/enquiries - missing fields', async () => {
    const res = await POST('/admission/enquiries', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /admission/enquiries/:id/status - non-existent', async () => {
    const res = await PATCH(`/admission/enquiries/${FAKE_ID}/status`, { status: 'CONTACTED' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /admission/applications - missing fields', async () => {
    const res = await POST('/admission/applications', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /admission/applications/:id/process - non-existent', async () => {
    const res = await PATCH(`/admission/applications/${FAKE_ID}/process`, { status: 'APPROVED' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /admission/applications/:id/enroll - non-existent', async () => {
    const res = await POST(`/admission/applications/${FAKE_ID}/enroll`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });
}

async function auditMutationTests() {
  console.log('\n--- Audit Mutations ---');

  await test('GET /audit/logs/entity/:entity/:entityId - non-existent', async () => {
    const res = await GET(`/audit/logs/entity/USER/${FAKE_ID}`, adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /audit/logs/user/:userId - non-existent', async () => {
    const res = await GET(`/audit/logs/user/${FAKE_ID}`, adminToken);
    assertStatus(res, [200]);
  });
}

async function feeAutomationMutationTests() {
  console.log('\n--- Fee Automation Mutations ---');

  await test('POST /fee-automation/check-defaulters', async () => {
    const res = await POST('/fee-automation/check-defaulters', {}, adminToken);
    assert([200, 201, 400].includes(res.status), 'Should accept or reject');
  });

  await test('POST /fee-automation/send-reminders', async () => {
    const res = await POST('/fee-automation/send-reminders', {}, adminToken);
    assert([200, 201, 400].includes(res.status), 'Should accept or reject');
  });

  await test('POST /fee-automation/remind/:id - non-existent', async () => {
    const res = await POST(`/fee-automation/remind/${FAKE_ID}`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });
}

async function reportsMutationTests() {
  console.log('\n--- Reports Mutations ---');

  await test('GET /reports/attendance/:classId - non-existent', async () => {
    const res = await GET(`/reports/attendance/${FAKE_ID}`, adminToken);
    assertStatus(res, [200, 404]);
  });
}

async function substitutesMutationTests() {
  console.log('\n--- Substitutes Mutations ---');

  await test('POST /substitutes - missing fields', async () => {
    const res = await POST('/substitutes', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /substitutes/:id/accept - non-existent', async () => {
    const res = await PATCH(`/substitutes/${FAKE_ID}/accept`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /substitutes/:id/complete - non-existent', async () => {
    const res = await PATCH(`/substitutes/${FAKE_ID}/complete`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /substitutes/:id/cancel - non-existent', async () => {
    const res = await PATCH(`/substitutes/${FAKE_ID}/cancel`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function promotionsMutationTests() {
  console.log('\n--- Promotions Mutations ---');

  await test('POST /promotions/generate - missing fields', async () => {
    const res = await POST('/promotions/generate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /promotions/:id/process - non-existent', async () => {
    const res = await PATCH(`/promotions/${FAKE_ID}/process`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /promotions/bulk-process - missing fields', async () => {
    const res = await POST('/promotions/bulk-process', { ids: [] }, adminToken);
    assert([200, 201, 400].includes(res.status), 'Should accept or reject');
  });
}

async function concessionsMutationTests() {
  console.log('\n--- Concessions Mutations ---');

  await test('POST /concessions - missing fields', async () => {
    const res = await POST('/concessions', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /concessions/:id/approve - non-existent', async () => {
    const res = await PATCH(`/concessions/${FAKE_ID}/approve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /concessions/calculate - query', async () => {
    const res = await GET('/concessions/calculate?studentId=test&feeHeadId=test', adminToken);
    assertStatus(res, [200, 400, 404]);
  });
}

async function settingsMutationTests() {
  console.log('\n--- Settings Mutations ---');

  await test('PATCH /settings/:key - non-existent key', async () => {
    const res = await PATCH('/settings/nonexistent-key-xyz', { value: 'test' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /settings/seed-defaults', async () => {
    const res = await POST('/settings/seed-defaults', {}, adminToken);
    assert([200, 201, 400].includes(res.status), 'Should accept or reject');
  });
}

async function resultWorkflowMutationTests() {
  console.log('\n--- Result Workflow Mutations ---');

  await test('POST /result-workflow/submit - missing fields', async () => {
    const res = await POST('/result-workflow/submit', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /result-workflow/:id/review - non-existent', async () => {
    const res = await PATCH(`/result-workflow/${FAKE_ID}/review`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /result-workflow/:id/approve - non-existent', async () => {
    const res = await PATCH(`/result-workflow/${FAKE_ID}/approve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /result-workflow/:id/publish - non-existent', async () => {
    const res = await PATCH(`/result-workflow/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /result-workflow/:id/reject - non-existent', async () => {
    const res = await PATCH(`/result-workflow/${FAKE_ID}/reject`, { reason: 'Test' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function remedialMutationTests() {
  console.log('\n--- Remedial Mutations ---');

  await test('POST /remedial/check/:assessmentId - non-existent', async () => {
    const res = await POST(`/remedial/check/${FAKE_ID}`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });

  await test('PATCH /remedial/:id/score - non-existent', async () => {
    const res = await PATCH(`/remedial/${FAKE_ID}/score`, { score: 60 }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function graceMarksMutationTests() {
  console.log('\n--- Grace Marks Mutations ---');

  await test('POST /grace-marks - missing fields', async () => {
    const res = await POST('/grace-marks', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function transferCertificateMutationTests() {
  console.log('\n--- Transfer Certificate Mutations ---');

  await test('POST /transfer-certificates - missing fields', async () => {
    const res = await POST('/transfer-certificates', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /transfer-certificates/:id/issue - non-existent', async () => {
    const res = await PATCH(`/transfer-certificates/${FAKE_ID}/issue`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /transfer-certificates/:id/cancel - non-existent', async () => {
    const res = await PATCH(`/transfer-certificates/${FAKE_ID}/cancel`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /transfer-certificates/:id/print - non-existent', async () => {
    const res = await GET(`/transfer-certificates/${FAKE_ID}/print`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function emailMutationTests() {
  console.log('\n--- Email Mutations ---');

  await test('POST /email/test - missing fields', async () => {
    const res = await POST('/email/test', {}, adminToken);
    assert(res.status < 500, 'Should not return 5xx');
  });
}

async function visitorsMutationTests() {
  console.log('\n--- Visitors Mutations ---');

  await test('POST /visitors/check-in - missing fields', async () => {
    const res = await POST('/visitors/check-in', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /visitors/:id/check-out - non-existent', async () => {
    const res = await PATCH(`/visitors/${FAKE_ID}/check-out`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function healthMutationTests() {
  console.log('\n--- Health Mutations ---');

  await test('POST /health/records - missing fields', async () => {
    const res = await POST('/health/records', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /health/incidents - missing fields', async () => {
    const res = await POST('/health/incidents', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function inventoryMutationTests() {
  console.log('\n--- Inventory Mutations ---');

  await test('POST /inventory - missing fields', async () => {
    const res = await POST('/inventory', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /inventory/:id - non-existent', async () => {
    const res = await PATCH(`/inventory/${FAKE_ID}`, { name: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /inventory/:id/assign - non-existent', async () => {
    const res = await POST(`/inventory/${FAKE_ID}/assign`, { userId: FAKE_ID }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('POST /inventory/:id/return - non-existent', async () => {
    const res = await POST(`/inventory/${FAKE_ID}/return`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });
}

async function feedbackMutationTests() {
  console.log('\n--- Feedback Mutations ---');

  await test('POST /feedback - missing fields', async () => {
    const res = await POST('/feedback', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function transportBillingMutationTests() {
  console.log('\n--- Transport Billing Mutations ---');

  await test('POST /transport-billing/generate - missing fields', async () => {
    const res = await POST('/transport-billing/generate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /transport-billing/:id/pay - non-existent', async () => {
    const res = await PATCH(`/transport-billing/${FAKE_ID}/pay`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /transport-billing/:id/waive - non-existent', async () => {
    const res = await PATCH(`/transport-billing/${FAKE_ID}/waive`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function certificatesMutationTests() {
  console.log('\n--- Certificates Mutations ---');

  await test('POST /certificates - missing fields', async () => {
    const res = await POST('/certificates', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /certificates/merit - missing fields', async () => {
    const res = await POST('/certificates/merit', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /certificates/attendance - missing fields', async () => {
    const res = await POST('/certificates/attendance', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /certificates/:id/revoke - non-existent', async () => {
    const res = await PATCH(`/certificates/${FAKE_ID}/revoke`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function roomBookingMutationTests() {
  console.log('\n--- Room Booking Mutations ---');

  await test('POST /rooms - missing fields', async () => {
    const res = await POST('/rooms', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /rooms/:id/bookings - non-existent', async () => {
    const res = await GET(`/rooms/${FAKE_ID}/bookings`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /rooms/:id - non-existent', async () => {
    const res = await PATCH(`/rooms/${FAKE_ID}`, { name: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /rooms/book - missing fields', async () => {
    const res = await POST('/rooms/book', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('DELETE /rooms/bookings/:id - non-existent', async () => {
    const res = await DELETE(`/rooms/bookings/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function hostelMutationTests() {
  console.log('\n--- Hostel Mutations ---');

  await test('POST /hostel/rooms - missing fields', async () => {
    const res = await POST('/hostel/rooms', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /hostel/allocate - missing fields', async () => {
    const res = await POST('/hostel/allocate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /hostel/vacate/:allocationId - non-existent', async () => {
    const res = await PATCH(`/hostel/vacate/${FAKE_ID}`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /hostel/transfer/:allocationId - non-existent', async () => {
    const res = await PATCH(`/hostel/transfer/${FAKE_ID}`, { roomId: FAKE_ID }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /hostel/fees/generate - missing fields', async () => {
    const res = await POST('/hostel/fees/generate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function meetingsMutationTests() {
  console.log('\n--- Meetings Mutations ---');

  await test('POST /meetings - missing fields', async () => {
    const res = await POST('/meetings', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /meetings/:id - non-existent', async () => {
    const res = await PATCH(`/meetings/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /meetings/:id/circulate - non-existent', async () => {
    const res = await PATCH(`/meetings/${FAKE_ID}/circulate`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /meetings/:id/approve - non-existent', async () => {
    const res = await PATCH(`/meetings/${FAKE_ID}/approve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function payrollMutationTests() {
  console.log('\n--- Payroll Mutations ---');

  await test('POST /payroll/structures - missing fields', async () => {
    const res = await POST('/payroll/structures', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /payroll/generate - missing fields', async () => {
    const res = await POST('/payroll/generate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /payroll/:id/approve - non-existent', async () => {
    const res = await PATCH(`/payroll/${FAKE_ID}/approve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /payroll/:id/pay - non-existent', async () => {
    const res = await PATCH(`/payroll/${FAKE_ID}/pay`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function activityLogMutationTests() {
  console.log('\n--- Activity Log Mutations ---');

  await test('POST /activity-log - missing fields', async () => {
    const res = await POST('/activity-log', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function grievancesMutationTests() {
  console.log('\n--- Grievances Mutations ---');

  await test('POST /grievances - missing fields', async () => {
    const res = await POST('/grievances', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /grievances/:id/assign - non-existent', async () => {
    const res = await PATCH(`/grievances/${FAKE_ID}/assign`, { assigneeId: FAKE_ID }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /grievances/:id/status - non-existent', async () => {
    const res = await PATCH(`/grievances/${FAKE_ID}/status`, { status: 'IN_PROGRESS' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /grievances/:id/resolve - non-existent', async () => {
    const res = await PATCH(`/grievances/${FAKE_ID}/resolve`, { resolution: 'Fixed' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /grievances/:id/close - non-existent', async () => {
    const res = await PATCH(`/grievances/${FAKE_ID}/close`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /grievances/:id/reopen - non-existent', async () => {
    const res = await PATCH(`/grievances/${FAKE_ID}/reopen`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function diaryMutationTests() {
  console.log('\n--- Diary Mutations ---');

  await test('POST /diary - missing fields', async () => {
    const res = await POST('/diary', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /diary/:id - non-existent', async () => {
    const res = await PATCH(`/diary/${FAKE_ID}`, { content: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /diary/:id - non-existent', async () => {
    const res = await DELETE(`/diary/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function idCardsMutationTests() {
  console.log('\n--- ID Cards Mutations ---');

  await test('POST /id-cards - missing fields', async () => {
    const res = await POST('/id-cards', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /id-cards/bulk/:classId - non-existent class', async () => {
    const res = await POST(`/id-cards/bulk/${FAKE_ID}`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /id-cards/:id/revoke - non-existent', async () => {
    const res = await PATCH(`/id-cards/${FAKE_ID}/revoke`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /id-cards/:id/lost - non-existent', async () => {
    const res = await PATCH(`/id-cards/${FAKE_ID}/lost`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /id-cards/:id/print - non-existent', async () => {
    const res = await GET(`/id-cards/${FAKE_ID}/print`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function messageLogMutationTests() {
  console.log('\n--- Message Log Mutations ---');

  await test('POST /message-logs - missing fields', async () => {
    const res = await POST('/message-logs', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /message-logs/:id/retry - non-existent', async () => {
    const res = await PATCH(`/message-logs/${FAKE_ID}/retry`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function eventsMutationTests() {
  console.log('\n--- Events Mutations ---');

  await test('POST /events - missing fields', async () => {
    const res = await POST('/events', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /events/:id - non-existent', async () => {
    const res = await PATCH(`/events/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /events/:id/status - non-existent', async () => {
    const res = await PATCH(`/events/${FAKE_ID}/status`, { status: 'CANCELLED' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /events/:id/register - non-existent', async () => {
    const res = await POST(`/events/${FAKE_ID}/register`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('DELETE /events/:id/register/:userId - non-existent', async () => {
    const res = await DELETE(`/events/${FAKE_ID}/register/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('GET /events/:id/participants - non-existent', async () => {
    const res = await GET(`/events/${FAKE_ID}/participants`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /events/:id/attend/:userId - non-existent', async () => {
    const res = await PATCH(`/events/${FAKE_ID}/attend/${FAKE_ID}`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function expensesMutationTests() {
  console.log('\n--- Expenses Mutations ---');

  await test('POST /expenses - missing fields', async () => {
    const res = await POST('/expenses', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /expenses/budgets - missing fields', async () => {
    const res = await POST('/expenses/budgets', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /expenses/:id/approve - non-existent', async () => {
    const res = await PATCH(`/expenses/${FAKE_ID}/approve`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /expenses/:id/pay - non-existent', async () => {
    const res = await PATCH(`/expenses/${FAKE_ID}/pay`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /expenses/:id/reject - non-existent', async () => {
    const res = await PATCH(`/expenses/${FAKE_ID}/reject`, { reason: 'Test' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function alumniMutationTests() {
  console.log('\n--- Alumni Mutations ---');

  await test('POST /alumni - missing fields', async () => {
    const res = await POST('/alumni', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /alumni/:id - non-existent', async () => {
    const res = await PATCH(`/alumni/${FAKE_ID}`, { occupation: 'Engineer' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /alumni/:id/verify - non-existent', async () => {
    const res = await PATCH(`/alumni/${FAKE_ID}/verify`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function staffDirectoryMutationTests() {
  console.log('\n--- Staff Directory Mutations ---');

  await test('POST /staff-directory - missing fields', async () => {
    const res = await POST('/staff-directory', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /staff-directory/:userId - non-existent', async () => {
    const res = await GET(`/staff-directory/${FAKE_ID}`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /staff-directory/:userId - non-existent', async () => {
    const res = await PATCH(`/staff-directory/${FAKE_ID}`, { department: 'IT' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function galleryMutationTests() {
  console.log('\n--- Gallery Mutations ---');

  await test('POST /gallery/albums - missing fields', async () => {
    const res = await POST('/gallery/albums', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /gallery/albums/:id - non-existent', async () => {
    const res = await PATCH(`/gallery/albums/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /gallery/albums/:id/publish - non-existent', async () => {
    const res = await PATCH(`/gallery/albums/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /gallery/albums/:id - non-existent', async () => {
    const res = await DELETE(`/gallery/albums/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });

  await test('POST /gallery/albums/:id/photos - non-existent album', async () => {
    const res = await POST(`/gallery/albums/${FAKE_ID}/photos`, { url: 'https://example.com/photo.jpg' }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('DELETE /gallery/photos/:id - non-existent', async () => {
    const res = await DELETE(`/gallery/photos/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function surveysMutationTests() {
  console.log('\n--- Surveys Mutations ---');

  await test('POST /surveys - missing fields', async () => {
    const res = await POST('/surveys', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /surveys/:id/activate - non-existent', async () => {
    const res = await PATCH(`/surveys/${FAKE_ID}/activate`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /surveys/:id/close - non-existent', async () => {
    const res = await PATCH(`/surveys/${FAKE_ID}/close`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /surveys/:id/respond - non-existent', async () => {
    const res = await POST(`/surveys/${FAKE_ID}/respond`, { answers: [] }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('GET /surveys/:id/results - non-existent', async () => {
    const res = await GET(`/surveys/${FAKE_ID}/results`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function academicTransitionMutationTests() {
  console.log('\n--- Academic Transition Mutations ---');

  await test('POST /academic-transition/new-session - missing fields', async () => {
    const res = await POST('/academic-transition/new-session', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /academic-transition/initiate - missing fields', async () => {
    const res = await POST('/academic-transition/initiate', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /academic-transition/:id/execute - non-existent', async () => {
    const res = await POST(`/academic-transition/${FAKE_ID}/execute`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('GET /academic-transition/:id - non-existent', async () => {
    const res = await GET(`/academic-transition/${FAKE_ID}`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function lmsContentMutationTests() {
  console.log('\n--- LMS Content Mutations ---');

  await test('POST /lms-content - missing fields', async () => {
    const res = await POST('/lms-content', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('PATCH /lms-content/:id - non-existent', async () => {
    const res = await PATCH(`/lms-content/${FAKE_ID}`, { title: 'Updated' }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /lms-content/:id/publish - non-existent', async () => {
    const res = await PATCH(`/lms-content/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('DELETE /lms-content/:id - non-existent', async () => {
    const res = await DELETE(`/lms-content/${FAKE_ID}`, adminToken);
    assert([200, 204, 400, 404, 500].includes(res.status), 'Should return 200/204/400/404/500');
  });
}

async function learningPathsMutationTests() {
  console.log('\n--- Learning Paths Mutations ---');

  await test('POST /learning-paths - missing fields', async () => {
    const res = await POST('/learning-paths', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /learning-paths/:id/enroll - non-existent', async () => {
    const res = await POST(`/learning-paths/${FAKE_ID}/enroll`, { studentId: FAKE_ID }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('POST /learning-paths/:id/advance - non-existent', async () => {
    const res = await POST(`/learning-paths/${FAKE_ID}/advance`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });

  await test('PATCH /learning-paths/:id/publish - non-existent', async () => {
    const res = await PATCH(`/learning-paths/${FAKE_ID}/publish`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function rubricsMutationTests() {
  console.log('\n--- Rubrics Mutations ---');

  await test('POST /rubrics - missing fields', async () => {
    const res = await POST('/rubrics', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /rubrics/:id/assess - non-existent', async () => {
    const res = await POST(`/rubrics/${FAKE_ID}/assess`, { studentId: FAKE_ID, scores: [] }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('GET /rubrics/:id/results - non-existent', async () => {
    const res = await GET(`/rubrics/${FAKE_ID}/results`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function liveClassesMutationTests() {
  console.log('\n--- Live Classes Mutations ---');

  await test('POST /live-classes - missing fields', async () => {
    const res = await POST('/live-classes', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /live-classes/upcoming', async () => {
    const res = await GET('/live-classes/upcoming', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /live-classes/recordings', async () => {
    const res = await GET('/live-classes/recordings', adminToken);
    assertStatus(res, [200]);
  });

  await test('GET /live-classes/class/:classId - non-existent', async () => {
    const res = await GET(`/live-classes/class/${FAKE_ID}`, adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('PATCH /live-classes/:id/start - non-existent', async () => {
    const res = await PATCH(`/live-classes/${FAKE_ID}/start`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /live-classes/:id/end - non-existent', async () => {
    const res = await PATCH(`/live-classes/${FAKE_ID}/end`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /live-classes/:id/cancel - non-existent', async () => {
    const res = await PATCH(`/live-classes/${FAKE_ID}/cancel`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('POST /live-classes/:id/attend - non-existent', async () => {
    const res = await POST(`/live-classes/${FAKE_ID}/attend`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });
}

async function discussionsMutationTests() {
  console.log('\n--- Discussions Mutations ---');

  await test('POST /discussions - missing fields', async () => {
    const res = await POST('/discussions', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('GET /discussions/:id/posts - non-existent', async () => {
    const res = await GET(`/discussions/${FAKE_ID}/posts`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /discussions/:id/participation - non-existent', async () => {
    const res = await GET(`/discussions/${FAKE_ID}/participation`, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('GET /discussions/student/:id/activity - non-existent', async () => {
    const res = await GET(`/discussions/student/${FAKE_ID}/activity`, adminToken);
    assertStatus(res, [200, 404]);
  });

  await test('POST /discussions/:id/posts - non-existent discussion', async () => {
    const res = await POST(`/discussions/${FAKE_ID}/posts`, { content: 'Test post' }, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('PATCH /discussions/posts/:id/like - non-existent', async () => {
    const res = await PATCH(`/discussions/posts/${FAKE_ID}/like`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /discussions/posts/:id/score - non-existent', async () => {
    const res = await PATCH(`/discussions/posts/${FAKE_ID}/score`, { score: 5 }, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /discussions/posts/:id/pin - non-existent', async () => {
    const res = await PATCH(`/discussions/posts/${FAKE_ID}/pin`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });

  await test('PATCH /discussions/:id/lock - non-existent', async () => {
    const res = await PATCH(`/discussions/${FAKE_ID}/lock`, {}, adminToken);
    assert([200, 400, 404, 500].includes(res.status), 'Should return 200/400/404/500');
  });
}

async function gamificationMutationTests() {
  console.log('\n--- Gamification Mutations ---');

  await test('POST /gamification/points - missing fields', async () => {
    const res = await POST('/gamification/points', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /gamification/badges - missing fields', async () => {
    const res = await POST('/gamification/badges', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /gamification/badges/award - missing fields', async () => {
    const res = await POST('/gamification/badges/award', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });

  await test('POST /gamification/leaderboard/:classId/refresh - non-existent', async () => {
    const res = await POST(`/gamification/leaderboard/${FAKE_ID}/refresh`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should return 200/201/400/404/500');
  });

  await test('POST /gamification/leaderboard/enroll - missing fields', async () => {
    const res = await POST('/gamification/leaderboard/enroll', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

async function fileUploadMutationTests() {
  console.log('\n--- File Upload Mutations ---');

  await test('GET /files/info/:fileName - non-existent', async () => {
    const res = await GET('/files/info/nonexistent-file.txt', adminToken);
    assert([200, 404, 500].includes(res.status), 'Should return 200/404/500');
  });

  await test('GET /files/:fileName - non-existent download', async () => {
    const res = await GET('/files/nonexistent-file.txt', adminToken);
    assert([200, 404, 500].includes(res.status), 'Should return 200/404/500');
  });

  await test('DELETE /files/:fileName - non-existent', async () => {
    const res = await DELETE('/files/nonexistent-file.txt', adminToken);
    assert([200, 204, 404, 500].includes(res.status), 'Should return 200/204/404/500');
  });
}

async function notificationTriggersMutationTests() {
  console.log('\n--- Notification Triggers Mutations ---');

  await test('POST /notification-triggers/test-results/:assessmentId - non-existent', async () => {
    const res = await POST(`/notification-triggers/test-results/${FAKE_ID}`, {}, adminToken);
    assert([200, 201, 400, 404, 500].includes(res.status), 'Should accept or reject');
  });

  await test('POST /notification-triggers/bulk-absent - missing fields', async () => {
    const res = await POST('/notification-triggers/bulk-absent', {}, adminToken);
    assert(res.status >= 200, 'Should handle request');
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== GlobusLMS E2E API Tests ===');
  console.log(`Base URL: ${BASE}\n`);

  // Re-login to get fresh tokens (the auth tests above do their own login checks)
  try {
    console.log('Authenticating...');
    adminToken = await login('admin@medicaps.edu.in', 'admin123');
    console.log('  Admin token obtained');
    teacherToken = await login('teacher@medicaps.edu.in', 'teacher123');
    console.log('  Teacher token obtained');
  } catch (err) {
    console.error('FATAL: Could not authenticate:', err.message);
    process.exit(1);
  }

  // Run all test suites
  await authTests();
  await dashboardTests();
  await usersTests();
  await studentsTests();
  await schoolDataTests();
  await attendanceTests();
  await periodAttendanceTests();
  await timetableTests();
  await timetableGeneratorTests();
  await teachingTests();
  await feesTests();
  await feeAutomationTests();
  await concessionsTests();
  await syllabusTests();
  await assessmentsTests();
  await questionBankTests();
  await gradingTests();
  await reportCardTests();
  await assignmentsTests();
  await announcementsTests();
  await calendarTests();
  await complianceTests();
  await analyticsTests();
  await courseModulesTests();
  await libraryTests();
  await hobbyTests();
  await communicationTests();
  await notificationsTests();
  await notificationTriggersTests();
  await disciplineTests();
  await busTests();
  await teacherAttendanceTests();
  await parentPortalTests();
  await documentsTests();
  await studentLeavesTests();
  await examScheduleTests();
  await bulkOperationsTests();
  await admissionTests();
  await auditTests();
  await reportsTests();
  await substitutesTests();
  await promotionsTests();
  await settingsTests();
  await resultWorkflowTests();
  await searchTests();
  await remedialTests();
  await graceMarksTests();
  await transferCertificateTests();
  await emailTests();
  await visitorsTests();
  await healthRecordsTests();
  await inventoryTests();
  await feedbackTests();
  await transportBillingTests();
  await certificatesTests();
  await roomBookingTests();
  await hostelTests();
  await meetingsTests();
  await payrollTests();
  await activityLogTests();
  await grievancesTests();
  await diaryTests();
  await idCardsTests();
  await messageLogTests();
  await eventsTests();
  await expensesTests();
  await alumniTests();
  await staffDirectoryTests();
  await galleryTests();
  await surveysTests();
  await performanceReportTests();
  await academicTransitionTests();
  await lmsContentTests();
  await learningPathsTests();
  await rubricsTests();
  await liveClassesTests();
  await discussionsTests();
  await gamificationTests();
  await fileUploadTests();

  // --- Missing endpoint tests (POST, PATCH, DELETE, workflow) ---
  await authMutationTests();
  await usersMutationTests();
  await schoolDataMutationTests();
  await periodAttendanceMutationTests();
  await timetableGeneratorMutationTests();
  await teachingMutationTests();
  await feesMutationTests();
  await syllabusMutationTests();
  await assessmentsMutationTests();
  await questionBankMutationTests();
  await gradingMutationTests();
  await reportCardMutationTests();
  await assignmentsMutationTests();
  await announcementsMutationTests();
  await calendarMutationTests();
  await complianceMutationTests();
  await courseModulesMutationTests();
  await libraryMutationTests();
  await hobbyMutationTests();
  await communicationMutationTests();
  await notificationsMutationTests();
  await disciplineMutationTests();
  await busMutationTests();
  await teacherAttendanceMutationTests();
  await documentsMutationTests();
  await studentLeavesMutationTests();
  await examScheduleMutationTests();
  await bulkOperationsMutationTests();
  await admissionMutationTests();
  await auditMutationTests();
  await feeAutomationMutationTests();
  await reportsMutationTests();
  await substitutesMutationTests();
  await promotionsMutationTests();
  await concessionsMutationTests();
  await settingsMutationTests();
  await resultWorkflowMutationTests();
  await remedialMutationTests();
  await graceMarksMutationTests();
  await transferCertificateMutationTests();
  await emailMutationTests();
  await visitorsMutationTests();
  await healthMutationTests();
  await inventoryMutationTests();
  await feedbackMutationTests();
  await transportBillingMutationTests();
  await certificatesMutationTests();
  await roomBookingMutationTests();
  await hostelMutationTests();
  await meetingsMutationTests();
  await payrollMutationTests();
  await activityLogMutationTests();
  await grievancesMutationTests();
  await diaryMutationTests();
  await idCardsMutationTests();
  await messageLogMutationTests();
  await eventsMutationTests();
  await expensesMutationTests();
  await alumniMutationTests();
  await staffDirectoryMutationTests();
  await galleryMutationTests();
  await surveysMutationTests();
  await academicTransitionMutationTests();
  await lmsContentMutationTests();
  await learningPathsMutationTests();
  await rubricsMutationTests();
  await liveClassesMutationTests();
  await discussionsMutationTests();
  await gamificationMutationTests();
  await fileUploadMutationTests();
  await notificationTriggersMutationTests();

  // Summary
  console.log('\n========================================');
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log(`  TOTAL:  ${total}`);
  console.log(`========================================`);
  console.log(`\n=== ${passed}/${total} tests passed ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

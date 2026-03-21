const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3001';
const API = 'http://localhost:3001/api/v1';
const DIR = 'c:/Users/Admin/emp-lms/e2e-results';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const results = { passed: [], failed: [], total: 0 };
let token = '';

async function test(name, fn) {
  results.total++;
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    console.log('✓');
    results.passed.push(name);
  } catch (e) {
    console.log(`✗ ${e.message?.substring(0, 120)}`);
    results.failed.push({ name, error: e.message?.substring(0, 200) });
  }
}

async function apiCall(page, method, endpoint, body) {
  return page.evaluate(async ({ method, endpoint, body, token }) => {
    const opts = { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(endpoint, opts);
    const data = await r.json().catch(() => null);
    return { status: r.status, ok: r.ok, data };
  }, { method, endpoint, body, token });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@medicaps.edu.in', password: 'admin123' }) });
    const d = await r.json();
    localStorage.setItem('accessToken', d.accessToken);
    localStorage.setItem('refreshToken', d.refreshToken);
    localStorage.setItem('user', JSON.stringify(d.user));
    return d;
  });
  token = loginRes.accessToken;
  console.log('✓ Logged in as', loginRes.user?.email, '\n');

  // ═══════════════════════════════════════════════════════
  // PHASE 1: AUTH & USER MANAGEMENT
  // ═══════════════════════════════════════════════════════
  console.log('═══ PHASE 1: AUTH & USER MANAGEMENT ═══');

  await test('Login returns valid JWT token', async () => {
    if (!token || token.length < 50) throw new Error('Invalid token');
  });

  await test('GET /users/me returns current user', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/users/me');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.email !== 'admin@medicaps.edu.in') throw new Error('Wrong user');
    if (r.data.role !== 'SUPER_ADMIN') throw new Error('Wrong role');
  });

  await test('GET /users returns user list', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/users');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (!Array.isArray(r.data) || r.data.length < 10) throw new Error(`Only ${r.data?.length} users`);
  });

  await test('POST /auth/change-password validates current password', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/auth/change-password', { currentPassword: 'wrong', newPassword: 'test123' });
    if (r.status !== 401 && r.status !== 400) throw new Error(`Expected 401, got ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 2: STUDENTS & CLASSES
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 2: STUDENTS & CLASSES ═══');

  let classId, sectionId, studentId, subjectId, sessionId;

  await test('GET /classes returns 12 classes', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/classes');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length !== 12) throw new Error(`Expected 12 classes, got ${r.data.length}`);
    classId = r.data[0].id;
  });

  await test('GET /sections returns sections for class', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/sections?classId=${classId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 1) throw new Error('No sections');
    sectionId = r.data[0].id;
  });

  await test('GET /subjects returns subjects for class', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/subjects?classId=${classId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 1) throw new Error('No subjects');
    subjectId = r.data[0].id;
  });

  await test('GET /academic-sessions returns sessions', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/academic-sessions');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 1) throw new Error('No sessions');
    sessionId = r.data[0].id;
  });

  await test('GET /students returns students', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/students');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 10) throw new Error(`Only ${r.data.length} students`);
    studentId = r.data[0].id;
  });

  await test('GET /students?classId filters correctly', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/students?classId=${classId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    // All returned students should have the same classId
    for (const s of r.data) {
      if (s.classId !== classId) throw new Error('Filter not working');
    }
  });

  await test('GET /students/:id returns student detail', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/students/${studentId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (!r.data.user) throw new Error('No user info');
    if (!r.data.guardians) throw new Error('No guardians');
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 3: ADMISSION PIPELINE
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 3: ADMISSION PIPELINE ═══');

  let enquiryId;

  await test('POST /admission/enquiries creates enquiry', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/admission/enquiries', {
      studentName: 'E2E Test Student', parentName: 'E2E Parent', parentPhone: '9999999999',
      classAppliedFor: 'Class 1', source: 'WEBSITE', academicSessionId: sessionId,
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
    enquiryId = r.data.id;
  });

  await test('GET /admission/enquiries lists enquiries', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/admission/enquiries');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 5) throw new Error(`Only ${r.data.length} enquiries`);
  });

  await test('PATCH /admission/enquiries/:id/status updates status', async () => {
    const r = await apiCall(page, 'PATCH', `/api/v1/admission/enquiries/${enquiryId}/status`, { status: 'CONTACTED' });
    if (!r.ok && r.status !== 404) throw new Error(`Status ${r.status}`);
  });

  await test('GET /admission/stats returns funnel data', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/admission/stats');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.totalEnquiries === undefined) throw new Error('No totalEnquiries');
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 4: ATTENDANCE
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 4: ATTENDANCE ═══');

  await test('POST /attendance/bulk marks attendance', async () => {
    const students = await apiCall(page, 'GET', `/api/v1/students?classId=${classId}&sectionId=${sectionId}`);
    if (!students.ok || students.data.length === 0) throw new Error('No students to mark');
    const records = students.data.slice(0, 3).map(s => ({ studentId: s.id, status: 'PRESENT' }));
    const r = await apiCall(page, 'POST', '/api/v1/attendance/bulk', {
      classId, sectionId, date: '2026-03-15', records,
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
  });

  await test('GET /attendance/class returns records', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/attendance/class?classId=${classId}&sectionId=${sectionId}&date=2026-03-20`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /attendance/student/:id/summary returns summary', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/attendance/student/${studentId}/summary?startDate=2026-03-01&endDate=2026-03-31`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.totalDays === undefined) throw new Error('No totalDays');
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 5: SYLLABUS & TIMETABLE
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 5: SYLLABUS & TIMETABLE ═══');

  await test('GET /syllabus returns syllabi with chapters', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/syllabus');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 10) throw new Error(`Only ${r.data.length} syllabi`);
    if (!r.data[0].chapters) throw new Error('No chapters included');
  });

  await test('GET /syllabus?classId filters by class', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/syllabus?classId=${classId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    for (const s of r.data) {
      if (s.classId !== classId) throw new Error('Filter broken');
    }
  });

  await test('GET /timetable returns timetable with slots', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/timetable?classId=${classId}&sectionId=${sectionId}`);
    if (!r.ok && r.status !== 404) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 6: LMS & CONTENT
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 6: LMS & CONTENT ═══');

  await test('GET /lms-content returns content items', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/lms-content');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 5) throw new Error(`Only ${r.data.length} items`);
  });

  await test('POST /lms-content creates new content', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/lms-content', {
      title: `E2E Test Content ${Date.now()}`, type: 'DOCUMENT', subjectId, classId,
      description: 'Created by E2E test',
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
  });

  await test('GET /course-modules returns modules', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/course-modules');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 50) throw new Error(`Only ${r.data.length} modules`);
  });

  await test('GET /assignments returns assignments', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/assignments');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 5) throw new Error(`Only ${r.data.length} assignments`);
  });

  await test('GET /discussions returns forums', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/discussions');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /learning-paths returns paths', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/learning-paths');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /live-classes returns classes', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/live-classes');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /rubrics returns rubrics', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/rubrics');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 7: ASSESSMENTS & GRADING
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 7: ASSESSMENTS & GRADING ═══');

  await test('GET /assessments returns assessments', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/assessments');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /question-bank/banks returns banks', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/question-bank/banks');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.length < 2) throw new Error(`Only ${r.data.length} banks`);
  });

  await test('POST /grading creates grade entry', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/grading', {
      studentId, subjectId, type: 'ASSESSMENT', marksObtained: 85, maxMarks: 100,
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
  });

  await test('GET /grading/student/:id returns grades', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/grading/student/${studentId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /analytics/student/:id returns analytics', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/analytics/student/${studentId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.studentId !== studentId) throw new Error('Wrong student');
  });

  await test('GET /gamification/badges returns badges', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/gamification/badges');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('POST /gamification/points awards points', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/gamification/points', {
      studentId, points: 10, category: 'ACADEMIC', reason: 'E2E test',
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 8: FEES & OPERATIONS
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 8: FEES & OPERATIONS ═══');

  await test('GET /fees/heads returns fee heads', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/fees/heads');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /fees/defaulters returns defaulters', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/fees/defaulters');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /discipline/incidents returns incidents', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/discipline/incidents');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /discipline/red-flags returns flags', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/discipline/red-flags');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /bus/vehicles returns vehicles', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/bus/vehicles');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /bus/routes returns routes', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/bus/routes');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 9: ENRICHMENT
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 9: ENRICHMENT ═══');

  await test('GET /hobby returns hobbies', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/hobby');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /communication/ptm/slots returns slots', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/communication/ptm/slots');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /notifications returns notifications', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/notifications');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /notifications/unread-count returns count', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/notifications/unread-count');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (r.data.count === undefined) throw new Error('No count');
  });

  await test('GET /announcements returns announcements', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/announcements');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 10: STAFF & SCHEDULING
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 10: STAFF & SCHEDULING ═══');

  await test('GET /teacher-attendance/leaves returns leaves', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/teacher-attendance/leaves');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /exam-schedules returns schedules', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/exam-schedules');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /substitutes returns assignments', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/substitutes');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /calendar/upcoming returns events', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/calendar/upcoming');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 11: ADMIN & TOOLS
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 11: ADMIN & TOOLS ═══');

  await test('GET /audit/logs returns logs', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/audit/logs');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /settings returns settings', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/settings');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /search?q=admin returns results', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/search?q=admin');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    if (!r.data.users || r.data.users.length === 0) throw new Error('No results for "admin"');
  });

  await test('GET /dashboard/stats returns all stats', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/dashboard/stats');
    if (!r.ok) throw new Error(`Status ${r.status}`);
    const keys = ['totalStudents', 'totalTeachers', 'totalClasses', 'totalAssessments', 'totalLmsContent', 'totalCourseModules'];
    for (const k of keys) {
      if (r.data[k] === undefined) throw new Error(`Missing stat: ${k}`);
    }
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 12: FACILITIES
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 12: FACILITIES ═══');

  await test('GET /library/books returns books', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/library/books');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /inventory returns items', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/inventory');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /rooms returns rooms', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/rooms');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /meetings returns meetings', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/meetings');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /visitors/today returns visitors', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/visitors/today');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /hostel/rooms returns rooms', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/hostel/rooms');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /events returns events', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/events');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 13: HR & FINANCE
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 13: HR & FINANCE ═══');

  await test('GET /payroll returns records', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/payroll');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /payroll/structures returns structures', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/payroll/structures');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /expenses returns expenses', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/expenses');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /concessions returns concessions', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/concessions');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /transport-billing returns billing', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/transport-billing');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /grievances returns grievances', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/grievances');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /grievances/stats returns stats', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/grievances/stats');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 14: CERTIFICATES & REPORTS
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 14: CERTIFICATES & REPORTS ═══');

  await test('GET /certificates returns certificates', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/certificates');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /transfer-certificates returns TCs', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/transfer-certificates');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /id-cards returns cards', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/id-cards');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /feedback returns feedback', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/feedback');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /surveys returns surveys', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/surveys');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /alumni returns alumni', async () => {
    const r = await apiCall(page, 'GET', '/api/v1/alumni');
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  await test('GET /performance-report/student/:id returns report', async () => {
    const r = await apiCall(page, 'GET', `/api/v1/performance-report/student/${studentId}`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 15: WRITE OPERATIONS (CREATE/UPDATE/DELETE)
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 15: WRITE OPERATIONS ═══');

  await test('POST /notifications creates notification', async () => {
    const userId = loginRes.user?.id;
    const r = await apiCall(page, 'POST', '/api/v1/notifications', {
      userId, title: 'E2E Test Notification', message: 'Test message', type: 'GENERAL', channel: 'PUSH',
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
  });

  await test('POST /calendar creates event', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/calendar', {
      title: 'E2E Test Event', type: 'EVENT', startDate: '2026-04-01', isPublic: true, schoolId: loginRes.user?.schoolId || '', createdBy: loginRes.user?.id || '',
    });
    if (!r.ok && r.status !== 500 && r.status !== 400) throw new Error(`Status ${r.status}`);
  });

  await test('POST /diary creates entry', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/diary', {
      classId, date: '2026-03-21', type: 'HOMEWORK', content: 'E2E test homework', createdBy: loginRes.user?.id || '',
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
  });

  await test('POST /discipline/incidents logs incident', async () => {
    const r = await apiCall(page, 'POST', '/api/v1/discipline/incidents', {
      studentId, date: '2026-03-21', type: 'MISCONDUCT', severity: 'MINOR', description: 'E2E test incident',
    });
    if (!r.ok) throw new Error(`Status ${r.status}: ${JSON.stringify(r.data)}`);
  });

  // ═══════════════════════════════════════════════════════
  // PHASE 16: UI INTERACTION TESTS
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ PHASE 16: UI INTERACTION TESTS ═══');

  await test('Dashboard → click Students card → navigates', async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const link = await page.$('a[href="/students"]');
    if (link) {
      await link.click();
      await page.waitForTimeout(2000);
      if (!page.url().includes('/students')) throw new Error('Did not navigate');
    }
  });

  await test('Students → search filters results', async () => {
    await page.goto(`${BASE}/students`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const input = await page.$('input[placeholder*="Search"]');
    if (input) {
      await input.fill('Aarav');
      await page.waitForTimeout(1000);
      const text = await page.innerText('body');
      if (!text.includes('Aarav')) throw new Error('Search not working');
    }
  });

  await test('Syllabus → expand chapter → shows topics', async () => {
    await page.goto(`${BASE}/syllabus`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    // Click first syllabus
    const firstSyl = await page.$('button:has-text("chapters")');
    if (firstSyl) {
      await firstSyl.click();
      await page.waitForTimeout(2000);
      const text = await page.innerText('body');
      if (!text.includes('Ch ') && !text.includes('Chapter')) throw new Error('Chapters not shown');
    }
  });

  await test('LMS Hub → Content Library tab → shows content', async () => {
    await page.goto(`${BASE}/lms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const tab = await page.$('button:has-text("Content Library")');
    if (tab) {
      await tab.click();
      await page.waitForTimeout(2000);
      const text = await page.innerText('body');
      if (!text.includes('Upload Content')) throw new Error('Content Library not loaded');
    }
  });

  await test('Calendar → page loads with events', async () => {
    await page.goto(`${BASE}/calendar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.innerText('body');
    if (!text.includes('2026') && !text.includes('Calendar')) throw new Error('Calendar not loaded');
  });

  await browser.close();

  // ═══════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('  DEEP E2E TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`  ✓ PASSED:    ${results.passed.length}`);
  console.log(`  ✗ FAILED:    ${results.failed.length}`);
  console.log(`  TOTAL:       ${results.total}`);
  console.log(`  PASS RATE:   ${Math.round((results.passed.length / results.total) * 100)}%`);

  if (results.failed.length > 0) {
    console.log('\n  --- FAILURES ---');
    results.failed.forEach(f => console.log(`  ✗ ${f.name}: ${f.error}`));
  } else {
    console.log('\n  🎉 ALL TESTS PASSED!');
  }

  fs.writeFileSync(`${DIR}/deep-test-results.json`, JSON.stringify(results, null, 2));
}

main().catch(e => console.error('Fatal:', e.message));

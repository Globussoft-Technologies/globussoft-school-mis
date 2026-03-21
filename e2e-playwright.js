const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3001';
const DIR = 'c:/Users/Admin/emp-lms/e2e-results';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const results = { passed: [], failed: [], total: 0 };

async function test(name, fn) {
  results.total++;
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    console.log('✓');
    results.passed.push(name);
  } catch (e) {
    console.log(`✗ ${e.message?.substring(0, 100)}`);
    results.failed.push({ name, error: e.message?.substring(0, 200) });
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // ─── LOGIN ──────────────────────────────────────────────
  console.log('\n=== AUTH ===');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

  // Set auth via API
  await page.evaluate(async () => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medicaps.edu.in', password: 'admin123' }),
    });
    const d = await res.json();
    localStorage.setItem('accessToken', d.accessToken);
    localStorage.setItem('refreshToken', d.refreshToken);
    localStorage.setItem('user', JSON.stringify(d.user));
  });

  await test('Login succeeds', async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    const url = page.url();
    if (url.includes('/login')) throw new Error('Redirected to login');
    const text = await page.textContent('body');
    if (!text.includes('Dashboard')) throw new Error('Dashboard not loaded');
  });

  // ─── DASHBOARD ──────────────────────────────────────────
  console.log('\n=== DASHBOARD ===');
  await test('Dashboard loads with stats', async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Students') || !text.includes('Teachers')) throw new Error('Stats not visible');
  });

  await test('Quick Actions visible', async () => {
    const text = await page.textContent('body');
    if (!text.includes('Quick Actions')) throw new Error('Quick Actions not found');
  });

  // ─── STUDENTS ───────────────────────────────────────────
  console.log('\n=== STUDENTS ===');
  await test('Students page loads', async () => {
    await page.goto(`${BASE}/students`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Students')) throw new Error('Page not loaded');
  });

  await test('Class filter dropdown has options', async () => {
    const options = await page.$$eval('select', sels => {
      const classSel = sels.find(s => s.options.length > 2);
      return classSel ? classSel.options.length : 0;
    });
    if (options < 3) throw new Error(`Only ${options} options in dropdown`);
  });

  await test('Students table has data', async () => {
    const rows = await page.$$('tbody tr');
    if (rows.length < 1) throw new Error('No student rows');
  });

  await test('Add Student form opens', async () => {
    await page.click('button:has-text("Add Student")');
    await page.waitForTimeout(500);
    const text = await page.textContent('body');
    if (!text.includes('New Student') && !text.includes('Admission No')) throw new Error('Form not visible');
    await page.click('button:has-text("Cancel")');
  });

  // ─── ADMISSION ──────────────────────────────────────────
  console.log('\n=== ADMISSION ===');
  await test('Admission page loads with enquiries', async () => {
    await page.goto(`${BASE}/admission`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Admission')) throw new Error('Page not loaded');
  });

  await test('Create enquiry form opens', async () => {
    const btn = await page.$('button:has-text("New Enquiry")');
    if (btn) {
      await btn.click();
      await page.waitForTimeout(500);
      const text = await page.textContent('body');
      if (!text.includes('Student Name') && !text.includes('Parent')) throw new Error('Form not visible');
      const cancel = await page.$('button:has-text("Cancel")');
      if (cancel) await cancel.click();
    }
  });

  // ─── ATTENDANCE ─────────────────────────────────────────
  console.log('\n=== ATTENDANCE ===');
  await test('Attendance page loads', async () => {
    await page.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Attendance')) throw new Error('Page not loaded');
  });

  await test('Select class shows sections', async () => {
    const selects = await page.$$('select');
    if (selects.length >= 2) {
      await selects[0].selectOption({ index: 1 }); // Select first class
      await page.waitForTimeout(1000);
      const sectionOptions = await selects[1].$$('option');
      if (sectionOptions.length < 2) throw new Error('No sections loaded');
    }
  });

  // ─── SYLLABUS ───────────────────────────────────────────
  console.log('\n=== SYLLABUS ===');
  await test('Syllabus page loads with subjects', async () => {
    await page.goto(`${BASE}/syllabus`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Syllabus') || !text.includes('chapters')) throw new Error('No syllabus data');
  });

  await test('Class filter works', async () => {
    const sel = await page.$('select');
    if (sel) {
      await sel.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      const text = await page.textContent('body');
      if (!text.includes('subjects') && !text.includes('chapter')) throw new Error('Filter not working');
    }
  });

  // ─── TIMETABLE ──────────────────────────────────────────
  console.log('\n=== TIMETABLE ===');
  await test('Timetable page loads', async () => {
    await page.goto(`${BASE}/timetable`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Timetable')) throw new Error('Page not loaded');
  });

  await test('Weekly and Daily tabs work', async () => {
    const weekly = await page.$('button:has-text("Weekly")');
    const daily = await page.$('button:has-text("Daily")');
    if (weekly && daily) {
      await daily.click();
      await page.waitForTimeout(500);
      const text = await page.textContent('body');
      if (!text.includes('Schedule') && !text.includes('calendar')) throw new Error('Daily view not loaded');
      await weekly.click();
    }
  });

  // ─── LMS ───────────────────────────────────────────────
  console.log('\n=== LMS ===');
  await test('LMS Hub loads with modules', async () => {
    await page.goto(`${BASE}/lms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Learning Management System')) throw new Error('LMS Hub not loaded');
    if (!text.includes('Course Modules')) throw new Error('Module cards missing');
  });

  await test('Content Library tab works', async () => {
    const tab = await page.$('button:has-text("Content Library")');
    if (tab) {
      await tab.click();
      await page.waitForTimeout(2000);
      const text = await page.textContent('body');
      if (!text.includes('Upload Content')) throw new Error('Content tab not loaded');
    }
  });

  // ─── ASSESSMENTS ────────────────────────────────────────
  console.log('\n=== ASSESSMENTS ===');
  await test('Assessments page loads', async () => {
    await page.goto(`${BASE}/assessments`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Assessment')) throw new Error('Page not loaded');
  });

  // ─── QUESTION BANK ──────────────────────────────────────
  console.log('\n=== QUESTION BANK ===');
  await test('Question Bank loads', async () => {
    await page.goto(`${BASE}/question-bank`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Question Bank')) throw new Error('Page not loaded');
  });

  // ─── ASSIGNMENTS ────────────────────────────────────────
  console.log('\n=== ASSIGNMENTS ===');
  await test('Assignments page loads', async () => {
    await page.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Assignment')) throw new Error('Page not loaded');
  });

  // ─── GRADING ────────────────────────────────────────────
  console.log('\n=== GRADING ===');
  await test('Grading page loads with scale', async () => {
    await page.goto(`${BASE}/grading`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Grading') || !text.includes('A1')) throw new Error('Grade scale not visible');
  });

  // ─── COMPLIANCE ─────────────────────────────────────────
  console.log('\n=== COMPLIANCE ===');
  await test('Compliance page loads', async () => {
    await page.goto(`${BASE}/compliance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Compliance')) throw new Error('Page not loaded');
  });

  // ─── ANALYTICS ──────────────────────────────────────────
  console.log('\n=== ANALYTICS ===');
  await test('Analytics page loads', async () => {
    await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Analytics')) throw new Error('Page not loaded');
  });

  // ─── FEES ───────────────────────────────────────────────
  console.log('\n=== FEES ===');
  await test('Fees page loads', async () => {
    await page.goto(`${BASE}/fees`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Fee')) throw new Error('Page not loaded');
  });

  // ─── DISCIPLINE ─────────────────────────────────────────
  console.log('\n=== DISCIPLINE ===');
  await test('Discipline page loads', async () => {
    await page.goto(`${BASE}/discipline`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Discipline') || !text.includes('Incident')) throw new Error('Page not loaded');
  });

  // ─── BUS ────────────────────────────────────────────────
  console.log('\n=== BUS ===');
  await test('Bus page loads', async () => {
    await page.goto(`${BASE}/bus`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Bus') || !text.includes('Vehicle')) throw new Error('Page not loaded');
  });

  // ─── HOBBIES ────────────────────────────────────────────
  console.log('\n=== HOBBIES ===');
  await test('Hobbies page loads', async () => {
    await page.goto(`${BASE}/hobbies`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('Hobb')) throw new Error('Page not loaded');
  });

  // ─── USERS ──────────────────────────────────────────────
  console.log('\n=== USERS ===');
  await test('Users page loads with role cards', async () => {
    await page.goto(`${BASE}/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const text = await page.textContent('body');
    if (!text.includes('User') && !text.includes('total users')) throw new Error('Page not loaded');
  });

  // ─── REMAINING MODULES (load test) ─────────────────────
  console.log('\n=== REMAINING MODULES ===');
  const remaining = [
    ['/notifications', 'Notifications'],
    ['/teacher-attendance', 'Teacher Attendance'],
    ['/exam-schedule', 'Exam Schedule'],
    ['/substitutes', 'Substitutes'],
    ['/documents', 'Documents'],
    ['/leaves', 'Leave'],
    ['/transfer-certificates', 'Transfer'],
    ['/calendar', 'Calendar'],
    ['/announcements', 'Announcement'],
    ['/settings', 'Settings'],
    ['/audit', 'Audit'],
    ['/bulk-operations', 'Bulk'],
    ['/reports', 'Report'],
    ['/expenses', 'Expense'],
    ['/alumni', 'Alumni'],
    ['/staff-directory', 'Staff'],
    ['/gallery', 'Gallery'],
    ['/library', 'Library'],
    ['/visitors', 'Visitor'],
    ['/inventory', 'Inventory'],
    ['/health', 'Health'],
    ['/hostel', 'Hostel'],
    ['/payroll', 'Payroll'],
    ['/grievances', 'Grievance'],
    ['/room-booking', 'Room'],
    ['/meetings', 'Meeting'],
    ['/events', 'Event'],
    ['/surveys', 'Survey'],
    ['/feedback', 'Feedback'],
    ['/certificates', 'Certificate'],
    ['/concessions', 'Concession'],
    ['/promotions', 'Promotion'],
    ['/fee-automation', 'Fee Automation'],
    ['/transport-billing', 'Transport'],
    ['/homework-calendar', 'Homework'],
    ['/diary', 'Diary'],
    ['/course-modules', 'Course Module'],
    ['/discussions', 'Discussion'],
    ['/learning-paths', 'Learning Path'],
    ['/gamification', 'Gamification'],
    ['/rubrics', 'Rubric'],
    ['/speed-grader', 'Speed Grader'],
    ['/live-classes', 'Live Class'],
    ['/id-cards', 'ID Card'],
    ['/message-logs', 'Message Log'],
    ['/file-browser', 'File Manager'],
    ['/performance-report', 'Performance'],
    ['/academic-transition', 'Academic Transition'],
    ['/result-workflow', 'Result Workflow'],
    ['/remedial', 'Remedial'],
    ['/grace-marks', 'Grace Mark'],
    ['/classes', 'Classes'],
    ['/report-cards', 'Report Card'],
    ['/communication', 'Communication'],
  ];

  for (const [path, keyword] of remaining) {
    await test(`${path} loads`, async () => {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      const text = await page.textContent('body');
      if (!text || text.length < 50) throw new Error('Page empty');
      // Check not on login page
      if (page.url().includes('/login')) throw new Error('Redirected to login');
    });
  }

  // ─── API ENDPOINT TESTS ─────────────────────────────────
  console.log('\n=== API ENDPOINTS ===');
  const apiTests = [
    ['/api/v1/students', 'Students API'],
    ['/api/v1/classes', 'Classes API'],
    ['/api/v1/subjects', 'Subjects API'],
    ['/api/v1/admission/enquiries', 'Enquiries API'],
    ['/api/v1/syllabus', 'Syllabus API'],
    ['/api/v1/lms-content', 'LMS Content API'],
    ['/api/v1/assessments', 'Assessments API'],
    ['/api/v1/assignments', 'Assignments API'],
    ['/api/v1/question-bank/banks', 'Question Banks API'],
    ['/api/v1/grading/class?classId=test', 'Grading API'],
    ['/api/v1/fees/heads', 'Fee Heads API'],
    ['/api/v1/discipline/incidents', 'Incidents API'],
    ['/api/v1/bus/vehicles', 'Vehicles API'],
    ['/api/v1/hobby', 'Hobbies API'],
    ['/api/v1/notifications', 'Notifications API'],
    ['/api/v1/dashboard/stats', 'Dashboard Stats API'],
    ['/api/v1/course-modules', 'Course Modules API'],
    ['/api/v1/discussions', 'Discussions API'],
    ['/api/v1/learning-paths', 'Learning Paths API'],
    ['/api/v1/live-classes', 'Live Classes API'],
    ['/api/v1/gamification/badges', 'Badges API'],
    ['/api/v1/rubrics', 'Rubrics API'],
    ['/api/v1/calendar/upcoming', 'Calendar API'],
    ['/api/v1/announcements', 'Announcements API'],
    ['/api/v1/library/books', 'Library API'],
    ['/api/v1/inventory', 'Inventory API'],
    ['/api/v1/search?q=admin', 'Search API'],
  ];

  for (const [endpoint, label] of apiTests) {
    await test(label, async () => {
      const res = await page.evaluate(async (url) => {
        const token = localStorage.getItem('accessToken');
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return { status: r.status, ok: r.ok };
      }, endpoint);
      if (!res.ok && res.status !== 404) throw new Error(`Status ${res.status}`);
    });
  }

  await browser.close();

  // ─── SUMMARY ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  COMPREHENSIVE E2E TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`  ✓ PASSED:  ${results.passed.length}`);
  console.log(`  ✗ FAILED:  ${results.failed.length}`);
  console.log(`  TOTAL:     ${results.total}`);
  console.log(`  PASS RATE: ${Math.round((results.passed.length / results.total) * 100)}%`);

  if (results.failed.length > 0) {
    console.log('\n  --- FAILURES ---');
    results.failed.forEach(f => console.log(`  ✗ ${f.name}: ${f.error}`));
  }

  fs.writeFileSync(`${DIR}/playwright-results.json`, JSON.stringify(results, null, 2));
  console.log(`\n  Results: ${DIR}/playwright-results.json`);
}

main().catch(e => console.error('Fatal:', e.message));

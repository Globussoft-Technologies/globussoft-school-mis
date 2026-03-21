const { chromium } = require('playwright');

const BASE = 'http://localhost:3001';
const PAGES = [
  '/dashboard', '/students', '/admission', '/attendance', '/period-attendance',
  '/syllabus', '/timetable', '/lms', '/compliance', '/assessments', '/assignments',
  '/question-bank', '/grading', '/report-cards', '/analytics', '/users',
  '/fees', '/discipline', '/bus', '/hobbies', '/communication', '/notifications',
  '/teacher-attendance', '/exam-schedule', '/substitutes', '/documents', '/leaves',
  '/transfer-certificates', '/calendar', '/announcements', '/settings', '/audit',
  '/bulk-operations', '/reports', '/expenses', '/alumni', '/staff-directory',
  '/gallery', '/library', '/visitors', '/inventory', '/health', '/hostel',
  '/payroll', '/grievances', '/room-booking', '/meetings', '/events', '/surveys',
  '/feedback', '/certificates', '/concessions', '/promotions', '/fee-automation',
  '/transport-billing', '/homework-calendar', '/diary', '/course-modules',
  '/discussions', '/learning-paths', '/gamification', '/rubrics', '/speed-grader',
  '/live-classes', '/id-cards', '/message-logs', '/file-browser',
  '/performance-report', '/academic-transition', '/result-workflow', '/remedial',
  '/grace-marks', '/classes',
];

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();

  await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@medicaps.edu.in', password: 'admin123' }) });
    const d = await r.json();
    localStorage.setItem('accessToken', d.accessToken);
    localStorage.setItem('refreshToken', d.refreshToken);
    localStorage.setItem('user', JSON.stringify(d.user));
  });

  const broken = [];

  for (const path of PAGES) {
    const errors = [];
    const handler = (e) => errors.push(e.message);
    p.on('pageerror', handler);

    await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(3000);

    p.off('pageerror', handler);

    if (errors.length > 0) {
      const unique = [...new Set(errors.map(e => e.substring(0, 100)))];
      broken.push({ path, errors: unique });
      console.log(`✗ ${path} — ${unique[0]}`);
    } else {
      process.stdout.write(`✓ ${path}\n`);
    }
  }

  await b.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`PAGES WITH JS ERRORS: ${broken.length}/${PAGES.length}`);
  if (broken.length > 0) {
    broken.forEach(b => {
      console.log(`\n  ${b.path}:`);
      b.errors.forEach(e => console.log(`    → ${e}`));
    });
  } else {
    console.log('ALL PAGES ERROR-FREE!');
  }
})();

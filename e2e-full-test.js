const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'http://localhost:3001';
const SCREENSHOT_DIR = 'c:/Users/Admin/emp-lms/e2e-screenshots';

// All pages to test
const PAGES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/students', name: 'Students' },
  { path: '/admission', name: 'Admission' },
  { path: '/attendance', name: 'Attendance' },
  { path: '/period-attendance', name: 'Period Attendance' },
  { path: '/syllabus', name: 'Syllabus' },
  { path: '/timetable', name: 'Timetable' },
  { path: '/lms', name: 'LMS Hub' },
  { path: '/compliance', name: 'Compliance' },
  { path: '/assessments', name: 'Assessments' },
  { path: '/assignments', name: 'Assignments' },
  { path: '/question-bank', name: 'Question Bank' },
  { path: '/grading', name: 'Grading' },
  { path: '/report-cards', name: 'Report Cards' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/users', name: 'Users' },
  { path: '/fees', name: 'Fee Management' },
  { path: '/discipline', name: 'Discipline' },
  { path: '/bus', name: 'Bus Tracking' },
  { path: '/hobbies', name: 'Hobbies' },
  { path: '/communication', name: 'Communication' },
  { path: '/notifications', name: 'Notifications' },
  { path: '/teacher-attendance', name: 'Teacher Attendance' },
  { path: '/exam-schedule', name: 'Exam Schedule' },
  { path: '/substitutes', name: 'Substitutes' },
  { path: '/documents', name: 'Documents' },
  { path: '/leaves', name: 'Leave Requests' },
  { path: '/transfer-certificates', name: 'Transfer Certificates' },
  { path: '/calendar', name: 'Calendar' },
  { path: '/announcements', name: 'Announcements' },
  { path: '/settings', name: 'Settings' },
  { path: '/audit', name: 'Audit Logs' },
  { path: '/bulk-operations', name: 'Bulk Operations' },
  { path: '/reports', name: 'Reports' },
  { path: '/expenses', name: 'Expenses' },
  { path: '/alumni', name: 'Alumni' },
  { path: '/staff-directory', name: 'Staff Directory' },
  { path: '/gallery', name: 'Gallery' },
  { path: '/library', name: 'Library' },
  { path: '/visitors', name: 'Visitors' },
  { path: '/inventory', name: 'Inventory' },
  { path: '/health', name: 'Health Records' },
  { path: '/hostel', name: 'Hostel' },
  { path: '/payroll', name: 'Payroll' },
  { path: '/grievances', name: 'Grievances' },
  { path: '/room-booking', name: 'Room Booking' },
  { path: '/meetings', name: 'Meetings' },
  { path: '/events', name: 'Events' },
  { path: '/surveys', name: 'Surveys' },
  { path: '/feedback', name: 'Feedback' },
  { path: '/certificates', name: 'Certificates' },
  { path: '/concessions', name: 'Concessions' },
  { path: '/promotions', name: 'Promotions' },
  { path: '/fee-automation', name: 'Fee Automation' },
  { path: '/transport-billing', name: 'Transport Billing' },
  { path: '/homework-calendar', name: 'Homework Calendar' },
  { path: '/diary', name: 'Diary' },
  { path: '/course-modules', name: 'Course Modules' },
  { path: '/discussions', name: 'Discussion Forums' },
  { path: '/learning-paths', name: 'Learning Paths' },
  { path: '/gamification', name: 'Gamification' },
  { path: '/rubrics', name: 'Rubrics' },
  { path: '/speed-grader', name: 'Speed Grader' },
  { path: '/live-classes', name: 'Live Classes' },
  { path: '/id-cards', name: 'ID Cards' },
  { path: '/message-logs', name: 'Message Logs' },
  { path: '/file-browser', name: 'File Manager' },
  { path: '/performance-report', name: 'Performance Report' },
  { path: '/academic-transition', name: 'Academic Transition' },
  { path: '/result-workflow', name: 'Result Workflow' },
  { path: '/remedial', name: 'Remedial' },
  { path: '/grace-marks', name: 'Grace Marks' },
  { path: '/classes', name: 'Classes & Sections' },
];

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
  await page.evaluate(async () => {
    const res = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medicaps.edu.in', password: 'admin123' }),
    });
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  });
  console.log('✓ Logged in\n');

  const results = { passed: [], failed: [], errors: [] };

  for (const pg of PAGES) {
    process.stdout.write(`Testing ${pg.name} (${pg.path})... `);
    try {
      const response = await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));

      const status = response?.status() ?? 0;
      const url = page.url();

      // Check for errors
      const pageErrors = [];

      // Check if redirected to login (auth failure)
      if (url.includes('/login')) {
        pageErrors.push('Redirected to login — auth issue');
      }

      // Check for visible error text on page
      const errorText = await page.evaluate(() => {
        const body = document.body.innerText;
        if (body.includes('Internal Server Error')) return 'Internal Server Error on page';
        if (body.includes('Application error')) return 'Application error';
        if (body.includes('500')) {
          // Check if 500 is in an error context
          const errorEls = document.querySelectorAll('.text-red-600, .text-red-700, .text-destructive, [class*="error"]');
          for (const el of errorEls) {
            if (el.textContent?.includes('500')) return '500 error displayed on page';
          }
        }
        return null;
      });
      if (errorText) pageErrors.push(errorText);

      // Check for console errors (JS errors)
      const jsErrors = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      // Check if page has meaningful content (not empty)
      const hasContent = await page.evaluate(() => {
        const main = document.querySelector('main') || document.querySelector('[class*="dashboard"]') || document.body;
        const text = main?.innerText?.trim() || '';
        return text.length > 50; // Should have at least some content
      });

      // Check for 404 API calls
      const failedRequests = [];
      page.on('requestfailed', (req) => failedRequests.push(req.url()));

      // Take screenshot
      const screenshotPath = `${SCREENSHOT_DIR}/${pg.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });

      if (pageErrors.length > 0) {
        console.log(`✗ FAIL — ${pageErrors.join(', ')}`);
        results.failed.push({ ...pg, errors: pageErrors });
      } else if (!hasContent) {
        console.log(`⚠ WARN — Page appears empty`);
        results.failed.push({ ...pg, errors: ['Page appears empty or has minimal content'] });
      } else {
        console.log(`✓ PASS (${status})`);
        results.passed.push(pg);
      }
    } catch (err) {
      console.log(`✗ ERROR — ${err.message?.substring(0, 80)}`);
      results.errors.push({ ...pg, error: err.message });
    }
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('E2E TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✓ PASSED: ${results.passed.length}`);
  console.log(`✗ FAILED: ${results.failed.length}`);
  console.log(`⚡ ERRORS: ${results.errors.length}`);
  console.log(`  TOTAL:  ${PAGES.length}`);

  if (results.failed.length > 0) {
    console.log('\n--- FAILED PAGES ---');
    results.failed.forEach(p => console.log(`  ${p.name} (${p.path}): ${p.errors?.join(', ')}`));
  }
  if (results.errors.length > 0) {
    console.log('\n--- ERROR PAGES ---');
    results.errors.forEach(p => console.log(`  ${p.name} (${p.path}): ${p.error?.substring(0, 100)}`));
  }

  // Save results
  fs.writeFileSync(`${SCREENSHOT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`);
  console.log(`Results saved to: ${SCREENSHOT_DIR}/results.json`);
}

main().catch(e => console.error('Fatal:', e.message));

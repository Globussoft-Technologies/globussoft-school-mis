const puppeteer = require('puppeteer');

async function main() {
  const url = process.argv[2] || 'http://localhost:3001/lms';
  const output = process.argv[3] || 'screenshot.png';

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Go to login page first
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2', timeout: 15000 });

  // Login via API and store token in localStorage
  await page.evaluate(async () => {
    const res = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medicaps.edu.in', password: 'admin123' }),
    });
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  });

  // Navigate to target
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: output, fullPage: false });
  console.log('Screenshot saved:', output);
  await browser.close();
}

main().catch(e => console.error('Error:', e.message));

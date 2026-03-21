const puppeteer = require('puppeteer');
async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2', timeout: 15000 });
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
  // Go to LMS page
  await page.goto('http://localhost:3001/lms', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3000));
  // Click Content Library tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('Content Library')) { await tab.click(); break; }
  }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot-content-library.png', fullPage: false });
  console.log('Screenshot 1: Content Library tab');
  // Click Upload Content button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Upload Content')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot-upload-form.png', fullPage: false });
  console.log('Screenshot 2: Upload form');
  await browser.close();
}
main().catch(e => console.error('Error:', e.message));

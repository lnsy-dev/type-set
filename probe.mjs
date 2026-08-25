import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/Users/lnsy/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await b.newPage();
page.on('response', r => { if (r.status() >= 400) console.log('404:', r.url()); });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.type(), m.text().slice(0,200)); });
await page.goto('http://localhost:3199/');
await page.waitForTimeout(3000);
// try changing font family via the select
await page.selectOption('#font-family', 'Cormorant Garamond');
await page.waitForTimeout(2500);
const attrs = await page.evaluate(() => {
  const el = document.getElementById('editor');
  return { family: el.getAttribute('font-family'), cur: el.currentFamily };
});
console.log('after change:', JSON.stringify(attrs));
await page.screenshot({ path: '/tmp/shot.png' });
await b.close();

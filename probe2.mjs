import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/Users/lnsy/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await b.newPage();
page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto('http://localhost:3199/');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/before.png' });

await page.selectOption('#font-family', 'Cormorant Garamond');
await page.selectOption('#text-align', 'center');
await page.fill('#color', '#8a0000');
await page.dispatchEvent('#color', 'input');
const w = await page.$eval('#font-weight', el => ({ min: el.min, max: el.max }));
console.log('weight slider range after family change:', JSON.stringify(w));
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/after.png' });
await b.close();

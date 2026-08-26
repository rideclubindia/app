const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:5173/dev-incident/dev-mock', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const btn = page.locator('button:has-text("Accept All")');
  if (await btn.count()) await btn.first().click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shots/incident-v3-landscape.png' });

  console.log('Page errors:', errors.length ? errors : 'none');
  await browser.close();
})();

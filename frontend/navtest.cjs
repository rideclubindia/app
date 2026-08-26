const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  let osrmCount = 0;
  page.on('request', req => {
    if (req.url().includes('router.project-osrm.org')) osrmCount++;
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:5173/dev-home', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const btn = page.locator('button:has-text("Accept All")');
  if (await btn.count()) await btn.first().click().catch(() => {});

  // Search a destination
  await page.fill('input[placeholder="Search places..."]', 'Charminar');
  await page.press('input[placeholder="Search places..."]', 'Enter');
  await page.waitForTimeout(3000);
  const result = page.locator('form + div button').first();
  if (await result.count()) await result.click().catch(e => console.log('no result clicked:', e.message));
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'shots/nav-1-destination.png' });

  // Start navigation
  osrmCount = 0;
  const startNav = page.locator('button:has-text("Start Nav")');
  if (await startNav.count()) {
    await startNav.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'shots/nav-2-transition.png' });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: 'shots/nav-3-active.png' });
    console.log('OSRM requests after Start Nav (8s window):', osrmCount);
  } else {
    console.log('Start Nav button not found - search may have failed');
  }

  console.log('Page errors:', errors.length ? errors : 'none');
  await browser.close();
})();

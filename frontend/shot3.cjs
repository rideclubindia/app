const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:5173/dev-create', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const btn = page.locator('button:has-text("Accept All")');
  if (await btn.count()) await btn.first().click().catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'shots/create-step1.png' });

  // Go to step 2
  await page.fill('input[placeholder="e.g. Sunday Morning Cruise"]', 'Araku Valley Ride');
  const routeBtn = page.locator('button:has-text("Continue to Route")');
  if (await routeBtn.count()) {
    await routeBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'shots/create-step2.png' });
  } else {
    console.log('Continue button not found');
  }

  console.log('Page errors:', errors.length ? errors : 'none');
  await browser.close();
})();

const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const base = process.env.BASE_URL || 'http://localhost:5173';

  const shoot = async (name, viewport) => {
    const page = await browser.newPage({ viewport });
    await page.goto(`${base}/dev-home`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const btn = page.locator('button:has-text("Accept All")');
    if (await btn.count()) { await btn.first().click().catch(() => {}); }
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `shots/${name}.png` });
    await page.close();
  };

  await shoot('portrait-v2', { width: 390, height: 844 });
  await shoot('landscape-v2', { width: 844, height: 390 });
  await shoot('desktop-v2', { width: 1366, height: 768 });

  await browser.close();
  console.log('done');
})();

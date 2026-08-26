const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  const shoot = async (name, url, viewport) => {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const btn = page.locator('button:has-text("Accept All")');
    if (await btn.count()) await btn.first().click().catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `shots/${name}.png` });
    await page.close();
  };

  await shoot('incident-landscape', 'http://localhost:5173/dev-incident/dev-mock', { width: 844, height: 390 });
  await shoot('incident-portrait', 'http://localhost:5173/dev-incident/dev-mock', { width: 390, height: 844 });
  await shoot('incident-desktop', 'http://localhost:5173/dev-incident/dev-mock', { width: 1366, height: 768 });
  await shoot('home-landscape-check', 'http://localhost:5173/dev-home', { width: 844, height: 390 });
  await shoot('home-portrait-check', 'http://localhost:5173/dev-home', { width: 390, height: 844 });

  console.log('Page errors:', errors.length ? errors : 'none');
  await browser.close();
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message.split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text().split('\n')[0].slice(0, 200)); });

  await page.goto('http://localhost:5175/');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('.login-btn');
  await page.waitForSelector('.map-container canvas', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('dashboard loaded, body children:', await page.evaluate(() => document.getElementById('root').children.length));

  // switch to Manual Track tab
  await page.click('button.header-tab-btn:has-text("Manual Track")');
  await page.waitForTimeout(2500);
  const trackInput = await page.$('input[placeholder="e.g. Highway A-1"]');
  console.log('after Manual Track tab: track input present =', !!trackInput, '| root children =', await page.evaluate(() => document.getElementById('root').children.length));

  // switch to Route tab
  await page.click('button.header-tab-btn:has-text("Route")');
  await page.waitForTimeout(2500);
  const routeInput = await page.$('input[placeholder="e.g. City Loop"]');
  console.log('after Route tab: route input present =', !!routeInput, '| root children =', await page.evaluate(() => document.getElementById('root').children.length));

  // switch to Filter tab
  const filterBtn = await page.$('button.layers-toggle-btn:has-text("Filter")');
  console.log('filter button present =', !!filterBtn);
  if (filterBtn) {
    await filterBtn.click();
    await page.waitForTimeout(2500);
    const badge = await page.$('.page-title-badge:has-text("Filter Bikes")');
    console.log('after Filter tab: filter badge present =', !!badge, '| root children =', await page.evaluate(() => document.getElementById('root').children.length));
  }
  await page.screenshot({ path: 'probe.png' });
  await browser.close();
})().catch(e => { console.error('PROBE FAILED:', e.message.split('\n')[0]); process.exit(1); });

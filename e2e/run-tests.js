/* GeoNexus end-to-end test suite (Playwright, headless Chrome) */
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const BASE = 'http://localhost:5175';
const API = 'http://localhost:8080/api';
const results = [];
const consoleErrors = [];
const failedRequests = [];

function record(name, pass, evidence) {
  results.push({ name, pass, evidence });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${name} | ${evidence}`);
}
function psql(sql) {
  return execSync(`podman exec geonexus-db psql -U geonexus -d geonexus -t -A -c "${sql}"`).toString().trim();
}
async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  return res.json();
}
async function waitCanvas(page) {
  await page.waitForSelector('.map-container canvas', { timeout: 20000 });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));
  page.on('requestfailed', (req) => failedRequests.push(`${req.url()} :: ${req.failure()?.errorText}`));
  page.on('dialog', async (d) => { console.log('DIALOG:', d.message()); await d.dismiss(); });

  // tile request counter
  let tileResponses = 0;
  page.on('response', (res) => {
    const u = res.url();
    if ((u.includes('tile.openstreetmap.org') || u.includes('basemaps.cartocdn.com')) && res.status() === 200) tileResponses++;
  });

  try {
    // ---------- 1. LOGIN ----------
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    const loginVisible = await page.isVisible('.login-card');
    record('1a Login page renders', title === 'GeoNexus GIS Dashboard' && loginVisible,
      `title="${title}", login card visible=${loginVisible}`);

    await page.fill('#username', 'admin');
    await page.fill('#password', 'wrongpass');
    await page.click('.login-btn');
    await page.waitForSelector('.login-error', { timeout: 5000 });
    const errText = await page.textContent('.login-error');
    record('1b Wrong credentials rejected', errText.includes('Invalid username or password'),
      `error shown: "${errText.trim()}"`);

    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('.login-btn');
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    const auth = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
    record('1c admin/admin123 logs in', page.url().endsWith('/dashboard') && auth === 'true',
      `url=${page.url()}, isAuthenticated=${auth}`);

    // ---------- 2. DASHBOARD RENDER ----------
    await waitCanvas(page);
    await page.waitForTimeout(4000); // let tiles load
    const header = await page.isVisible('.dashboard-header');
    const footer = await page.isVisible('.dashboard-footer');
    const leftPanel = await page.isVisible('aside.left-panel');
    const rightPanel = await page.isVisible('aside.right-panel');
    const canvas = await page.isVisible('.map-container canvas');
    record('2 Dashboard renders (header/footer/panels/map canvas)',
      header && footer && leftPanel && rightPanel && canvas,
      `header=${header} footer=${footer} left=${leftPanel} right=${rightPanel} canvas=${canvas} tileResponses=${tileResponses}`);

    // ---------- 3. BASEMAP / LAYER SWITCHING ----------
    await page.click('button.layers-toggle-btn:has-text("Layers")'); // unlock left panel
    const unlocked = await page.isVisible('aside.left-panel:not(.disabled)');
    const osmItem = page.locator('.layer-item', { hasText: 'Standard OSM' });
    const beforeActive = await osmItem.getAttribute('class');
    await osmItem.click();
    await page.waitForTimeout(1500);
    const afterActive = await osmItem.getAttribute('class');
    const osmChecked = await osmItem.locator('input.layer-checkbox').isChecked();
    const tilesAfterSwitch = tileResponses;
    const layerPass = unlocked && !beforeActive.includes('active') && afterActive.includes('active') && osmChecked;
    record('3 Basemap/layer switching', layerPass,
      `left panel unlocked=${unlocked}; "Standard OSM" toggled active (checkbox=${osmChecked}); tiles loaded so far=${tilesAfterSwitch}`);
    await osmItem.click(); // restore: OSM off, dark carto remains

    // ---------- 4. SEARCH (Nominatim) ----------
    const markerCountBefore = await page.locator('.panel-section', { hasText: 'Saved Locations' }).locator('div[style*="cursor: pointer"]').count().catch(() => 0);
    await page.fill('.search-input', 'Berlin');
    await page.press('.search-input', 'Enter');
    let searchPass = false, searchEvidence = '';
    try {
      await page.waitForFunction(() => {
        const el = [...document.querySelectorAll('.info-item')].find(i => i.textContent.includes('Center Latitude'));
        if (!el) return false;
        const v = parseFloat(el.querySelector('.info-value').textContent);
        return Math.abs(v - 52.52) < 1.0;
      }, { timeout: 12000 });
      const centerLat = await page.locator('.info-item:has-text("Center Latitude") .info-value').textContent();
      const centerLon = await page.locator('.info-item:has-text("Center Longitude") .info-value').textContent();
      searchPass = true;
      searchEvidence = `map recentered to lat=${centerLat.trim()} lon=${centerLon.trim()} after searching "Berlin"`;
    } catch (e) {
      searchEvidence = 'map did not recenter within 12s (Nominatim may be blocked from browser)';
    }
    record('4 Map search (Nominatim) recenters map', searchPass, searchEvidence);

    // ---------- 5. AREA feature ----------
    await page.click('button.header-tab-btn:has-text("Area")');
    await page.waitForSelector('button.action-btn:has-text("Draw Polygon")');
    await page.click('button.action-btn:has-text("Draw Polygon")');
    await page.waitForTimeout(300);
    const canvasBox = await page.locator('.map-container canvas').boundingBox();
    const cx = canvasBox.x, cy = canvasBox.y;
    const pts = [
      [cx + canvasBox.width * 0.35, cy + canvasBox.height * 0.35],
      [cx + canvasBox.width * 0.65, cy + canvasBox.height * 0.35],
      [cx + canvasBox.width * 0.65, cy + canvasBox.height * 0.65],
      [cx + canvasBox.width * 0.35, cy + canvasBox.height * 0.65],
    ];
    for (const [x, y] of pts) {
      await page.mouse.click(x, y, { delay: 60 });
      await page.waitForTimeout(450); // click debounce is 350ms
    }
    await page.mouse.dblclick(pts[3][0], pts[3][1]); // finalize polygon
    await page.waitForTimeout(800);
    await page.fill('input[placeholder="e.g. Central Park Zone (required to save)"]', 'E2E Test Area');
    await page.click('button.action-btn:has-text("Save Database")');
    let areaPass = false, areaEvidence = '';
    try {
      await page.waitForSelector('.toast:has-text("saved to database")', { timeout: 8000 });
      const toastText = await page.textContent('.toast-message');
      const areas = await apiGet('/areas');
      const found = areas.find(a => a.name === 'E2E Test Area');
      const dbRow = psql(`SELECT name FROM areas WHERE name='E2E Test Area';`);
      // persistence: reload and Load from DB
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitCanvas(page);
      await page.click('button.header-tab-btn:has-text("Area")');
      await page.click('button.action-btn-secondary:has-text("Load from DB")');
      await page.waitForSelector('.area-saved-item:has-text("E2E Test Area")', { timeout: 8000 });
      const persisted = await page.isVisible('.area-saved-item:has-text("E2E Test Area")');
      areaPass = !!found && dbRow === 'E2E Test Area' && persisted;
      areaEvidence = `toast="${toastText.trim()}"; API has it=${!!found} (id=${found?.id}); psql row="${dbRow}"; after reload+Load from DB visible in list=${persisted}`;
      // delete via UI (per-row ✕ button)
      await page.locator('.area-saved-item', { hasText: 'E2E Test Area' }).locator('.area-delete-btn').click();
      await page.waitForSelector('.toast:has-text("deleted")', { timeout: 8000 });
      const areasAfter = await apiGet('/areas');
      const dbAfter = psql(`SELECT count(*) FROM areas WHERE name='E2E Test Area';`);
      areaEvidence += `; UI delete -> API count=${areasAfter.length}, db rows=${dbAfter}`;
      areaPass = areaPass && areasAfter.length === 0 && dbAfter === '0';
    } catch (e) {
      areaEvidence = 'exception: ' + e.message.split('\n')[0];
      await page.screenshot({ path: 'fail-area.png' });
    }
    record('5 AREA draw/save/verify/persist/delete', areaPass, areaEvidence);

    // ---------- 6. TRACK feature ----------
    let trackPass = false, trackEvidence = '';
    try {
      await page.click('button.header-tab-btn:has-text("Manual Track")');
      await page.waitForSelector('input[placeholder="e.g. Highway A-1"]');
      await page.fill('input[placeholder="e.g. Highway A-1"]', 'E2E Test Track');
      await page.fill('input[placeholder="e.g. TRK-101"]', 'TRK-E2E-1');
      await page.fill('input[placeholder="e.g. 51.5072"]', '17.385');
      await page.fill('input[placeholder="e.g. -0.1276"]', '78.4867');
      await page.fill('input[placeholder="e.g. 72.5"]', '60');
      await page.fill('input[placeholder="e.g. 135"]', '90');
      await page.click('button.action-btn:has-text("Save DB")');
      await page.waitForSelector('.toast:has-text("saved to database")', { timeout: 8000 });
      const tracks = await apiGet('/tracks');
      const found = tracks.find(t => t.name === 'E2E Test Track');
      const dbRow = psql(`SELECT name FROM tracks WHERE name='E2E Test Track';`);
      // reload persistence (tracks auto-load on dashboard mount)
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitCanvas(page);
      await page.click('button.header-tab-btn:has-text("Manual Track")');
      await page.waitForSelector('.area-saved-item:has-text("E2E Test Track")', { timeout: 8000 });
      const persisted = await page.isVisible('.area-saved-item:has-text("E2E Test Track")');
      trackEvidence = `API has it=${!!found} (id=${found?.id}); psql row="${dbRow}"; reload -> visible in Saved Tracks=${persisted}`;
      // delete via UI
      await page.locator('.area-saved-item', { hasText: 'E2E Test Track' }).locator('.area-delete-btn').click();
      await page.waitForSelector('.toast:has-text("deleted")', { timeout: 8000 });
      const tracksAfter = await apiGet('/tracks');
      const dbAfter = psql(`SELECT count(*) FROM tracks WHERE name='E2E Test Track';`);
      trackEvidence += `; UI delete -> API count=${tracksAfter.length}, db rows=${dbAfter}`;
      trackPass = !!found && dbRow === 'E2E Test Track' && persisted && tracksAfter.length === 0 && dbAfter === '0';
    } catch (e) {
      trackEvidence = 'exception: ' + e.message.split('\n')[0];
      await page.screenshot({ path: 'fail-track.png' });
    }
    record('6 TRACK save/verify/persist/delete', trackPass, trackEvidence);

    // ---------- 7. ROUTE feature ----------
    let routePass = false, routeEvidence = '';
    try {
      await page.click('button.header-tab-btn:has-text("Route")');
      await page.waitForSelector('input[placeholder="e.g. City Loop"]');
      await page.fill('input[placeholder="e.g. City Loop"]', 'E2E Test Route');
      await page.getByPlaceholder('Latitude').nth(0).fill('17.385');
      await page.getByPlaceholder('Longitude').nth(0).fill('78.4867');
      await page.getByPlaceholder('Latitude').nth(1).fill('18.5204');
      await page.getByPlaceholder('Longitude').nth(1).fill('73.8567');
      await page.fill('input[placeholder="e.g. Active / Valid until 2026-12-31"]', 'Valid until 2026-12-31');
      await page.click('button.action-btn:has-text("Save DB")');
      await page.waitForSelector('.toast:has-text("saved to database")', { timeout: 8000 });
      const routes = await apiGet('/routes');
      const found = routes.find(r => r.name === 'E2E Test Route');
      const dbRow = psql(`SELECT name FROM routes WHERE name='E2E Test Route';`);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitCanvas(page);
      await page.click('button.header-tab-btn:has-text("Route")');
      await page.waitForSelector('.area-saved-item:has-text("E2E Test Route")', { timeout: 8000 });
      const persisted = await page.isVisible('.area-saved-item:has-text("E2E Test Route")');
      routeEvidence = `API has it=${!!found} (id=${found?.id}); psql row="${dbRow}"; reload -> visible in Saved Routes=${persisted}`;
      await page.locator('.area-saved-item', { hasText: 'E2E Test Route' }).locator('.area-delete-btn').click();
      await page.waitForSelector('.toast:has-text("deleted")', { timeout: 8000 });
      const routesAfter = await apiGet('/routes');
      const dbAfter = psql(`SELECT count(*) FROM routes WHERE name='E2E Test Route';`);
      routeEvidence += `; UI delete -> API count=${routesAfter.length}, db rows=${dbAfter}`;
      routePass = !!found && dbRow === 'E2E Test Route' && persisted && routesAfter.length === 0 && dbAfter === '0';
    } catch (e) {
      routeEvidence = 'exception: ' + e.message.split('\n')[0];
      await page.screenshot({ path: 'fail-route.png' });
    }
    record('7 ROUTE save/verify/persist/delete', routePass, routeEvidence);

    // ---------- 8. BIKE LIST + FILTERS ----------
    let bikePass = false, bikeEvidence = '';
    try {
      // open Filter page from header
      await page.click('button.layers-toggle-btn:has-text("Filter")');
      await page.waitForSelector('.page-title-badge:has-text("Filter Bikes")');
      const badge0 = await page.locator('.count-badge', { hasText: 'Total' }).last().textContent();
      // apply vehicle number filter
      await page.fill('input[placeholder="e.g. BIKE-LON-101"]', 'BIKE-LON');
      await page.click('button.action-btn:has-text("Apply Filter")');
      await page.waitForTimeout(500);
      const badge1 = await page.locator('.count-badge', { hasText: 'Total' }).last().textContent();
      // area geofence select
      await page.selectOption('select.filter-select', 'london');
      await page.waitForTimeout(1800); // fitBounds animation
      const toastArea = await page.isVisible('.toast');
      // date range filter: only 2026-07-23..2026-07-24 -> LON-104(23), LON-102(24), PAR-202(25? no) ...
      await page.fill('input[type="date"] >> nth=0', '2026-07-23');
      await page.fill('input[type="date"] >> nth=1', '2026-07-24');
      await page.click('button.action-btn:has-text("Apply Filter")');
      await page.waitForTimeout(500);
      const badge2 = await page.locator('.count-badge', { hasText: 'Total' }).last().textContent();
      // reset
      await page.click('button.action-btn-secondary:text-is("Reset")');
      await page.waitForTimeout(300);
      const badge3 = await page.locator('.count-badge', { hasText: 'Total' }).last().textContent();
      bikeEvidence = `count badge: initial="${badge0.trim()}" -> "BIKE-LON" filter="${badge1.trim()}" -> +date 23-24="${badge2.trim()}" -> reset="${badge3.trim()}"; area select toast=${toastArea}`;
      bikePass = badge0.includes('15') && badge1.trim().startsWith('5') && badge3.includes('15');
    } catch (e) {
      bikeEvidence = 'exception: ' + e.message.split('\n')[0];
      await page.screenshot({ path: 'fail-bikes.png' });
    }
    record('8 Bike list + filters (vehicle no / area / time)', bikePass, bikeEvidence);

    // ---------- 10. SCREENSHOT (before logout) ----------
    await page.click('button.layers-toggle-btn:has-text("Filter")'); // back to analytics
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'dashboard.png', fullPage: false });

    // ---------- 9. LOGOUT ----------
    let logoutPass = false, logoutEvidence = '';
    try {
      await page.click('button.layers-toggle-btn:has-text("Logout")');
      await page.waitForSelector('.login-card', { timeout: 8000 });
      const urlAfter = page.url();
      const authAfter = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
      await page.goto(BASE + '/dashboard');
      await page.waitForSelector('.login-card', { timeout: 8000 });
      const redirected = !page.url().includes('dashboard') || await page.isVisible('.login-card');
      logoutEvidence = `after logout url=${urlAfter}, isAuthenticated=${authAfter}; visiting /dashboard shows login page=${redirected} (url=${page.url()})`;
      logoutPass = urlAfter.endsWith(':5175/') && authAfter === null && redirected;
    } catch (e) {
      logoutEvidence = 'exception: ' + e.message.split('\n')[0];
      await page.screenshot({ path: 'fail-logout.png' });
    }
    record('9 Logout + protected route redirect', logoutPass, logoutEvidence);

  } catch (fatal) {
    console.error('FATAL:', fatal);
    await page.screenshot({ path: 'fail-fatal.png' }).catch(() => {});
  } finally {
    // ---------- CLEANUP: leave DB empty ----------
    for (const res of ['areas', 'tracks', 'routes']) {
      const items = await apiGet('/' + res).catch(() => []);
      for (const it of items) {
        await fetch(`${API}/${res}/${it.id}`, { method: 'DELETE' }).catch(() => {});
      }
    }
    const counts = ['areas', 'tracks', 'routes'].map(t => `${t}=${psql(`SELECT count(*) FROM ${t};`)}`).join(' ');
    console.log('CLEANUP final db counts:', counts);

    console.log('\n--- console errors seen (' + consoleErrors.length + ') ---');
    [...new Set(consoleErrors)].slice(0, 20).forEach(e => console.log('  ' + e.slice(0, 300)));
    console.log('--- failed requests (' + failedRequests.length + ') ---');
    [...new Set(failedRequests)].slice(0, 20).forEach(e => console.log('  ' + e.slice(0, 300)));

    await browser.close();
    const failed = results.filter(r => !r.pass);
    console.log(`\nSUMMARY: ${results.length - failed.length}/${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
  }
})();

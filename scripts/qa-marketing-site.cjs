const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/saffy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const base = process.env.QA_BASE || 'http://localhost:3092';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const output = '.vercel/qa-site';
    fs.mkdirSync(output, { recursive: true });
    for (const viewport of [
      { name: 'desktop-wide', width: 1920, height: 1080 },
      { name: 'desktop', width: 1440, height: 1000 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: /Safety that moves with you/i }).waitFor();
      await page.getByText('17,146', { exact: true }).waitFor();
      await page.getByText('1.3m', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${viewport.name} has no horizontal overflow`);
      const contentWidth = await page.locator('header').evaluate(element => element.getBoundingClientRect().width);
      assert.equal(contentWidth >= viewport.width * 0.9, true, `${viewport.name} uses the available screen width`);
      assert.equal(await page.locator('a[href^="mailto:kyle@creamtech.co.za"]').count() >= 1, true);
      assert.equal(await page.locator('a[href="tel:+27721699422"]').count(), 1);
      await page.screenshot({ path: `${output}/homepage-${viewport.name}.png`, fullPage: true });
      if (viewport.name === 'desktop') {
        const fontSize = async selector => parseFloat(await page.locator(selector).first().evaluate(element => getComputedStyle(element).fontSize));
        assert.equal(await fontSize('header nav a') >= 14, true, 'desktop navigation remains legible');
        assert.equal(await fontSize('article p') >= 15, true, 'desktop card copy remains legible');
        assert.equal(await fontSize('section[class*="audiences"] article p') >= 16, true, 'audience descriptions remain legible');
        await page.locator('header').screenshot({ path: `${output}/homepage-header-desktop.png` });
        await page.locator('section[class*="hero"]').screenshot({ path: `${output}/homepage-hero-desktop.png` });
        await page.locator('section[class*="reality"]').screenshot({ path: `${output}/homepage-reality-desktop.png` });
        await page.locator('section[class*="platform"]').screenshot({ path: `${output}/homepage-platform-desktop.png` });
        await page.locator('section[class*="dispatchSection"]').screenshot({ path: `${output}/homepage-dispatch-desktop.png` });
        await page.locator('section[class*="audiences"]').screenshot({ path: `${output}/homepage-audiences-desktop.png` });
        await page.locator('section[class*="partnerBanner"]').screenshot({ path: `${output}/homepage-partner-desktop.png` });
        await page.locator('section[class*="contact"]').screenshot({ path: `${output}/homepage-contact-desktop.png` });
      }
      assert.deepEqual(errors, []);
      await page.close();
    }

    const portal = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await portal.goto(base + '/login?mode=partner');
    await portal.getByLabel('Account Number').waitFor();
    await portal.getByLabel('PIN / Password').waitFor();
    console.log('PASS: public SafeLink website, sourced statistics, responsive layout, contact actions and security-partner portal entry.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

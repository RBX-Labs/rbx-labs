const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const root = process.cwd();
  const jobs = [
    ['assets/branding/hero/networkguardian_hero_light.svg', '/private/tmp/ng_hero_light_raw.webm'],
    ['assets/branding/telemetry/telemetry_map.svg', '/private/tmp/ng_tel_raw.webm'],
    ['assets/branding/telemetry/telemetry_map_light.svg', '/private/tmp/ng_tel_light_raw.webm'],
  ];

  for (const [svgRel, outRaw] of jobs) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: '/private/tmp', size: { width: 1920, height: 1080 } },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    await page.goto('file://' + path.join(root, svgRel), { waitUntil: 'load' });
    await page.waitForTimeout(10000);

    const video = page.video();
    await context.close();
    const recorded = await video.path();

    const { copyFileSync } = require('node:fs');
    copyFileSync(recorded, outRaw);

    await browser.close();
    console.log(`captured ${svgRel}`);
  }
})();

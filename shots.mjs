import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readdir, unlink, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const screenshotDir = join(root, 'screenshots');
const chromiumPath = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const requireFromShotTool = createRequire('/home/hatch/workspace/makefun/shot-tool/package.json');
const { chromium } = requireFromShotTool('playwright-core');
const earned = ['Trust', 'Break the Bank', 'Master of None', 'The Shootist', 'A Classic Blitz Play'];
const storage = JSON.stringify(earned);
await mkdir(screenshotDir, { recursive: true });
for (const oldFile of await readdir(screenshotDir)) await unlink(join(screenshotDir, oldFile));

const server = spawn(process.execPath, [join(root, 'serve.ts'), '--port', '8091'], { cwd: root, stdio: 'ignore' });
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath: chromiumPath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => { throw error; });
  await page.addInitScript(() => { Element.prototype.scrollIntoView = function () {}; });
  await page.addInitScript(({ progress }) => {
    localStorage.setItem('leonida-field-notes-progress-v1', progress);
    localStorage.setItem('leonida-field-notes-preferences-v1', JSON.stringify({ spoilers: false, view: 'tracker' }));
  }, { progress: storage });
  await page.goto('http://127.0.0.1:8091/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#kind-filter').selectOption('missable');
  const missableCount = await page.locator('.trophy-row').count();
  const behaviorFailures = [];
  if (missableCount >= 55 || missableCount === 0) behaviorFailures.push(`Missable filter returned ${missableCount}; expected a non-empty subset.`);
  await page.locator('#kind-filter').selectOption('all');
  await page.locator('#spoiler-setting').check({ force: true });
  await page.locator('[data-view="missables"]').first().click();
  const watchText = await page.locator('#missables-view').innerText();
  if (watchText.includes('Just Like Paradise') || watchText.includes('Complete Gone Fishing.')) behaviorFailures.push('Spoiler-on Missable Watch revealed a hidden story name or description.');
  await page.locator('[data-view="tracker"]').first().click();
  await page.locator('#search').fill('Just Like Paradise');
  if (await page.locator('.trophy-row').count() !== 0) behaviorFailures.push('Search matched a concealed story trophy name.');
  await page.locator('#search').fill('Complete Gone Fishing.');
  if (await page.locator('.trophy-row').count() !== 0) behaviorFailures.push('Search matched a concealed story description.');
  await page.locator('#search').fill('');
  await page.locator('.trophy-row').nth(1).click();
  await page.locator('#detail-panel [data-earn]').click();
  if (!(await page.locator('#detail-panel').innerText()).includes('Complete Gone Fishing.')) behaviorFailures.push('Earning a story trophy did not reveal its official description.');
  await page.locator('#search').fill('Just Like Paradise');
  if (await page.locator('.trophy-row').count() !== 1) behaviorFailures.push('Search did not find the earned story trophy name.');
  await page.locator('#search').fill('Complete Gone Fishing.');
  if (await page.locator('.trophy-row').count() !== 1) behaviorFailures.push('Search did not find the earned story description.');
  if (behaviorFailures.length) throw new Error(`Browser behavior checks failed:\n${behaviorFailures.join('\n')}`);
  await page.evaluate(({ progress }) => {
    localStorage.setItem('leonida-field-notes-progress-v1', progress);
    localStorage.setItem('leonida-field-notes-preferences-v1', JSON.stringify({ spoilers: false, view: 'tracker' }));
  }, { progress: storage });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}*,*:before,*:after{animation:none!important;transition:none!important}' });
  await page.locator('#kind-filter').selectOption('crime');
  if (!(await page.locator('#kind-filter').evaluate(node => node.closest('.select-wrap').classList.contains('filter-active')))) throw new Error('Selected kind filter is not visibly active.');
  if ((await page.locator('#progress').innerText()).trim() !== '5/55 earned') throw new Error('Earned progress is not visible or counted correctly.');
  if ((await page.locator('#export').innerText()).trim() !== 'Export' || !(await page.locator('.import-button').innerText()).includes('Import')) throw new Error('Import/Export controls are not labeled.');
  await page.locator('#search').fill('Maximum Withdrawal');
  await page.locator('.trophy-row').first().click();
  await page.locator('.guide-block').filter({ hasText: 'Track five Bank Vault robberies' }).waitFor();
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '01-checklist.jpg');

  await page.locator('[data-view="roadmap"]').first().click();
  const roadmapText = await page.locator('#roadmap-view').innerText();
  if ((await page.locator('#roadmap-view .roadmap-check').count()) !== 2 || !roadmapText.includes('100% COMPLETION GOLD') || !roadmapText.includes('FINAL PLATINUM CHECK')) throw new Error('Roadmap completion gold and final platinum are not separately labeled.');
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '02-roadmap.jpg');

  await page.locator('[data-view="tracker"]').first().click();
  await page.locator('#search').fill('');
  await page.locator('#kind-filter').selectOption('story');
  await page.locator('#search').fill('story');
  await page.locator('#spoiler-setting').check({ force: true });
  await page.locator('.trophy-row').first().click();
  const storyRows = await page.locator('.trophy-row').allInnerTexts();
  if (!storyRows.some(row => row.includes('Hidden trophy')) || !storyRows.some(row => row.includes('Trust'))) throw new Error('Spoiler capture must show a masked story trophy beside an earned one.');
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '03-spoiler-pair.jpg');

  await page.locator('[data-view="missables"]').first().click();
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '04-missables.jpg');

  const actual = await readdir(screenshotDir);
  if (actual.length !== 4 || actual.some(name => !/^[a-zA-Z0-9._-]+\.jpg$/.test(name))) throw new Error(`Expected exactly four named JPEG captures; found ${actual.length} files.`);
  for (const name of actual) {
    const size = (await stat(join(screenshotDir, name))).size;
    if (size > 262144) throw new Error(`${name} is ${size} bytes; reduce screenshot quality.`);
    console.log(`${name}: ${size} bytes`);
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

async function capture(page, filename) {
  await page.screenshot({ path: join(screenshotDir, filename), type: 'jpeg', quality: 77, fullPage: false });
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:8091/');
      if (response.ok) return;
    } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 120));
  }
  throw new Error('Local app server did not start.');
}

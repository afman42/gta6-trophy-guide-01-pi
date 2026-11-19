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
const earned = ['Just Like Paradise', 'Paradise Lost', 'Trust', 'Break the Bank', 'Master of None', 'The Shootist', 'A Classic Blitz Play'];
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
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}*,*:before,*:after{animation:none!important;transition:none!important}' });
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '01-checklist.jpg');

  await page.locator('[data-view="roadmap"]').first().click();
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '02-roadmap.jpg');

  await page.locator('[data-view="missables"]').first().click();
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '03-missables.jpg');

  await page.locator('[data-view="tracker"]').first().click();
  await page.locator('#search').fill('Maximum Withdrawal');
  await page.waitForTimeout(150);
  await page.locator('.trophy-row').first().click();
  await page.locator('#workspace').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 18));
  await page.waitForTimeout(250);
  await capture(page, '04-trophy-guide.jpg');

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

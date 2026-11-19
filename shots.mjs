import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const screenshotDir = join(root, 'screenshots');
const chromiumPath = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const requireFromShotTool = createRequire('/home/hatch/workspace/makefun/shot-tool/package.json');
const { chromium } = requireFromShotTool('playwright-core');
const trophyData = JSON.parse(await readFile(join(root, 'app/data/trophies.json'), 'utf8'));
const earned = ['Just Like Paradise', 'Paradise Lost', 'Trust', 'Break the Bank', 'Master of None', 'The Shootist', 'A Classic Blitz Play'];
const storage = JSON.stringify(earned);

const server = spawn(process.execPath, [join(root, 'serve.ts'), '--port', '8091'], { cwd: root, stdio: 'ignore' });
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath: chromiumPath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => { throw error; });
  await page.addInitScript(({ progress }) => {
    localStorage.setItem('leonida-field-notes-progress-v1', progress);
    localStorage.setItem('leonida-field-notes-preferences-v1', JSON.stringify({ spoilers: false, view: 'tracker' }));
  }, { progress: storage });
  await page.goto('http://127.0.0.1:8091/', { waitUntil: 'networkidle' });
  await page.locator('#workspace').evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForTimeout(350);
  await capture(page, '01-checklist.jpg');

  await page.locator('[data-view="roadmap"]').first().click();
  await page.waitForTimeout(350);
  await page.locator('#workspace').evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await capture(page, '02-roadmap.jpg');

  await page.locator('[data-view="missables"]').first().click();
  await page.waitForTimeout(350);
  await page.locator('#workspace').evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await capture(page, '03-missables.jpg');

  await page.locator('[data-view="tracker"]').first().click();
  await page.locator('#search').fill('Maximum Withdrawal');
  await page.waitForTimeout(300);
  await page.locator('.trophy-row').first().click();
  await page.locator('#workspace').evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await capture(page, '04-trophy-guide.jpg');

  const actual = (await readdir(screenshotDir)).filter(name => /\.jpe?g$/i.test(name));
  if (actual.length !== 4) throw new Error(`Expected four JPEG files; generated ${actual.length}.`);
  for (const name of actual) {
    const { stat } = await import('node:fs/promises');
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

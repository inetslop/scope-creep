/**
 * Takes a gameplay screenshot of every game for the front page's cards (run by the deploy
 * workflow once every game is in place, before site/home.ts):
 *
 *   node site/screenshots.ts _site
 *
 * Serves the site folder on localhost, plays each game for a while the way the smoke test does
 * (its driver in loop/smoke/games/<id>.ts), and saves <site>/<id>/preview.jpg mid-play. Uses the
 * Chrome installed on the machine (GitHub's runners have one) or CHROME_PATH. Best effort: a game
 * that fails is skipped, and its card stays plain.
 */
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { projectIds } from '../loop/paths.ts';
import { loadSmokeGame } from '../loop/smoke/game.ts';

/** Seconds of play before the shot: towers built, a wave on the way (longer, and the twin-stick run may be over). */
const PLAY_SECONDS = 12;
/** At most this many seconds more, waiting for a busy moment: no overlay, a few enemies on the board. */
const SETTLE_SECONDS = 25;
/** Enemies on the board that make a busy moment (games whose hook has `stats.enemiesAlive`). */
const BUSY_ENEMIES = 3;

const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

/** A static server for the site folder on a free localhost port. */
function serve(root: string): Promise<{ url: string; close: () => void }> {
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (!file.startsWith(root)) return void res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, close: () => server.close() })),
  );
}

function launch(): Promise<Browser> {
  // The same flags as the smoke test: WebGL in software, sound without a click.
  const args = ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'];
  const executablePath = process.env.CHROME_PATH;
  return executablePath ? chromium.launch({ headless: true, executablePath, args }) : chromium.launch({ headless: true, channel: 'chrome', args });
}

type Hook = { ready?: boolean; scene?: string; overlay?: string; stats?: Record<string, number> };

/** Plays one game and saves its screenshot. */
async function shoot(browser: Browser, base: string, site: string, id: string): Promise<void> {
  const game = await loadSmokeGame(id);
  const page: Page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  try {
    await page.goto(`${base}/${id}/?smoke&seed=1234`, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForFunction(() => (window as unknown as { __SC__?: Hook }).__SC__?.ready === true, null, { timeout: 20_000 });
    await page.waitForFunction((scene) => (window as unknown as { __SC__?: Hook }).__SC__?.scene === scene, game.playScene, { timeout: 15_000 });
    const driver = game.desktop(page);
    const hook = (): Promise<Hook> => page.evaluate(() => ({ ...(window as unknown as { __SC__?: Hook }).__SC__ }));
    const end = Date.now() + PLAY_SECONDS * 1000;
    while (Date.now() < end) {
      await driver.step();
      await page.waitForTimeout(150);
    }
    // A busy moment of play: no draft or pause card over the board, and a few enemies on it.
    const settle = Date.now() + SETTLE_SECONDS * 1000;
    for (;;) {
      const h = await hook();
      if ((!h.overlay && (h.stats?.enemiesAlive ?? BUSY_ENEMIES) >= BUSY_ENEMIES) || Date.now() > settle) break;
      await driver.step();
      await page.waitForTimeout(150);
    }
    await driver.release();
    // Stop clicking for a moment, with the pointer on bare ground (no hover highlight, no cell), so
    // the last click's hint text and highlight have faded by the shot.
    await page.mouse.move(40, 360);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(site, id, 'preview.jpg'), type: 'jpeg', quality: 80 });
    console.log(`screenshot: ${id}/preview.jpg`);
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const site = path.resolve(process.argv[2] ?? '');
  if (!process.argv[2] || !fs.existsSync(site)) throw new Error('usage: node site/screenshots.ts <site folder with one folder per game>');
  const games = projectIds().filter((id) => fs.existsSync(path.join(site, id, 'index.html')));
  const server = await serve(site);
  const browser = await launch();
  try {
    for (const id of games) {
      try {
        await shoot(browser, server.url, site, id);
      } catch (err) {
        console.warn(`screenshot: ${id} skipped (${(err as Error).message.split('\n')[0]})`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

await main();

/**
 * Browser smoke test: the hard gate every change must pass. Owned by the loop, not the game.
 *
 *   node loop/smoke/smoke.ts [--seconds 24] [--no-build] [--headed]
 *   (from game/: npm run smoke)
 *
 * Builds game/, serves dist/, and plays it in headless Chromium as a desktop
 * player (keyboard + mouse) and as a phone (two-thumb multi-touch). Fails on:
 *   - any page error, console.error, failed request or HTTP error
 *   - the game never becoming ready / never entering the Game scene
 *   - the frame counter stalling
 *   - any window.__SC__.invariants() failure
 *   - no shots fired or no enemies spawned (input or core loop broken)
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium, type Browser, type BrowserContext, type BrowserContextOptions, type Page } from 'playwright';
import { run } from '../exec.ts';
import { GAME_DIR, SMOKE_OUT_DIR } from '../paths.ts';
import { serveStatic } from './server.ts';

interface HookStats {
  runsStarted: number;
  deaths: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  shotsFired: number;
  shardsCollected: number;
  upgradesTaken: number;
  level: number;
}
interface SmokeHook {
  ready: boolean;
  scene: string;
  frame: number;
  errors: string[];
  stats: HookStats;
  invariants(): string[];
}
declare global {
  interface Window {
    __SC__?: SmokeHook;
  }
}

interface Profile {
  name: string;
  context: BrowserContextOptions;
  touch: boolean;
}

const PROFILES: Profile[] = [
  { name: 'desktop', context: { viewport: { width: 1280, height: 720 } }, touch: false },
  { name: 'mobile', context: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, touch: true },
];

interface ProfileResult {
  name: string;
  ok: boolean;
  errors: string[];
  stats?: HookStats;
  frames: number;
  screenshot?: string;
}

interface Driver {
  step(): Promise<void>;
  release(): Promise<void>;
}

const { values: opts } = parseArgs({
  options: {
    seconds: { type: 'string', default: process.env.SMOKE_SECONDS ?? '24' },
    'no-build': { type: 'boolean', default: false },
    headed: { type: 'boolean', default: false },
  },
});
const totalSeconds = Math.max(8, Number(opts.seconds) || 24);
const perProfile = Math.max(6, Math.round(totalSeconds / PROFILES.length));

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

function keyboardMouseDriver(page: Page): Driver {
  const keys = ['w', 'a', 's', 'd'];
  let held: string[] = [];
  let mouseDown = false;
  return {
    async step() {
      for (const k of held) await page.keyboard.up(k);
      held = keys.filter(() => Math.random() < 0.35);
      for (const k of held) await page.keyboard.down(k);
      await page.mouse.move(rand(40, 1240), rand(40, 680), { steps: 2 });
      if (!mouseDown && Math.random() < 0.9) {
        await page.mouse.down();
        mouseDown = true;
      } else if (mouseDown && Math.random() < 0.1) {
        await page.mouse.up();
        mouseDown = false;
      }
    },
    async release() {
      for (const k of held) await page.keyboard.up(k);
      if (mouseDown) await page.mouse.up();
    },
  };
}

async function touchDriver(context: BrowserContext, page: Page): Promise<Driver> {
  const cdp = await context.newCDPSession(page);
  const { width, height } = page.viewportSize() ?? { width: 412, height: 915 };
  let touching = false;
  let left = { x: 0, y: 0 };
  let right = { x: 0, y: 0 };
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]): Promise<unknown> =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, id) => ({ x: Math.round(p.x), y: Math.round(p.y), id })) });
  return {
    async step() {
      if (!touching) {
        left = { x: width * 0.2, y: height * 0.75 };
        right = { x: width * 0.8, y: height * 0.75 };
        await send('touchStart', [left, right]);
        touching = true;
      } else if (Math.random() < 0.08) {
        await send('touchEnd', []);
        touching = false;
      } else {
        await send('touchMove', [
          { x: left.x + rand(-60, 60), y: left.y + rand(-60, 60) },
          { x: right.x + rand(-60, 60), y: right.y + rand(-60, 60) },
        ]);
      }
    },
    async release() {
      if (touching) await send('touchEnd', []);
    },
  };
}

async function launch(): Promise<Browser> {
  const options = { headless: !opts.headed, args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] };
  try {
    return await chromium.launch(options);
  } catch (err) {
    try {
      return await chromium.launch({ ...options, channel: 'msedge' });
    } catch {
      throw new Error(`Could not start a browser. From the repo root run: npx playwright install chromium\n${(err as Error).message}`);
    }
  }
}

async function runProfile(browser: Browser, url: string, profile: Profile): Promise<ProfileResult> {
  const context = await browser.newContext(profile.context);
  const page = await context.newPage();
  const errors = new Set<string>();
  page.on('pageerror', (e) => errors.add(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.add(`console.error: ${m.text()}`);
  });
  page.on('requestfailed', (r) => errors.add(`request failed: ${r.url()} (${r.failure()?.errorText ?? '?'})`));
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.add(`HTTP ${r.status()}: ${r.url()}`);
  });

  const result: ProfileResult = { name: profile.name, ok: false, errors: [], frames: 0 };
  try {
    await page.goto(`${url}/?smoke&seed=1234`, { waitUntil: 'load', timeout: 30_000 });
    try {
      await page.waitForFunction(() => window.__SC__?.ready === true, null, { timeout: 20_000 });
    } catch {
      errors.add('the game never became ready (window.__SC__.ready stayed false)');
    }
    try {
      await page.waitForFunction(() => window.__SC__?.scene === 'Game', null, { timeout: 10_000 });
    } catch {
      errors.add(`the game never reached the Game scene (scene: ${await page.evaluate(() => window.__SC__?.scene ?? 'none')})`);
    }

    if (errors.size === 0) {
      const driver = profile.touch ? await touchDriver(context, page) : keyboardMouseDriver(page);
      const end = Date.now() + perProfile * 1000;
      let lastFrame = await page.evaluate(() => window.__SC__!.frame);
      let lastCheck = Date.now();
      while (Date.now() < end && errors.size === 0) {
        await driver.step();
        await page.waitForTimeout(150);
        if (Date.now() - lastCheck >= 2000) {
          const snap = await page.evaluate(() => ({ frame: window.__SC__!.frame, inv: window.__SC__!.invariants(), errs: [...window.__SC__!.errors] }));
          if (snap.frame === lastFrame) errors.add('the game loop stalled: the frame counter did not advance for 2 seconds');
          for (const i of snap.inv) errors.add(`invariant failed: ${i}`);
          for (const e of snap.errs) errors.add(`game error: ${e}`);
          lastFrame = snap.frame;
          lastCheck = Date.now();
        }
      }
      await driver.release();
      const final = await page.evaluate(() => ({ stats: { ...window.__SC__!.stats }, frame: window.__SC__!.frame, inv: window.__SC__!.invariants() }));
      for (const i of final.inv) errors.add(`invariant failed: ${i}`);
      result.stats = final.stats;
      result.frames = final.frame;
      if (errors.size === 0) {
        if (final.frame < perProfile * 10) errors.add(`only ${final.frame} frames rendered in ${perProfile}s (expected at least ${perProfile * 10})`);
        if (final.stats.shotsFired === 0) errors.add('no shots were fired: aiming/firing input or the weapon system is broken');
        if (final.stats.enemiesSpawned === 0) errors.add('no enemies spawned: the spawn system is broken');
      }
    }
    fs.mkdirSync(SMOKE_OUT_DIR, { recursive: true });
    result.screenshot = path.join(SMOKE_OUT_DIR, `${profile.name}.png`);
    await page.screenshot({ path: result.screenshot }).catch(() => undefined);
  } catch (err) {
    errors.add(`smoke harness error: ${(err as Error).message}`);
  } finally {
    await context.close();
  }
  result.errors = [...errors];
  result.ok = result.errors.length === 0;
  return result;
}

async function main(): Promise<number> {
  if (!opts['no-build']) {
    console.log('smoke: building game…');
    const build = await run('npm', ['run', 'build'], { cwd: GAME_DIR, shell: true, timeoutMs: 5 * 60_000 });
    if (build.code !== 0) {
      console.log(`${build.stdout}\n${build.stderr}`.trim());
      console.log('\nSMOKE FAIL: the build failed (see output above)');
      return 1;
    }
  }
  const dist = path.join(GAME_DIR, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.log('SMOKE FAIL: game/dist/index.html missing (build produced nothing)');
    return 1;
  }
  const server = await serveStatic(dist);
  const browser = await launch();
  const results: ProfileResult[] = [];
  try {
    for (const profile of PROFILES) {
      console.log(`smoke: playing as ${profile.name} for ${perProfile}s…`);
      results.push(await runProfile(browser, server.url, profile));
    }
  } finally {
    await browser.close();
    await server.close();
  }

  fs.mkdirSync(SMOKE_OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(SMOKE_OUT_DIR, 'report.json'), JSON.stringify(results, null, 2));
  console.log('');
  for (const r of results) {
    const s = r.stats;
    const detail = s
      ? `${r.frames} frames, ${s.shotsFired} shots, ${s.enemiesSpawned} spawned, ${s.enemiesKilled} killed, ${s.upgradesTaken} upgrades, ${s.deaths} deaths`
      : 'no stats';
    console.log(`SMOKE ${r.name.padEnd(8)} ${r.ok ? 'PASS' : 'FAIL'}  (${detail})`);
    for (const e of r.errors) console.log(`  - ${e}`);
  }
  const ok = results.every((r) => r.ok);
  console.log(ok ? '\nSMOKE PASS' : '\nSMOKE FAIL: fix the errors listed above.');
  return ok ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err: Error) => {
    console.log(`SMOKE FAIL: ${err.message}`);
    process.exit(1);
  },
);

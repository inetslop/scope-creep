/**
 * Smoke play for Chokepoint (tower defence): click or tap at the cells beside the path the game
 * reports through window.__SC__.buildSpots() (first) and at random spots (buttons, the board,
 * cards), so towers get built where they can reach the enemies. Then prove a tower got built,
 * enemies spawned and a tower fired.
 */
import type { BrowserContext, Page } from 'playwright';
import { rand, touchSender, type Driver } from '../drivers.ts';
import type { SmokeGame } from '../game.ts';

interface Spot {
  x: number;
  y: number;
}

type WithSpots = { __SC__?: { overlay?: string; buildSpots?: () => Spot[] } };

/**
 * Where the next click or tap goes. The first few always go to the free cell beside the path
 * nearest the entrance, so the starting gold is spent where the first enemies pass (the test
 * must not fail on bad luck); after that, half go to cells beside the path and half anywhere.
 */
async function nextSpot(page: Page, step: number): Promise<Spot> {
  const { width, height } = page.viewportSize() ?? { width: 1280, height: 720 };
  if (step < 0) return { x: rand(10, width - 10), y: rand(10, height - 10) };
  if (step < 4 || Math.random() < 0.5) {
    const spots = await page.evaluate(() => (window as unknown as WithSpots).__SC__?.buildSpots?.() ?? []);
    const pick = step < 4 ? spots[0] : spots[Math.floor(Math.random() * Math.min(spots.length, Math.random() < 0.7 ? 4 : spots.length))];
    if (pick && Number.isFinite(pick.x) && Number.isFinite(pick.y)) return pick;
  }
  return { x: rand(10, width - 10), y: rand(10, height - 10) };
}

/** Steps count only once no overlay is up (the run opens on the augment draft); -1 while one is. */
async function counted(page: Page, step: { n: number }): Promise<number> {
  const overlay = await page.evaluate(() => (window as unknown as WithSpots).__SC__?.overlay ?? '');
  return overlay ? -1 : step.n++;
}

/** Once the first towers are down, start the wave early (Space), as a player would. */
async function startWave(page: Page, step: number): Promise<void> {
  if (step === 4) await page.keyboard.press(' ');
}

function clicks(page: Page): Driver {
  const step = { n: 0 };
  return {
    async step() {
      const n = await counted(page, step);
      await startWave(page, n);
      const p = await nextSpot(page, n);
      await page.mouse.move(p.x, p.y, { steps: 2 });
      await page.mouse.down();
      await page.mouse.up();
    },
    async release() {},
  };
}

async function taps(context: BrowserContext, page: Page): Promise<Driver> {
  const send = await touchSender(context, page);
  const step = { n: 0 };
  return {
    async step() {
      const n = await counted(page, step);
      await startWave(page, n);
      const p = await nextSpot(page, n);
      await send('touchStart', [p]);
      await send('touchEnd', []);
    },
    async release() {},
  };
}

const game: SmokeGame = {
  playScene: 'Game',
  desktop: clicks,
  mobile: taps,
  check(s) {
    const errors: string[] = [];
    if (!s.towersBuilt) errors.push('no tower was built: clicking/tapping a cell beside the path with the starting augment selected did not build one (input, the hand, gold or the tower system is broken)');
    if (!s.enemiesSpawned) errors.push('no enemies spawned: waves never started or the wave system is broken');
    if (!s.shotsFired) errors.push('no tower ever attacked: targeting or the tower system is broken');
    return errors;
  },
  describe: (s) =>
    `wave ${s.wave}, ${s.towersBuilt} towers built, ${s.augmentsPlaced} augments placed, ${s.slotsUnlocked} slots unlocked, ${s.enemiesSpawned} spawned, ${s.enemiesKilled} killed, ${s.enemiesLeaked} leaked, ${s.shotsFired} attacks, ${s.augmentsTaken} drafted, ${s.runsLost} runs lost`,
};

export default game;

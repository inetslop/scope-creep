/**
 * Smoke play for Draft Arena (multiplayer .io arena). With ?smoke the game runs its own server in
 * the page (the match against bots that a page without a server plays), so every byte still goes
 * through the real protocol.
 * Desktop: random WASD and the mouse moving; now and then a click on what the game reports through
 * window.__SC__.cardSpots() (the glowing Talents button, then talents that can be taken). Phone: a
 * thumb dragging the floating joystick, and taps on the same spots. Then prove snapshots arrived,
 * weapons fired and monsters died.
 */
import type { BrowserContext, Page } from 'playwright';
import { rand, touchSender, type Driver } from '../drivers.ts';
import type { SmokeGame } from '../game.ts';

type WithCards = { __SC__?: { cardSpots?: () => { x: number; y: number }[] } };

const cardSpots = (page: Page): Promise<{ x: number; y: number }[]> => page.evaluate(() => (window as unknown as WithCards).__SC__?.cardSpots?.() ?? []);

function keyboard(page: Page): Driver {
  const keys = ['w', 'a', 's', 'd'];
  let held: string[] = [];
  return {
    async step() {
      for (const k of held) await page.keyboard.up(k);
      held = keys.filter(() => Math.random() < 0.35);
      for (const k of held) await page.keyboard.down(k);
      await page.mouse.move(rand(40, 1240), rand(40, 680), { steps: 2 });
      if (Math.random() < 0.3) {
        const spots = await cardSpots(page);
        const s = spots[Math.floor(Math.random() * spots.length)];
        if (s) await page.mouse.click(s.x, s.y);
      }
    },
    async release() {
      for (const k of held) await page.keyboard.up(k);
    },
  };
}

async function thumb(context: BrowserContext, page: Page): Promise<Driver> {
  const send = await touchSender(context, page);
  const { width, height } = page.viewportSize() ?? { width: 412, height: 915 };
  const origin = { x: width * 0.5, y: height * 0.62 };
  let touching = false;
  return {
    async step() {
      const cards = await cardSpots(page);
      if (cards.length && Math.random() < 0.5) {
        if (touching) await send('touchEnd', []);
        const c = cards[Math.floor(Math.random() * cards.length)]!;
        await send('touchStart', [c]);
        await send('touchEnd', []);
        touching = false;
      } else if (!touching) {
        await send('touchStart', [origin]);
        touching = true;
      } else {
        await send('touchMove', [{ x: origin.x + rand(-70, 70), y: origin.y + rand(-70, 70) }]);
      }
    },
    async release() {
      if (touching) await send('touchEnd', []);
    },
  };
}

const game: SmokeGame = {
  playScene: 'Game',
  desktop: keyboard,
  mobile: thumb,
  check(s) {
    const errors: string[] = [];
    if (!s.snapshots) errors.push('no snapshots arrived: the in-page server, the protocol or the session is broken');
    if (!s.launches && !s.maxEntities) errors.push('nothing was ever on screen: the server sends no entities or the snapshot reader is broken');
    if (!s.effects) errors.push('no effects ever played: nothing died, so weapons or damage are broken');
    return errors;
  },
  describe: (s) =>
    `${s.snapshots} snapshots, up to ${s.maxEntities} entities, ${s.launches} launches, ${s.effects} effects, level ${s.level}, ${s.kills} kills, ${s.picks} picks, ${s.deaths} deaths, ${s.players} players`,
};

export default game;

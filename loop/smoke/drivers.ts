/** Input drivers for the smoke test: each step() does a little random play, release() lets go of everything. */
import type { BrowserContext, Page } from 'playwright';

export interface Driver {
  step(): Promise<void>;
  release(): Promise<void>;
}

export const rand = (min: number, max: number): number => min + Math.random() * (max - min);

/** Sends raw multi-touch events (Playwright's tap() is single-finger only). */
export async function touchSender(context: BrowserContext, page: Page): Promise<(type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) => Promise<unknown>> {
  const cdp = await context.newCDPSession(page);
  return (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, id) => ({ x: Math.round(p.x), y: Math.round(p.y), id })) });
}

/** Twin-stick on a desktop: random WASD, the mouse moving around, fire held most of the time. */
export function keyboardMouseDriver(page: Page): Driver {
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

/** Twin-stick on a phone: two thumbs down in the lower corners, wiggling, now and then lifted. */
export async function twoThumbDriver(context: BrowserContext, page: Page): Promise<Driver> {
  const send = await touchSender(context, page);
  const { width, height } = page.viewportSize() ?? { width: 412, height: 915 };
  let touching = false;
  let left = { x: 0, y: 0 };
  let right = { x: 0, y: 0 };
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

/** Clicks at random spots, a few per step, like a player placing and selecting things. */
export function randomClickDriver(page: Page): Driver {
  const { width, height } = page.viewportSize() ?? { width: 1280, height: 720 };
  return {
    async step() {
      await page.mouse.click(rand(10, width - 10), rand(10, height - 10));
    },
    async release() {},
  };
}

/** Single-finger taps at random spots (touchStart + touchEnd, so the game sees a real tap, not a mouse). */
export async function randomTapDriver(context: BrowserContext, page: Page): Promise<Driver> {
  const send = await touchSender(context, page);
  const { width, height } = page.viewportSize() ?? { width: 412, height: 915 };
  return {
    async step() {
      const p = { x: rand(10, width - 10), y: rand(10, height - 10) };
      await send('touchStart', [p]);
      await send('touchEnd', []);
    },
    async release() {},
  };
}

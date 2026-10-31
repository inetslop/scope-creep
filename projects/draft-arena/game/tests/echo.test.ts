import { describe, expect, it } from 'vitest';
import type { Launch, Player } from '../engine/api.ts';
import { bubble } from '../src/content/projectiles/bubble.ts';
import { echoOutLeg, echoReturnRadius } from '../src/content/projectiles/echo-bubble.ts';
import { echo, echoRank } from '../src/content/upgrades/echo.ts';

/** The echo bubble's out leg is today's Lob bubble: same aim, same arc, same landing, at any Quick speed. */
describe('echo: the out leg is the Lob bubble', () => {
  const launches: Launch[] = [
    { x: 0, y: 0, angle: 0.3, speed: 400, seed: 1, p1: 300, p2: 120 * 8 + 2 },
    { x: -150, y: 80, angle: 2.2, speed: 500, seed: 7, p1: 100, p2: 40 * 8 + 0 },
    { x: 40, y: -25, angle: 5.5, speed: 725, seed: 13, p1: 500, p2: 300 * 8 + 5 },
  ];
  for (const s of launches) {
    it(`matches bubble.path from (${s.x}, ${s.y}) at ${s.speed} u/s`, () => {
      for (let t = 0; t <= 0.8; t += 0.01) {
        expect(echoOutLeg(s, t)).toEqual(bubble.path!(s, t, { x: 0, y: 0 }));
      }
    });
  }
});

describe('echo: the return splash radius', () => {
  it('is 50%, 75% and 100% of the splash at ranks 1, 2 and 3', () => {
    expect(echoReturnRadius(1)).toBe(0.5);
    expect(echoReturnRadius(2)).toBe(0.75);
    expect(echoReturnRadius(3)).toBe(1);
  });
});

describe('echo: the held rank', () => {
  it('reads the rank off the player, defensively 0 when unheld', () => {
    expect(echoRank({ upgrades: new Map([[echo, { level: 2, timer: 0 }]]) } as unknown as Player)).toBe(2);
    expect(echoRank({} as Player)).toBe(0);
  });
});

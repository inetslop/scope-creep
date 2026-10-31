import { describe, expect, it } from 'vitest';
import type { Launch, Player } from '../engine/api.ts';
import { driftBolt } from '../src/content/projectiles/drift-bolt.ts';
import { drift, driftRank } from '../src/content/upgrades/drift.ts';

/** The drift bolt: full speed for its first 120 units, then 40% of it for the rest of the flight. */
describe('drift: the two-phase bolt', () => {
  const launch: Launch = { x: 0, y: 0, angle: 0, speed: 560, seed: 1, p1: 0, p2: 0 };
  const at = (t: number): { x: number; y: number } => driftBolt.path!(launch, t, { x: 0, y: 0 });

  it('flies at full speed for its first 120 units', () => {
    for (let t = 0; t <= 120 / 560; t += 0.01) {
      const p = at(t);
      expect(p.x).toBe(560 * t);
      expect(p.y).toBe(0);
    }
  });

  it('drifts at 40% speed until its life runs out', () => {
    for (const t of [120 / 560 + 0.05, 0.8, 1.2]) {
      const p = at(t);
      expect(Math.hypot(p.x, p.y)).toBe(120 + 0.4 * 560 * (t - 120 / 560));
      expect(p.y).toBe(0);
    }
  });
});

describe('drift: the held rank', () => {
  it('reads the rank off the player, defensively 0 when unheld', () => {
    expect(driftRank({ upgrades: new Map([[drift, { level: 2, timer: 0 }]]) } as unknown as Player)).toBe(2);
    expect(driftRank({} as Player)).toBe(0);
  });
});

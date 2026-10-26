/**
 * Locks down spawn unlock timing: every director-spawnable enemy is absent just
 * before its `unlockAtSec` and present at/after it. Enemies with spawnWeight 0
 * (split children) must never appear in the director pool at any time.
 */
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { SpawnDirector } from '../../src/core/director';

const director = new SpawnDirector(ENEMIES);
const idsAt = (t: number): Set<string> => new Set(director.unlocked(t).map((e) => e.id));

describe('spawn unlock timing', () => {
  it.each(ENEMIES.map((e) => [e.id, e] as const))('%s unlocks exactly at unlockAtSec', (_id, e) => {
    if (e.spawnWeight === 0) {
      expect(idsAt(0).has(e.id), 'never in the director pool').toBe(false);
      expect(idsAt(600).has(e.id), 'never in the director pool').toBe(false);
      return;
    }
    expect(idsAt(e.unlockAtSec - 1).has(e.id), 'absent just before unlock').toBe(false);
    expect(idsAt(e.unlockAtSec).has(e.id), 'present at unlock').toBe(true);
    expect(idsAt(600).has(e.id), 'present well past unlock').toBe(true);
  });

  it('the available set never shrinks as time grows', () => {
    let prev = idsAt(0);
    for (let t = 5; t <= 600; t += 5) {
      const cur = idsAt(t);
      for (const id of prev) expect(cur.has(id), `"${id}" disappears at ${t}s`).toBe(true);
      prev = cur;
    }
  });
});

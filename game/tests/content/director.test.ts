import { describe, expect, it } from 'vitest';
import { ELITE } from '../../src/config';
import { ENEMIES } from '../../src/content/enemies';
import { SpawnDirector } from '../../src/core/director';
import { Rng } from '../../src/core/rng';

const DT = 1;

/** Drive the director one whole second at a time from t=0; record each second that yields an elite. */
function eliteTimes(seed: number, upTo: number): number[] {
  const director = new SpawnDirector(ENEMIES);
  const rng = new Rng(seed);
  const times: number[] = [];
  for (let t = 0; t <= upTo; t += DT) {
    const d = director.update(DT, t, 10, rng);
    if (d.elites.length > 0) times.push(t);
  }
  return times;
}

describe('elite spawn schedule', () => {
  it('no elite before 45s', () => {
    expect(eliteTimes(123, 44)).toEqual([]);
  });
  it('first elite at exactly 45s', () => {
    expect(eliteTimes(123, 45)).toEqual([45]);
  });
  it('exactly one elite every 45s: 45, 90, 135, 180', () => {
    expect(eliteTimes(123, 180)).toEqual([45, 90, 135, 180]);
  });
  it('no elite between the marks', () => {
    for (const t of eliteTimes(123, 180)) {
      expect(t % ELITE.intervalSec === 0, `elite at unexpected time ${t}s`).toBe(true);
    }
  });
  it('same seed gives identical elite timing', () => {
    expect(eliteTimes(987654321, 300)).toEqual(eliteTimes(987654321, 300));
  });
});

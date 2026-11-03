import { describe, expect, it } from 'vitest';
import { boardHasCove, roadStretches } from '../../src/core/cove';
import { generateMap, type GameMap } from '../../src/core/map';
import { boardHasLoop } from '../../src/core/loop';
import { boardHasSlowStretch } from '../../src/core/slowStretch';
import { Rng } from '../../src/core/rng';
import { boardHasTwin } from '../../src/core/twin';

// TEMP review probe for T0453 — delete after use.
const ls = (path: GameMap['path']): number => {
  let m = 0;
  for (const s of roadStretches(path)) m = Math.max(m, s.end - s.start + 1);
  return m;
};

const grow = (seed: number, cols: number, rows: number, fold = false): GameMap =>
  generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, fold, false, seed);

describe('tmp long straight review probe', () => {
  it('measures the distribution, seed 16, and the smallest committed seed', () => {
    let long6 = 0;
    let long7 = 0;
    let maxOff = 0;
    let maxAll = 0;
    let foldMax = 0;
    let foldOff6 = 0;
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 2000; seed++) {
        const m = grow(seed, cols, rows);
        const v = ls(m.path);
        maxAll = Math.max(maxAll, v);
        if (!m.fork && !m.loop) {
          maxOff = Math.max(maxOff, v);
          if (v >= 6) long6++;
          if (v >= 7) long7++;
        }
        const mf = grow(seed, cols, rows, true);
        if (!mf.fork && !mf.loop) {
          const vf = ls(mf.path);
          foldMax = Math.max(foldMax, vf);
          if (vf >= 6) foldOff6++;
        }
      }
    }
    console.log('maxOffForkLoop(no fold):', maxOff, '| maxAll:', maxAll, '| >=6 off fork/loop:', long6, '/4000 =', (long6 / 4000).toFixed(4), '| >=7 off fork/loop:', long7);
    console.log('switchback-fold boards (no fork/loop): max straight', foldMax, ', of which', foldOff6, '/4000 have straight >= 6');

    const m16 = grow(16, 8, 14);
    console.log(
      'seed16(8x14): longest', ls(m16.path), 'fork', !!m16.fork, 'loop', !!m16.loop, 'cove', !!m16.cove, 'twin', !!m16.twin, 'slow', !!m16.slowStretch, 'farGate', !!m16.farGate,
      '| hashes: loop', boardHasLoop(16), 'cove', boardHasCove(16), 'twin', boardHasTwin(16), 'slow', boardHasSlowStretch(16),
    );
    expect(m16).toEqual(generateMap(new Rng(16), 8, 14, 5)); // the byte-identical premise of the committed test

    let smallest = -1;
    for (let s = 16; s <= 200; s++) {
      const mm = grow(s, 8, 14);
      if (!mm.fork && !mm.loop && ls(mm.path) >= 6) { smallest = s; break; }
    }
    console.log('smallest seed >= 16 with the trait on 8x14:', smallest);
    for (const s of [10, 12]) {
      const mm = grow(s, 8, 14);
      console.log(`unused seed ${s} (8x14): longest ${ls(mm.path)}, fork ${!!mm.fork}, loop ${!!mm.loop}`);
    }
    console.log('seed16 path:', m16.path.map((c) => `${c.col},${c.row}`).join(' '));
    expect(true).toBe(true);
  });
});

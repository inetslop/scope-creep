import { describe, expect, it } from 'vitest';
import { bankScore, chooseBank, type BankTower } from '../../src/core/bankChoice';
import { CELL } from '../../src/config';
import { exitPoint } from '../../src/core/flyRoute';
import { generateMap } from '../../src/core/map';
import type { Point } from '../../src/core/path';
import { Rng } from '../../src/core/rng';

/**
 * The wave-50 Flyer's bank choice (core/bankChoice.ts): at half health it banks into the
 * candidate edge point its standing towers cover least — the seeded point with no towers or a
 * tie. These pin the pure choice on a 14x8 fixture board: no towers the seeded point, a wide
 * ring in the middle the line that avoids it, cover on one side the bare side, total coverage
 * the seeded tie-break, and the same inputs (towers in any order) the same line — no rng at
 * bank time.
 */
describe('bankChoice', () => {
  const map = generateMap(new Rng(7), 14, 8, 0);
  const seeded: Point = { x: 14 * CELL, y: 4 * CELL }; // mid of the right edge
  const from: Point = { x: CELL, y: 4 * CELL };
  const exit = exitPoint(map, CELL);
  // The fixture's candidates, as chooseBank builds them: the seeded point is nearest the right
  // edge, so nine even points on it, corners included, in order.
  const cands: Point[] = Array.from({ length: 9 }, (_, i) => ({ x: 14 * CELL, y: i * CELL }));

  it('with no standing towers it is the seeded point, on the seeded edge', () => {
    const p = chooseBank(map, CELL, from, seeded, exit, []);
    expect(p).toEqual(seeded);
    expect(p.x).toBe(14 * CELL);
  });

  it('one wide tower at the island center: the candidate whose line avoids its ring', () => {
    const wide: BankTower = { x: 7 * CELL, y: 4 * CELL, range: 3 * CELL };
    const p = chooseBank(map, CELL, from, seeded, exit, [wide]);
    expect(p).not.toEqual(seeded);
    expect(p.x).toBe(14 * CELL); // still on the edge
    // The middle line runs through the ring: the chosen line leaves more of it uncovered.
    expect(bankScore(CELL, from, exit, p, [wide])).toBeGreaterThan(bankScore(CELL, from, exit, seeded, [wide]));
  });

  it('covered on one side and bare on the other: it crosses the bare side', () => {
    const top: BankTower[] = Array.from({ length: 11 }, (_, k) => ({ x: (2 + k) * CELL, y: 1.5 * CELL, range: 3 * CELL }));
    const p = chooseBank(map, CELL, from, seeded, exit, top);
    expect(p.y).toBeGreaterThanOrEqual(6 * CELL);
    for (const c of cands) {
      expect(bankScore(CELL, from, exit, p, top)).toBeGreaterThanOrEqual(bankScore(CELL, from, exit, c, top));
    }
  });

  it('total coverage: every line scores 0 and the tie breaks to the seeded point', () => {
    const all: BankTower = { x: 7 * CELL, y: 4 * CELL, range: 20 * CELL };
    for (const c of [...cands, seeded]) expect(bankScore(CELL, from, exit, c, [all])).toBe(0);
    expect(chooseBank(map, CELL, from, seeded, exit, [all])).toEqual(seeded);
  });

  it('is deterministic: the same inputs bank the same line, the towers in any order', () => {
    const mid: BankTower[] = [
      { x: 4 * CELL, y: 2 * CELL, range: 2 * CELL },
      { x: 9 * CELL, y: 5.5 * CELL, range: 3 * CELL },
      { x: 11 * CELL, y: 1 * CELL, range: 1.5 * CELL },
    ];
    const a = chooseBank(map, CELL, from, seeded, exit, mid);
    expect(chooseBank(map, CELL, from, seeded, exit, mid)).toEqual(a);
    expect(chooseBank(map, CELL, from, seeded, exit, [...mid].reverse())).toEqual(a);
  });
});

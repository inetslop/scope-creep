import { describe, expect, it } from 'vitest';
import { BOARD_NODES } from '../../src/content/tech/board';
import { chokeCells } from '../../src/core/choke';
import { generateMap, kindAt, type GameMap } from '../../src/core/map';
import { loadProfile, type KeyValueStore } from '../../src/core/profile';
import { Rng } from '../../src/core/rng';
import { switchbackFold } from '../../src/core/switchback';
import { boardFold, buyBoardNode, nodeCost } from '../../src/core/tech';

/** The path runs edge to edge, is side-adjacent, uses no cell twice, stays in bounds, and sits on 'path'. */
function expectValidPath(map: GameMap): void {
  const { path, vertical, cols, rows } = map;
  if (vertical) {
    expect(path[0]!.row).toBe(0);
    expect(path[path.length - 1]!.row).toBe(rows - 1);
  } else {
    expect(path[0]!.col).toBe(0);
    expect(path[path.length - 1]!.col).toBe(cols - 1);
  }
  const seen = new Set<string>();
  path.forEach((c, i) => {
    expect(c.col >= 0 && c.col < cols && c.row >= 0 && c.row < rows).toBe(true);
    expect(kindAt(map, c.col, c.row)).toBe('path');
    const key = `${c.col},${c.row}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    if (i > 0) expect(Math.abs(c.col - path[i - 1]!.col) + Math.abs(c.row - path[i - 1]!.row)).toBe(1);
  });
}

describe('the switchback', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: 50 seeds every fold the road mid-board, and the boards stay valid`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const folded = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, true);
        expectValidPath(folded);
        const fold = switchbackFold(folded);
        expect(fold, `seed ${seed}: no fold in the road`).not.toBeNull();
        expect(fold!.gap).toBeGreaterThanOrEqual(1);
        expect(fold!.gap).toBeLessThanOrEqual(2);
        expect(fold!.a.length).toBeGreaterThanOrEqual(3);
        expect(fold!.a.length).toBeLessThanOrEqual(5);
        expect(fold!.b.length).toBeGreaterThanOrEqual(3);
        expect(fold!.b.length).toBeLessThanOrEqual(5);
        // The earlier run starts in the middle third of the road.
        expect(fold!.start * 3).toBeGreaterThanOrEqual(folded.path.length);
        expect(fold!.start * 3).toBeLessThanOrEqual(folded.path.length * 2);
        // The one guaranteed choke cell is untouched (the corridor only adds double-cover cells).
        expect(chokeCells(folded).length).toBeGreaterThanOrEqual(1);
        // Deterministic: a fresh identical call gives the same board.
        expect(folded).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, true));
        // Without the node: today's board, byte-identical and fold-free.
        const plain = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false);
        expect(plain).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1));
        expect(switchbackFold(plain)).toBeNull();
      }
    });
  }

  it('the fold holds across bends and road length, both orientations', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (const mul of [1, 1.25]) {
        for (const bends of [0, 1]) {
          for (let seed = 1; seed <= 40; seed++) {
            const map = generateMap(new Rng(seed), cols, rows, 5, bends, mul, 2, 1, true);
            expectValidPath(map);
            const fold = switchbackFold(map);
            expect(fold, `seed ${seed} (bends ${bends}, mul ${mul}): no fold in the road`).not.toBeNull();
            expect(fold!.gap).toBeGreaterThanOrEqual(1);
            expect(fold!.gap).toBeLessThanOrEqual(2);
            expect(fold!.a.length).toBeGreaterThanOrEqual(3);
            expect(fold!.b.length).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });

  it('boardFold reads the owned switchback node; duplicates and unknown ids count once and for nothing', () => {
    expect(boardFold([])).toBe(false);
    expect(boardFold(['one-more-bend', 'long-way', 'two-chokes'])).toBe(false);
    expect(boardFold(['switchback'])).toBe(true);
    expect(boardFold(['switchback', 'switchback', 'nope'])).toBe(true);
  });

  it('the branch reads 10, 30, 50 and the switchback is the fourth node at 80', () => {
    expect(nodeCost(BOARD_NODES, 'one-more-bend')).toBe(10);
    expect(nodeCost(BOARD_NODES, 'long-way')).toBe(30);
    expect(nodeCost(BOARD_NODES, 'two-chokes')).toBe(50);
    expect(nodeCost(BOARD_NODES, 'switchback')).toBe(80);
  });

  it('buyBoardNode spends the 80 on the switchback, persists the id, and 79 refuses', () => {
    const store = withCoins(80, ['one-more-bend', 'long-way', 'two-chokes']);
    expect(buyBoardNode(store, 'switchback')).toBe(true);
    expect(loadProfile(store).coins).toBe(0);
    expect(loadProfile(store).purchased).toContain('switchback');
    const broke = withCoins(79, ['one-more-bend', 'long-way', 'two-chokes']);
    expect(buyBoardNode(broke, 'switchback')).toBe(false); // unaffordable: 79 < 80
    expect(loadProfile(broke).coins).toBe(79);
  });
});

const memory = (): KeyValueStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const withCoins = (coins: number, purchased: string[]): KeyValueStore => {
  const store = memory();
  store.setItem('chokepoint:profile', JSON.stringify({ coins, purchased }));
  return store;
};

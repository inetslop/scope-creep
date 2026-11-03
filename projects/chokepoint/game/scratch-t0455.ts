// Scratch verification for T0455 (delete before npm run check).
import { generateMap } from './src/core/map.ts';
import { Rng } from './src/core/rng.ts';
import { boardHasSlowStretch, slowStretchHash } from './src/core/slowStretch.ts';

const grow = (n: number, cols = 8, rows = 14) => generateMap(new Rng(n), cols, rows, 5, 0, 1, 2, 1, false, false, n);

// 1. Seed 14: smallest free seed whose row board (8x14) carries the stretch.
const used = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 15]);
let smallest = -1;
for (let n = 1; n <= 200; n++) {
  if (used.has(n)) continue;
  if (grow(n).slowStretch) { smallest = n; break; }
}
console.log('smallest free seeded stretch board:', smallest);

// 2. Roll frequency over 4000 seeds.
let hit = 0;
for (let n = 1; n <= 4000; n++) hit += boardHasSlowStretch(n) ? 1 : 0;
console.log('boardHasSlowStretch hits in 4000:', hit, `(${(hit / 4000).toFixed(3)})`);

// 3. Composition + frequency over 1000 seeds x both orientations; invariants on stretched boards.
let stretched = 0, forkStretched = 0, loopStretched = 0, coveStretched = 0, twinStretched = 0, fargateStretched = 0;
let consecutiveFail = 0, coverFail = 0, nonRollHas = 0;
for (const [cols, rows] of [[14, 8], [8, 14]] as const) {
  for (let seed = 1; seed <= 1000; seed++) {
    const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
    if (!boardHasSlowStretch(seed) && map.slowStretch) nonRollHas++;
    const s = map.slowStretch;
    if (!s) continue;
    stretched++;
    if (map.fork) forkStretched++;
    if (map.loop) loopStretched++;
    if (map.cove) coveStretched++;
    if (map.twin) twinStretched++;
    if (map.farGate) fargateStretched++;
    // The three cells must be consecutive path indices (the tint's findIndex relies on it).
    const i = map.path.findIndex((c) => c.col === s.cells[0]!.col && c.row === s.cells[0]!.row);
    if (i < 0 || i + 2 >= map.path.length + 1) consecutiveFail++;
    else for (let k = 0; k < 3; k++) {
      const p = map.path[i + k]!, c = s.cells[k]!;
      if (p.col !== c.col || p.row !== c.row) consecutiveFail++;
    }
    // The tint's pts indices must exist (pts = before + path + after).
    if (i < 0 || i + 4 > map.path.length + 1) console.log('TINT INDEX RISK', seed, i, map.path.length);
    // Cover: build cell on each side.
    const open = (col: number, row: number): boolean => col >= 0 && col < cols && row >= 0 && row < rows && map.kinds[row]![col] === 'open';
    const a = s.cells[0]!, b = s.cells[1]!, c2 = s.cells[2]!;
    const dc = b.col - a.col, dr = b.row - a.row;
    let cover = true;
    if (c2.col - b.col === dc && c2.row - b.row === dr) {
      for (const p of s.cells) {
        if (!open(p.col - dr, p.row + dc) || !open(p.col + dr, p.row - dc)) cover = false;
      }
    } else {
      const rest = [b.col - 1, b.row, b.col + 1, b.row, b.col, b.row - 1, b.col, b.row + 1];
      for (let k = 0; k < rest.length; k += 2) {
        const col = rest[k]!, row = rest[k + 1]!;
        const isRunCell = (col === a.col && row === a.row) || (col === c2.col && row === c2.row);
        if (!isRunCell && !open(col, row)) cover = false;
      }
    }
    if (!cover) coverFail++;
  }
}
console.log('stretched:', stretched, 'of 2000', `(${(stretched / 2000).toFixed(3)})`);
console.log('fork+stretch:', forkStretched, 'loop+stretch:', loopStretched, 'cove+stretch:', coveStretched, 'twin+stretch:', twinStretched, 'fargate+stretch:', fargateStretched);
console.log('consecutiveFail:', consecutiveFail, 'coverFail:', coverFail, 'nonRollHas:', nonRollHas);

// 4. No-straight-3 boards: how often the bend fallback is used, and does it ever fail cover?
let noStraight = 0, bendPlaced = 0, bendFailed = 0;
for (const [cols, rows] of [[14, 8], [8, 14]] as const) {
  for (let seed = 1; seed <= 2000; seed++) {
    if (!boardHasSlowStretch(seed)) continue;
    const grown = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false); // pre-modifier road is not right; use the final map's road instead
    void grown;
    const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
    // Recompute stretches of the final path.
    const hasStraight3 = (() => {
      const path = map.path;
      let start = 0;
      for (let i = 2; i <= path.length; i++) {
        const changed = i === path.length || path[i]!.col - path[i - 1]!.col !== path[i - 1]!.col - path[i - 2]!.col || path[i]!.row - path[i - 1]!.row !== path[i - 1]!.row - path[i - 2]!.row;
        if (changed) { if (i - start >= 3) return true; start = i - 1; }
      }
      return false;
    })();
    if (!hasStraight3) { noStraight++; if (map.slowStretch) bendPlaced++; else bendFailed++; }
  }
}
console.log('roll-seeds with no straight-3 run:', noStraight, 'bend placed:', bendPlaced, 'bend failed cover:', bendFailed);

// 5. Byte-identical: a seeded board without any seeded modifier equals the seedless grow.
let mism = 0, checked = 0;
for (const [cols, rows] of [[14, 8], [8, 14]] as const) {
  for (let seed = 1; seed <= 300; seed++) {
    const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
    if (map.loop || map.fork || map.cove || map.twin || map.slowStretch) continue;
    checked++;
    const a = JSON.stringify(map), b = JSON.stringify(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false));
    if (a !== b) mism++;
  }
}
console.log('byte-identical check:', checked, 'boards,', mism, 'mismatches');

// 6. The bend pick uses the hash: show the picked bend index for seed 42 on the test's staircase (sanity vs test).
void slowStretchHash(42);
console.log('hash(42) % 3 =', slowStretchHash(42) % 3);

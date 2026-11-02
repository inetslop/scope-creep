import type { GameMap } from './map';
import type { Point } from './path';

/** A standing tower as the bank read needs it (board units); range 0 covers nothing. */
export interface BankTower {
  x: number;
  y: number;
  /** = spec.range * CELL: the ring a placed tower shows. */
  range: number;
}

/** Ties: candidates within this much of the best uncovered fraction count as one line. */
const TIE = 0.02;

/**
 * Uncovered fraction (0-1) of the two segments from -> candidate -> exit: quarter-cell samples,
 * the same grid as openFraction. A sample is covered when it lies inside any tower with
 * range > 0 (the same convention as targeting.inRange); a 0-ring covers nothing.
 */
export function bankScore(cellSize: number, from: Point, exit: Point, candidate: Point, towers: readonly BankTower[]): number {
  const L1 = Math.hypot(candidate.x - from.x, candidate.y - from.y);
  const L2 = Math.hypot(exit.x - candidate.x, exit.y - candidate.y);
  const total = L1 + L2;
  const n = Math.max(1, Math.ceil(total / (cellSize / 4)));
  let open = 0;
  for (let j = 0; j <= n; j++) {
    // The sample at distance (j/n) * (L1 + L2), walking segment 1 (from -> candidate) then 2 (candidate -> exit).
    const d = (j / n) * total;
    const onFirst = d <= L1;
    const a = onFirst ? from : candidate;
    const b = onFirst ? candidate : exit;
    const span = onFirst ? L1 : L2;
    const t = span > 0 ? (d - (onFirst ? 0 : L1)) / span : 0;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    let covered = false;
    for (const tw of towers) {
      if (tw.range <= 0) continue;
      const dx = x - tw.x;
      const dy = y - tw.y;
      if (dx * dx + dy * dy <= tw.range * tw.range) { covered = true; break; }
    }
    if (!covered) open++;
  }
  return open / (n + 1);
}

/**
 * The bank point the wave-50 Flyer turns into: the least-covered candidate. Pure — the same
 * board, from, seeded and towers pick the same point, and no rng is drawn at bank time. The
 * candidates are nine points evenly on the board edge nearest the seeded point (corners
 * included) plus the seeded point itself: with no standing towers every line scores 1 and the
 * seeded point is returned, byte-identical to the old seeded bank; ties (within TIE) break to
 * the seeded point first, then the candidates' fixed order.
 */
export function chooseBank(map: GameMap, cellSize: number, from: Point, seeded: Point, exit: Point, towers: readonly BankTower[]): Point {
  // The candidate edge: the board side nearest the seeded point, ties in left/right/top/bottom order.
  const w = map.cols * cellSize;
  const h = map.rows * cellSize;
  const dists = [seeded.x, w - seeded.x, seeded.y, h - seeded.y];
  let edge = 0;
  for (let i = 1; i < dists.length; i++) if (dists[i]! < dists[edge]!) edge = i;
  const cands: Point[] = [];
  if (edge <= 1) {
    const x = edge === 0 ? 0 : w;
    for (let i = 0; i <= 8; i++) cands.push({ x, y: (i / 8) * h });
  } else {
    const y = edge === 2 ? 0 : h;
    for (let i = 0; i <= 8; i++) cands.push({ x: (i / 8) * w, y });
  }
  // The seeded point is always its own last entry, even when it coincides with a sample.
  cands.push(seeded);
  const scores = cands.map((c) => bankScore(cellSize, from, exit, c, towers));
  let best = 0;
  for (const s of scores) best = Math.max(best, s);
  if (scores[scores.length - 1]! >= best - TIE) return seeded;
  for (let i = 0; i < cands.length - 1; i++) if (scores[i]! >= best - TIE) return cands[i]!;
  return seeded;
}

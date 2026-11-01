import { CELL } from '../config';
import { CHOKES_RANGE, chokeCells } from './choke';
import type { Cell, GameMap } from './map';
import { isBossWave, type WavePlan } from './waves';

/** The far gate's road cell, or none. */
export function farGateCell(map: GameMap): Cell | undefined {
  const path = map.path;
  const n = path.length;
  if (n < 9) return undefined;
  const target = Math.floor(n / 3);
  const lo = 2;
  const hi = Math.floor(n / 2);
  const chokes = chokeCells(map);
  const straight = (i: number): boolean => {
    const a = path[i - 1]!;
    const b = path[i]!;
    const c = path[i + 1]!;
    return b.col - a.col === c.col - b.col && b.row - a.row === c.row - b.row;
  };
  const clear = (i: number): boolean => {
    const b = path[i]!;
    for (const ck of chokes) if (Math.hypot(b.col - ck.col, b.row - ck.row) <= CHOKES_RANGE) return false;
    return true;
  };
  for (let d = 0; ; d++) {
    const cands = d === 0 ? [target] : [target - d, target + d];
    const inWin = cands.map((i) => i >= lo && i <= hi);
    if (!inWin.some(Boolean)) break; // both candidates left the window
    for (let k = 0; k < cands.length; k++) {
      const i = cands[k];
      if (!inWin[k]) continue;
      if (straight(i) && clear(i)) return path[i];
    }
  }
  return undefined;
}

/** Board units along the route from the route start to the far gate's cell center (0 with no gate). */
export function farGateDistance(map: GameMap): number {
  const fg = map.farGate;
  if (!fg) return 0;
  const i = map.path.findIndex((c) => c.col === fg.col && c.row === fg.row);
  return (i + 1) * CELL;
}

/** The far gate's share of a spawn list's length. */
export function farGateSplit(count: number): number {
  return Math.floor(count / 3);
}

/** Whether spawn `index` of `plan` comes out of the far gate. */
export function isFarGateSpawn(index: number, plan: WavePlan, hasFarGate: boolean): boolean {
  return hasFarGate && farGateSplit(plan.spawns.length) > 0 && !isBossWave(plan.number) && index % 3 === 2;
}

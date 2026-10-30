import { MAX_SLOTS } from '../config';
import { AUGMENTS } from '../content/augments';
import type { AugmentCopy, Tier } from '../content/types';
import type { RunMode } from './run';
import { TIER_ORDER } from './tiers';

/**
 * A run closed mid-way: kept on the device (its own key, not the profile's) so the menu can
 * offer to resume it. It is saved at the two phase boundaries, build start and wave start; a
 * wave resume replays that wave from its first spawn. Storage is passed in, so this stays pure.
 */

/** Where a saved run is written; window.localStorage fits. */
export interface RunStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** A tower: its cell, its unlocked slots, and the augment copies in them, in order. */
export interface SavedTower {
  col: number;
  row: number;
  slots: number;
  augments: AugmentCopy[];
}

/** A mid-way run: the board regenerates from the seed, the rest is the run's state as saved. */
export interface SavedRun {
  v: 1;
  seed: number;
  cols: number;
  rows: number;
  /** The board's entrance jog: 1 when the road was generated with one extra bend, 0 in older saves. */
  bends: number;
  /** The road length the run's boards start from: 1.25 when "The long way" was owned, 1 in older saves; level N multiplies it by 1.25^(N-1). */
  lengthMul: number;
  /** Which of the run's three levels this save's board is: the board re-grows at each level clear (1 in older saves). */
  level: number;
  /** The board's generation version: 2 when the board carries a guaranteed choke cell, 1 in older saves. */
  bgen: number;
  gold: number;
  lives: number;
  /** How the run was started; the Iron mode's one life and doubled coins resume with it. */
  mode: RunMode;
  /** The wave being fought, or the last one fought (0 before the first). */
  wave: number;
  phase: 'build' | 'wave';
  hand: AugmentCopy[];
  kills: number;
  cleanWaves: number;
  rerollUsed: boolean;
  towers: SavedTower[];
}

export const SAVED_RUN_KEY = 'chokepoint:saved-run';

function inInt(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

function inRange(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

function isCopy(v: unknown): v is AugmentCopy {
  if (!v || typeof v !== 'object') return false;
  const { id, tier } = v as { id?: unknown; tier?: unknown };
  if (typeof id !== 'string' || typeof tier !== 'string') return false;
  return AUGMENTS.some((a) => a.id === id) && TIER_ORDER.includes(tier as Tier);
}

/** The saved run, or undefined when there is none or it is broken (never throws). */
export function loadSavedRun(store: RunStore | undefined): SavedRun | undefined {
  let parsed: unknown;
  try {
    const raw = store?.getItem(SAVED_RUN_KEY);
    if (!raw) return undefined;
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== 'object') return undefined;
  const p = parsed as Record<string, unknown>;
  if (p.v !== 1) return undefined;
  if (p.phase !== 'build' && p.phase !== 'wave') return undefined;
  if (!inInt(p.wave, 0, 1e6)) return undefined;
  if (p.phase === 'wave' && p.wave < 1) return undefined;
  if (!inInt(p.seed, 0, 2 ** 53)) return undefined;
  if (!inInt(p.cols, 1, 32) || !inInt(p.rows, 1, 32)) return undefined;
  if (p.bends !== undefined && p.bends !== 0 && p.bends !== 1) return undefined;
  if (p.lengthMul !== undefined && p.lengthMul !== 1 && p.lengthMul !== 1.25) return undefined;
  if (p.level !== undefined && !inInt(p.level, 1, 3)) return undefined;
  if (p.bgen !== undefined && !inInt(p.bgen, 1, 8)) return undefined;
  if (!inRange(p.gold, 0, 1e6)) return undefined;
  if (!inInt(p.lives, 0, 1e6) || !inInt(p.kills, 0, 1e6) || !inInt(p.cleanWaves, 0, 1e6)) return undefined;
  if (p.mode !== undefined && p.mode !== 'play' && p.mode !== 'iron') return undefined;
  if (typeof p.rerollUsed !== 'boolean') return undefined;
  if (!Array.isArray(p.hand) || p.hand.length > 100 || !p.hand.every(isCopy)) return undefined;
  if (!Array.isArray(p.towers) || p.towers.length > 200) return undefined;
  for (const t of p.towers) {
    if (!t || typeof t !== 'object') return undefined;
    const tower = t as Record<string, unknown>;
    if (!inInt(tower.col, 0, 63) || !inInt(tower.row, 0, 63)) return undefined;
    if (tower.col >= p.cols || tower.row >= p.rows) return undefined; // off the board this save describes
    if (!inInt(tower.slots, 1, MAX_SLOTS)) return undefined;
    if (!Array.isArray(tower.augments) || tower.augments.length > tower.slots || !tower.augments.every(isCopy)) return undefined;
  }
  return {
    v: 1,
    seed: p.seed,
    cols: p.cols,
    rows: p.rows,
    bends: p.bends === 1 ? 1 : 0,
    lengthMul: p.lengthMul === 1.25 ? 1.25 : 1,
    level: inInt(p.level, 1, 3) ? p.level : 1,
    bgen: inInt(p.bgen, 1, 8) ? p.bgen : 1,
    gold: p.gold,
    lives: p.lives,
    mode: p.mode === 'iron' ? 'iron' : 'play',
    wave: p.wave,
    phase: p.phase,
    hand: p.hand as AugmentCopy[],
    kills: p.kills,
    cleanWaves: p.cleanWaves,
    rerollUsed: p.rerollUsed,
    towers: p.towers as SavedTower[],
  };
}

/** Writes the run under the saved-run key, replacing whatever was there. */
export function saveRun(store: RunStore | undefined, run: SavedRun): void {
  try {
    store?.setItem(SAVED_RUN_KEY, JSON.stringify(run));
  } catch {
    /* private mode or full storage: the run just isn't kept */
  }
}

export function clearSavedRun(store: RunStore | undefined): void {
  try {
    store?.removeItem(SAVED_RUN_KEY);
  } catch {
    /* private mode: the run just isn't kept */
  }
}

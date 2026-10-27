import { shardXp } from './gilt';

/**
 * The Redactor: the first pre-run pick. While picked, every shard is worth half
 * XP, and the Redact active erases the ink closing in around the player.
 */
export const REDACT_RADIUS = 140;
export const REDACT_COOLDOWN_SEC = 12;
export const REDACT_SLOW_SEC = 2.5;
export const REDACT_SLOW_MUL = 0.6;
export const REDACT_FLASH_MS = 100;

/** XP for a shard pickup with the Redactor in the loadout: gilt is multiplied first, then every shard is halved (rounded down). Unpicked: exactly shardXp. */
export function redactorShardXp(base: number, gilt: boolean, picked: boolean): number {
  const xp = shardXp(base, gilt);
  return picked ? Math.floor(xp / 2) : xp;
}

/**
 * One frame of a Redact slow. `retriggered` refreshes the full window; otherwise the
 * timer ticks down and the speed multiplier lifts back to 1 when it runs out.
 */
export function redactSlowTick(slowLeftSec: number, dtSec: number, retriggered: boolean): { left: number; mul: number } {
  if (retriggered) return { left: REDACT_SLOW_SEC, mul: REDACT_SLOW_MUL };
  if (slowLeftSec <= 0) return { left: 0, mul: 1 };
  const left = slowLeftSec - dtSec;
  return left > 0 ? { left, mul: REDACT_SLOW_MUL } : { left: 0, mul: 1 };
}

/** Closed disk around the player: a point at exactly the radius counts as in range. */
export function inRedactRadius(px: number, py: number, x: number, y: number): boolean {
  const dx = px - x;
  const dy = py - y;
  return dx * dx + dy * dy <= REDACT_RADIUS * REDACT_RADIUS;
}

/** The Redact active's cooldown: REDACT_COOLDOWN_SEC from each trigger, burning even when nothing was in range. */
export class RedactClock {
  private cd = 0;

  get ready(): boolean {
    return this.cd <= 0;
  }

  get cdLeft(): number {
    return this.cd;
  }

  /** Arms the cooldown. Returns false and stays untouched while it is still running. */
  trigger(): boolean {
    if (this.cd > 0) return false;
    this.cd = REDACT_COOLDOWN_SEC;
    return true;
  }

  /** Ticks the cooldown down; true on the frame it completes (and while idle). */
  update(dtSec: number): boolean {
    if (this.cd <= 0) return true;
    const left = this.cd - dtSec;
    // The 1e-9 snap matters for float edges (same idiom as RunState.addInkwell).
    this.cd = left < 1e-9 ? 0 : left;
    return this.cd <= 0;
  }
}

/** Storage flags, warmStart.ts pattern: '1'/'0' in localStorage, false when absent or storage is blocked. */
export const REDACTOR_UNLOCKED_KEY = 'scope-creep.redactor-unlocked';
export const REDACTOR_PICK_KEY = 'scope-creep.redactor-pick';
export const REDACTOR_NOTE_KEY = 'scope-creep.redactor-note';

/** True once the first run has ended: the menu offers the Redactor from then on. */
export function loadRedactorUnlocked(): boolean {
  try { return localStorage.getItem(REDACTOR_UNLOCKED_KEY) === '1'; } catch { return false; }
}
export function saveRedactorUnlocked(): void {
  try { localStorage.setItem(REDACTOR_UNLOCKED_KEY, '1'); } catch { /* storage blocked */ }
}

/** The loadout pick for the next run. */
export function loadRedactorPick(): boolean {
  try { return localStorage.getItem(REDACTOR_PICK_KEY) === '1'; } catch { return false; }
}
export function saveRedactorPick(picked: boolean): void {
  try { localStorage.setItem(REDACTOR_PICK_KEY, picked ? '1' : '0'); } catch { /* storage blocked */ }
}

/** The one-time "NEW IN THE STUDIO" marginalia has already played. */
export function loadRedactorNoteSeen(): boolean {
  try { return localStorage.getItem(REDACTOR_NOTE_KEY) === '1'; } catch { return false; }
}
export function saveRedactorNoteSeen(): void {
  try { localStorage.setItem(REDACTOR_NOTE_KEY, '1'); } catch { /* storage blocked */ }
}

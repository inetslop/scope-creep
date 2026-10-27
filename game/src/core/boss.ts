import { FRAME } from '../content/bosses/frame';
import { GRID } from '../content/bosses/grid';
import type { FrameBossDef, GridBossDef } from '../content/bosses/types';

/**
 * Boss scheduling (pure logic). The first boss appears at `firstAtSec`, and
 * after each kill the next one is due `intervalSec` later. Boss HP scales by
 * 1.5x per kill. See src/systems/BossSystem.ts for the engine-side encounter.
 */
export interface BossSchedule {
  /** Seconds into the run when the first boss appears. */
  firstAtSec: number;
  /** Seconds between one boss's death and the next boss appearing. */
  intervalSec: number;
}

export const BOSS_SCHEDULE: BossSchedule = { firstAtSec: 300, intervalSec: 300 };

/** HP multiplier for the boss that appears after `kills` bosses have died this run. */
export function bossHpMultiplier(kills: number): number {
  return Math.pow(1.5, kills);
}

/** Seconds before a boss spawn when the page warns that something heavy is coming. */
export const BOSS_WARNING_SEC = 5;

/** The boss that appears after `kills` bosses have died: Frame and Grid alternate. */
export function bossForKill(kills: number): FrameBossDef | GridBossDef {
  return kills % 2 === 0 ? FRAME : GRID;
}

/** Tracks when the next boss should appear and when its 5 s approach warning window opens. BossSystem owns the writes. */
export class BossTimer {
  private readonly schedule: BossSchedule;
  private nextAt: number;

  constructor(schedule: BossSchedule = BOSS_SCHEDULE) {
    this.schedule = schedule;
    this.nextAt = schedule.firstAtSec;
  }

  /** True when no boss is alive and the run time has reached the scheduled time. */
  due(timeSec: number, bossAlive: boolean): boolean {
    return !bossAlive && timeSec >= this.nextAt;
  }

  /** True only in the `BOSS_WARNING_SEC` seconds before the next scheduled spawn, and only when no boss is alive. */
  inWarningWindow(timeSec: number, bossAlive: boolean): boolean {
    return !bossAlive && timeSec >= this.nextAt - BOSS_WARNING_SEC && timeSec < this.nextAt;
  }

  /** Schedules the next boss `intervalSec` after this kill. */
  onBossKilled(timeSec: number): void {
    this.nextAt = timeSec + this.schedule.intervalSec;
  }
}

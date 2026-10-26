/** XP needed to go from `level` to `level + 1`. Level starts at 1. */
export function xpToNextLevel(level: number): number {
  return Math.round(5 + 4 * Math.pow(level, 1.45));
}

/**
 * Enemy health multiplier for a given run time. Enemies get tougher over time so the
 * player has to keep upgrading. Kept here (pure) so balance changes are unit-testable.
 */
export function enemyHpScale(timeSec: number): number {
  return 1 + timeSec / 90 + Math.pow(timeSec / 300, 2);
}

/** Formats seconds as m:ss. */
export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

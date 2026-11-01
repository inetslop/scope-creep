import type { EnemyDef } from '../content/types';

/** The rule a def carries for its periodic pop (the Hive's `pops`). */
type PopsRule = NonNullable<EnemyDef['pops']>;

/**
 * The pop schedule of a periodic popper (the Hive), pure over its own clock: the first pop is
 * `everySec` after its own spawn, then one every `everySec`, capped at `max`. The hook
 * (systems/enemyHooks/hivePops.ts) keeps the clock and spawns the children from these.
 */

/** How many of the rule's pops have landed by `clockSec` since the popper's own spawn (capped at `max`, never below 0). */
export function popsDue(clockSec: number, rule: PopsRule): number {
  if (clockSec <= 0) return 0;
  return Math.min(rule.max, Math.floor(clockSec / rule.everySec));
}

/** The popper-clock time of its next pop at `clockSec`; -1 once all `max` have landed. */
export function nextPopAt(clockSec: number, rule: PopsRule): number {
  if (popsDue(clockSec, rule) >= rule.max) return -1;
  return (popsDue(clockSec, rule) + 1) * rule.everySec;
}

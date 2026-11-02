import type { EnemyDef } from '../content/types';

/** The rule a def carries for its mend clock (the Mender's `mends`). */
type MendsRule = NonNullable<EnemyDef['mends']>;

/**
 * The mend schedule of the Mender, pure over its own clock: the first mend lands `everySec` after
 * its own spawn, then one every `everySec`, capped at `count`. The hook
 * (systems/enemyHooks/mendPack.ts) keeps the clock and mends from these.
 */

/** How many of the rule's mends have landed by `clockSec` since the Mender's own spawn (capped at `count`, never below 0). */
export function mendsDue(clockSec: number, rule: MendsRule): number {
  if (clockSec <= 0) return 0;
  return Math.min(rule.count, Math.floor(clockSec / rule.everySec));
}

/** The Mender-clock time of its next mend at `clockSec`; -1 once all `count` have landed. */
export function nextMendAt(clockSec: number, rule: MendsRule): number {
  if (mendsDue(clockSec, rule) >= rule.count) return -1;
  return (mendsDue(clockSec, rule) + 1) * rule.everySec;
}

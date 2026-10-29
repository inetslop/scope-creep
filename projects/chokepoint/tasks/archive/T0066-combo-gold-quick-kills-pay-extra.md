---
id: T0066
title: "Combo gold: quick kills pay extra"
assignee: narcissus
size: S
priority: 3
status: done
depends_on: [T0039]
attempts: 1
created: 2026-10-28T13:54:28Z
claimed_at: 2026-10-28T21:51:46Z
finished_at: 2026-10-29T00:07:48Z
epic: E1
---

## Goal
The kill-combo milestone (T0034) pays back in gold: a chain that reaches ×5 pays +2 gold and a chain that reaches ×10 pays +4 — quick kills are worth more than slow ones.

## Details
- **The rule:** when the kill-combo chain (T0031) reaches exactly ×5, that fifth kill pays 2 extra gold; when it reaches exactly ×10, that tenth kill pays 4 extra gold. The extra is normal run gold — it buys slots like any gold — and it lands at the moment of the kill.
- **The look:** the extra shows as its own small gold pop at the kill spot (the same small pop as Mint's "+1", T0039) about 100 ms after the normal kill-gold pop; the normal pop and its number are unchanged.
- **Once per chain per milestone:** a chain that passes ×10 keeps the yellow chain color (T0034) but pays no more combo gold — only the fifth and the tenth kill of a chain pay. A broken chain (T0031's 1.5 s rule) that rebuilds pays again on the new chain's fifth kill.
- **Last stand interaction:** while last stand (T0054) is on, combo gold is not doubled — it pays on top of the doubled kill gold, exactly like Mint's +1.
- **No coin:** the kill-gold trail (T0061) covers normal kill gold only; combo gold gets its pop, not a coin.

## Acceptance criteria
- [ ] The fifth kill of a chain pops a small "+2" gold at the kill spot ~100 ms after the normal kill-gold pop, and the tenth pops "+4"; kills 1–4, 6–9 and 11+ pop nothing extra.
- [ ] The extra gold lands in the HUD's gold tally (+2 / +4) and can buy slots like any gold.
- [ ] With last stand on, a ×5 kill shows the doubled kill-gold pop and the separate "+2" pop, and the tally gains both.
- [ ] A chain that breaks and rebuilds pays ×5 gold again on the new chain's fifth kill.
- [ ] The coin formula (T0001), the score, "stopped" and the rewards card are unchanged; works at 412x915 and 1280x720.

## Note (by hand, 2026-10-28)

No longer waits on T0054: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design edited shared hub files that the game now has extension points for (CLAUDE.md recipes: enemy hooks in `systems/enemyHooks/`, effects in `systems/fx/`). Design it so it edits as few shared files as possible: a task that only adds its own files and registry lines can be built while other tasks run; one that edits a shared file waits until nobody else is editing it. Use an enemy hook (`onKill`): read the kill chain from `FxSystem.chain` (public) after the kill and pay the milestone gold on top; the small gold pop is an effect file in `systems/fx/`. No change to `FxSystem.killCount()` or `EnemySystem`.

## Design (architect, desktop)

### Files
- create `src/core/comboGold.ts` - pure rule: what a chain milestone pays
- create `src/systems/fx/comboGold.ts` - the small "+2"/"+4" gold pop (first file in new folder `src/systems/fx/`)
- create `src/systems/enemyHooks/comboGold.ts` - the kill hook that pays the milestone gold
- edit `src/systems/enemyHooks/index.ts` - one import line + one line in `ENEMY_HOOKS`, next to `split`
- create `tests/core/comboGold.test.ts` - unit test for the milestone rule

### Interfaces
```ts
// src/core/comboGold.ts (no imports)
/** What a kill-chain milestone pays: the fifth kill of a chain +2, the tenth +4; every other kill 0. */
export function comboGoldBonus(chain: number): number {
  if (chain === 5) return 2;
  if (chain === 10) return 4;
  return 0;
}

// src/systems/fx/comboGold.ts
import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import { textStyle } from '../../ui/text';
import type { FxSystem } from '../FxSystem';

/** The chain milestone's gold: one small pop at the kill spot, 100 ms after the kill gold (like Mint's "+1"). */
export function comboGoldPop(fx: FxSystem, x: number, y: number, amount: number): void {
  if (fx.full) return;
  fx.scene.time.delayedCall(100, () => {
    if (fx.full) return;
    const t = fx.scene.add
      .text(x, y, `+${amount}`, textStyle(14, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
      .setOrigin(0.5)
      .setDepth(DEPTH.fx);
    fx.track(t, 750, { y: y - 34, alpha: 0, ease: 'Quad.easeOut' });
  });
}

// src/systems/enemyHooks/comboGold.ts
import { comboGoldBonus } from '../../core/comboGold';
import type { MakeEnemyHook } from './hook';
import { comboGoldPop } from '../fx/comboGold';

/** The chain's milestones pay extra gold: the fifth kill +2, the tenth +4 (core/comboGold.ts). */
export const comboGold: MakeEnemyHook = ({ run, fx }) => ({
  onKill({ enemy }) {
    const bonus = comboGoldBonus(fx.chain);
    if (bonus <= 0) return;
    run.gold += bonus;
    run.goldEarned += bonus;
    comboGoldPop(fx, enemy.x, enemy.y - 20, bonus);
  },
});
```
Edit `src/systems/enemyHooks/index.ts`: add `import { comboGold } from './comboGold';` above the `split` import, and the line `comboGold,` above `split,` in `ENEMY_HOOKS`.

### Steps
1. Create `src/core/comboGold.ts` exactly as above.
2. Create `src/systems/fx/comboGold.ts` exactly as above (model: `mintPop()` in `src/systems/FxSystem.ts:195`).
3. Create `src/systems/enemyHooks/comboGold.ts` exactly as above (model: `src/systems/enemyHooks/split.ts`).
4. Add the two lines to `src/systems/enemyHooks/index.ts`.
5. Create `tests/core/comboGold.test.ts` (model `tests/core/split.test.ts`): `expect(comboGoldBonus(5)).toBe(2)`, `expect(comboGoldBonus(10)).toBe(4)`, and 0 for each of `0,1,2,3,4,6,7,8,9,11,12,20`.
6. Run `npm run check` — must pass.

### Pitfalls
- **Never use `run.addKill(bonus)`** for the combo gold: it also increments `run.kills`, which would change the score and the run stats (acceptance says unchanged). Add to the public fields `run.gold` and `run.goldEarned` directly.
- Read `fx.chain` in `onKill` — `EnemySystem.kill()` calls `fx.killCount()` *before* running the hooks, so `fx.chain` is the count including the kill just made; chain 5 and 10 each occur exactly once per chain, which is the "once per chain per milestone" rule. Chains past ×10 (11, 12, …) pay nothing; a rebuilt chain starts at 1 and pays on its own fifth kill. No per-run state needed in the hook.
- Keep the combo gold out of `KillEvent.paid` (it is already computed before hooks run; T0061's coin trail reads `paid`, and combo gold must not get a coin).
- Last stand (T0054, not built yet) doubles kill gold wherever it lands; adding straight to `run.gold` means the +2/+4 is paid on top, never doubled, as required.
- The 100 ms `delayedCall` needs no manual cleanup: Phaser clears scene timer events on shutdown (same as `mintPop`), and `fx.track` destroys the text at the end.
- No new invariant: `run.gold` and `run.ledger` in `debug/runChecks.ts` already cover gold staying an integer ≥ 0; this is a hook + effect, not a system.

### Tests
- `tests/core/comboGold.test.ts`: chain 5 → 2, chain 10 → 4, all other chains (0–4, 6–9, 11+) → 0.

## Result (attempt 1, narcissus)

T0066 combo gold is done and verified — the fifth kill of a chain pays +2 and the tenth +4, shown as a small gold pop at the kill spot ~100 ms after the normal kill gold, paid straight into the run's gold so it can buy slots (new files `core/comboGold.ts`, `systems/enemyHooks/comboGold.ts` hook, `systems/fx/comboGold.ts` effect, `tests/core/comboGold.test.ts`, plus one import line and one registry line in `enemyHooks/index.ts`; nothing else changed). The fix round resolved the failing `npm run check`: my fx file had imported `textStyle` from `ui/text`, which transitively imports `debug/flags`, which reads `window` at module load and crashes vitest's Node environment — so the small pop now inlines the identical style (same font, size 14, bold, gold with card stroke, 4 px stroke, and `resolution: 1 / fx.scene.scale.zoom` = `display.ratio` to keep it crisp) instead of importing it. `npm run check` (typecheck + lint + 21 test files, 151 tests) and `npm run smoke` (desktop and phone, real browser) both pass.

- Self-review: NO VERDICT
- Time: 136.0 min
- Gate failed at "check"; fix round 1.

```
projects/chokepoint/game/src/core/comboGold.ts     |  6 +++++
 .../game/src/systems/enemyHooks/comboGold.ts       | 14 +++++++++++
 .../game/src/systems/enemyHooks/index.ts           |  2 ++
 .../chokepoint/game/src/systems/fx/comboGold.ts    | 29 ++++++++++++++++++++++
 .../chokepoint/game/tests/core/comboGold.test.ts   | 13 ++++++++++
 5 files changed, 64 insertions(+)
```

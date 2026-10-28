---
id: T0066
title: "Combo gold: quick kills pay extra"
size: S
priority: 3
status: todo
depends_on: [T0039]
attempts: 0
created: 2026-10-28T13:54:28Z
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

## Design (architect, desktop)

### Files
- create `src/core/comboGold.ts` - the pure rule: chain milestone gold (5th kill of a chain pays 2, 10th pays 4, all others 0)
- create `tests/core/comboGold.test.ts` - unit test for that rule
- edit `src/core/run.ts` - new `addGold()` method next to `addKill()`; one-word comment fix on `goldEarned`
- edit `src/systems/FxSystem.ts` - `killCount()` returns the milestone gold (was `boolean`); new `smallGoldPop()` after `popText()`
- edit `src/systems/EnemySystem.ts` - `strike()` pays the milestone gold and pops it
- GameScene, HudScene, runChecks.ts, palette, HUD: unchanged. No new invariant (the existing `run.gold` and `run.ledger` checks already cover it).

### Interfaces
```ts
// src/core/comboGold.ts (new file)
export const COMBO_GOLD = { at5: 2, at10: 4 } as const;
export function comboMilestoneGold(n: number): number; // 2 if n===5, 4 if n===10, 0 otherwise
// src/core/run.ts (new method, after addKill)
addGold(gold: number): number; // adds Math.max(0, gold) to gold and goldEarned; NOT to kills
// src/systems/FxSystem.ts (changed + new)
killCount(x: number, y: number): number;  // was boolean: returns comboMilestoneGold(this.comboN), 0 when comboN < 2
smallGoldPop(x: number, y: number, amount: number, delayMs: number): void;
```

### Steps
1. Create `src/core/comboGold.ts`:
```ts
/** Milestone gold of the kill chain (systems/FxSystem.ts's ×N counter): the chain's 5th kill pays
 * at5 extra, its 10th pays at10, every other kill 0. A broken chain starts at 1 again, so its 5th pays again. */
export const COMBO_GOLD = { at5: 2, at10: 4 } as const;

/** The extra gold the n-th kill of a chain pays (n = chain length after this kill). */
export function comboMilestoneGold(n: number): number {
  if (n === 5) return COMBO_GOLD.at5;
  if (n === 10) return COMBO_GOLD.at10;
  return 0;
}
```
2. Create `tests/core/comboGold.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { COMBO_GOLD, comboMilestoneGold } from '../../src/core/comboGold';

describe('comboMilestoneGold', () => {
  it('pays 2 on the chain's 5th kill, 4 on its 10th, nothing else', () => {
    expect(COMBO_GOLD).toEqual({ at5: 2, at10: 4 });
    expect(comboMilestoneGold(5)).toBe(2);
    expect(comboMilestoneGold(10)).toBe(4);
    for (const n of [0, 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 25]) expect(comboMilestoneGold(n)).toBe(0);
  });
});
```
3. Edit `src/core/run.ts`: change the `goldEarned` comment (line 28) to `// gold earned this run: kill gold, the chain's milestone gold, wave bonuses`, and add after the `addKill()` method:
```ts
  /** Gold earned that isn't a kill (the chain's milestone gold, core/comboGold.ts): into the tally
   * and goldEarned, but not into kills. Returns the gold added. */
  addGold(gold: number): number {
    const paid = Math.max(0, gold);
    this.gold += paid;
    this.goldEarned += paid;
    return paid;
  }
```
4. Edit `src/systems/FxSystem.ts`: add `import { comboMilestoneGold } from '../core/comboGold';` after the palette import; in `killCount()` change the return type to `number`, change `return false;` to `return 0;` and the final `return this.comboN === 10;` to `return comboMilestoneGold(this.comboN);` (append to its doc comment: "Returns the chain's milestone gold this kill pays: 2 on its 5th, 4 on its 10th, 0 otherwise"); add this method after `popText()`:
```ts
  /** A small gold pop: "+N" at 16 px (the kill's own pop is 22 px), rising and fading at (x, y)
   * `delayMs` later; the chain's milestone gold pops 100 ms after the kill's pop (T0066). */
  smallGoldPop(x: number, y: number, amount: number, delayMs: number): void {
    const pop = (): void => {
      if (this.live >= FxSystem.MAX) return;
      const t = this.scene.add
        .text(x, y, `+${amount}`, textStyle(16, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
        .setOrigin(0.5)
        .setDepth(DEPTH.fx);
      this.track(t, 700, { y: y - 28, alpha: 0, ease: 'Quad.easeOut' });
    };
    if (delayMs > 0) this.scene.time.delayedCall(delayMs, pop);
    else pop();
  }
```
5. Edit `src/systems/EnemySystem.ts`: add `import { COMBO_GOLD } from '../core/comboGold';` before the `mintGoldBonus` import; in `strike()` find the 3-line block starting `const milestone = this.fx.killCount(e.x, e.y);` through the `this.fx.popText(e.x, e.y - 20, ...)` line (anchor by content, not line number — T0039/T0054 may have added lines nearby) and replace it with:
```ts
    // The kill chain pays milestone gold on its 5th and 10th kills (core/comboGold.ts).
    const comboPay = this.fx.killCount(e.x, e.y);
    this.fx.burst(e.x, e.y, PALETTE[e.def.look.color], comboPay === COMBO_GOLD.at10);
    this.fx.popText(e.x, e.y - 20, `+${paid}`);
    if (comboPay > 0) {
      this.run.addGold(comboPay);
      this.fx.smallGoldPop(e.x, e.y - 20, comboPay, 100);
    }
```
6. Run `npm run check`.

### Pitfalls
- Never route the combo gold through `addKill`: it would bump `kills` (the rewards card's "Stopped") and give the T0061 coin trail a coin. `addGold` keeps kills, score, coins and the trail intact.
- Never fold the combo gold into the `addKill` amount: T0054's last stand doubles kill gold through `paid`; the separate `addGold` after it is exactly "on top of the doubled gold, not doubled itself". Keep the `+${paid}` popText call byte-identical.
- `comboPay === COMBO_GOLD.at10` must keep feeding `burst` — that is the existing ×10 double-chip milestone; don't drop the argument. Don't touch `killCount`'s 1.5 s chain timing, only its return.
- The 100 ms is a scene timer; Phaser clears scene timers on shutdown (same as the existing `comboTimer`), so don't store the TimerEvent. The MAX cap is checked when the pop actually spawns (inside the callback), so a delayed pop can't overflow `fx.count`.
- If FxSystem already has a near-identical small gold pop method from T0039 (Mint's +1), reuse it instead of adding step 4's method: pass `comboPay` and a 100 ms delay (add a `delayMs` parameter to it if it lacks one).

### Tests
- `tests/core/comboGold.test.ts` (step 2) — new rule in src/core that a later change could silently break.

## Note (by hand, 2026-10-28)

No longer waits on T0054: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

---
id: T0363
title: "The bank pays: 5% of the gold at every wave start, capped at +10"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T15:28:41Z
claimed_at: 2026-11-01T16:21:42Z
---

## Goal
The build phase gains a small spend-now-vs-bank decision: at the start of every wave the run's gold bank pays 5% interest, capped at +10 per build phase.

## Details
- **When:** the moment the build phase ends and the wave starts — both ways in: the countdown reaching zero, and the early send through the big round button (T0223). Exactly once per wave, on whichever path starts it. On an early send, the button's banked seconds-gold (2 per whole second) is added first; the interest is computed on the bank as a result.
- **How much:** floor(gold × 0.05), paid only when it is at least 1, capped at +10 per build phase. The run's first build phase pays it too (the starting gold), and so does every later one; a bank under 20 gold pays nothing.
- **Look and sound:** a small gold "+N" pop at the stats card's gold number (the T0017 pop with the T0039 pop's look), a coin trail to the tally (T0061's pattern) and the quiet coin blip (`Sfx.coinBlip`, T0255) — the same trio the kill gold already wears.
- **Teach:** a one-time muted line under the wave preview in the first build phase (the T0272 pattern, shown while no wave is cleared yet): "bank pays 5% at wave start · up to +10". Never shown again.
- **Gold, never coins:** the interest is run gold. It never enters the run's coin formula, the score, the claim card, the coins reference (T0329) or the profile.
- **Modes and levels:** no special cases — Iron doubles coins, not gold; Lean's thinner bounties simply bank less; the level multiplier is untouched.
- **Code shape:** the math is one small new pure module (the core/lastStand.ts pattern) with unit tests; the hook is the single wave-start transition — the one place the countdown and the early send both pass.

## Acceptance criteria
- [ ] A bank of 100 gold at a wave start earns +5 gold (a small gold "+5" pop at the gold number, a coin trail, the coin blip); 19 gold earns nothing; 500 gold earns +10 (the cap, not +25).
- [ ] The countdown and the big button's early send each pay the interest exactly once at the wave start; on an early send the banked seconds-gold is added before the interest is computed.
- [ ] The first build phase shows the one-time muted line under the wave preview; no later build phase does.
- [ ] The claim card's coin lines, the score, the coins reference and the profile are unchanged by the interest.
- [ ] The new pure module's unit tests pin the floor (paid only when the result is ≥ 1), the 5% rate and the +10 cap; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.

## Design (architect, desktop)

### Files
- create `src/core/bankInterest.ts` — the pure interest math (the `core/lastStand.ts` pattern: no Phaser, no imports).
- create `tests/core/bankInterest.test.ts` — unit tests pinning floor, rate, cap.
- edit `src/systems/RunFlow.ts` — the wave-start hook: new private `bankPay()` called from the two wave-start paths.
- edit `src/ui/hud/StatsCard.ts` — consume the `bankPay` registry flag and pop the gold number.
- edit `src/ui/hud/NextWavePreview.ts` — the one-time teach line, and a 2-line→N-line card layout.

### Interfaces
```ts
// src/core/bankInterest.ts — the whole file:
/** Bank interest: 5% of the run's gold at every wave start, floored, paid only from 1 up, capped at +10. Run gold, never coins. */
export function bankInterest(gold: number): number {
  const pay = Math.floor(gold * 0.05);
  return pay >= 1 ? Math.min(pay, 10) : 0;
}
```
No other signatures change. `Sfx.coinBlip()` already exists (src/audio/Sfx.ts:99). The cross-scene signal is the global registry key `'bankPay': number` (same channel as `'statsGold'` and `'bossDeathName'`; the Phaser registry is game-wide, and the HUD scene updates after the game scene, so the flag set in a frame is consumed in that frame).

### Steps
1. Create the two files in Interfaces above.
2. `RunFlow.ts` — add imports, one each, next to their kin: `import { bankInterest } from '../core/bankInterest';` and `import type { Point } from '../core/path';` with the other `../core/` imports, and `import { goldCoin } from './fx/goldCoin';` next to `import { farGateSend } from './fx/farGateSend';`.
3. `RunFlow.ts` — call it from both wave-start paths, the single transition they share (`waves.start()`): in `update()`'s `if (run.buildLeftSec <= 0)` block add `this.bankPay();` after `this.s.building.cancelPending();`; in `startWaveNow()` add `this.bankPay();` after `const banked = this.run.bankSend();` (bankSend already put the seconds-gold into `run.gold`, so the interest is computed on the bank as a result).
4. `RunFlow.ts` — new private method after `startWaveNow()`:
```ts
  /** The bank's pay at the wave start (core/bankInterest): 5% of the run's gold, at most +10, exactly once
   *  per wave — both starts pass it here. Run gold, never coins: the tally and the claim recipe never see it. */
  private bankPay(): void {
    const pay = bankInterest(this.run.gold);
    if (pay <= 0) return;
    this.run.gold += pay; // like tollLeak: run gold only, goldEarned stays "kill gold + wave bonuses"
    this.scene.registry.set('bankPay', pay); // the "+N" pop at the stats card's gold number (ui/hud/StatsCard.ts)
    const spot = this.scene.registry.get('statsGold') as Point | undefined;
    if (spot) {
      // One coin from the board's centre to the gold number, the kill coin's size and arc at the current zoom.
      const px = this.s.board.toScreen({ x: 1, y: 0 }).x - this.s.board.toScreen({ x: 0, y: 0 }).x;
      goldCoin(this.s.fx, { x: this.s.board.width / 2, y: this.s.board.height / 2 }, this.s.board.toBoard(spot), 10 / px, 24 / px);
    }
    this.s.sfx?.coinBlip();
  }
```
5. `StatsCard.ts` — add field `private goldPulsing = false;` after `private livesPulsing = false;`. In `update()`, right after `this.gold.setText(String(game.run.gold));`, add:
```ts
    const pay = this.scene.registry.pop('bankPay') as number | undefined; // the bank's pay, from RunFlow this frame
    if (pay !== undefined && pay > 0) this.popGold(pay);
```
   and a method after `pop()`:
```ts
  /** The bank's pay at the wave start: a small gold "+N" rises off the gold number (the gold pop's look)
   *  while the number scales 1.15 and back over ~150 ms (the coin pop's timing). */
  private popGold(n: number): void {
    const x = this.box.x + this.gold.x;
    const y = this.box.y + this.gold.y;
    const t = this.scene.add.text(x, y - 16, `+${n}`, textStyle(14, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
    if (this.goldPulsing) return;
    this.goldPulsing = true;
    this.scene.tweens.add({ targets: this.gold, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.goldPulsing = false; this.gold.setScale(1); } });
  }
```
   No new imports needed.
6. `NextWavePreview.ts` — after the `EARLY_SEND` constant add: `/** The one-time teach for the run's first build phase: the bank pays 5% of the gold at the wave start, capped. Shown while `wavesCleared` is 0, re-derived from the run, never stored. */` / `const BANK_PAY = 'bank pays 5% at wave start · up to +10';`. Replace `teachLine(plan, run): string | undefined` (lines 104–110) with:
```ts
  /** The one-time lines under the counts: the first build phase (no wave cleared yet) teaches the early send
   *  and the bank's pay; after that, this wave's tag on first preview. Re-derived from the run, never stored. */
  private teachLines(plan: WavePlan, run: RunState): string[] {
    if (run.wavesCleared === 0) return [EARLY_SEND, BANK_PAY];
    for (const t of TEACH) {
      if (plan.tags.includes(t.tag) && run.wavesCleared < t.first) return [t.text];
    }
    return [];
  }
```
   Update the call in `update()`: `this.build(plan, this.teachLines(plan, game.run), farCount > 0 ? ...)`. In `build()` change the signature to `teach: string[]` and replace everything from `const countsW = Math.ceil(cursor);` to `return scene.add.container(0, 0, pieces);` with:
```ts
    const countsW = Math.ceil(cursor);
    const lines: Phaser.GameObjects.Text[] = [];
    if (farLine) lines.push(scene.add.text(0, 0, farLine, textStyle(14, PALETTE.muted)).setOrigin(0.5));
    for (const line of teach) lines.push(scene.add.text(0, 0, line, textStyle(14, PALETTE.muted)).setOrigin(0.5));
    this.cardW = Math.max(countsW, ...lines.map((t) => Math.ceil(t.width))) + PAD * 2;
    this.cardH = LINE_H + lines.length * (ROW_GAP + TEACH_H) + PAD * 2;
    const contentH = this.cardH - PAD * 2;
    const left = -this.cardW / 2 + PAD;
    for (const p of countsPieces) { p.x += left; p.y += -contentH / 2 + LINE_H / 2; }
    let ly = -contentH / 2 + LINE_H + ROW_GAP + TEACH_H / 2;
    for (const t of lines) { t.setPosition(0, ly); ly += ROW_GAP + TEACH_H; }
    const pieces: Phaser.GameObjects.GameObject[] = [...countsPieces, ...lines];
    pieces.unshift(makeCard(scene, 0, 0, this.cardW, this.cardH, this.cardH / 2)); // pill, like before
    return scene.add.container(0, 0, pieces);
```
   Fullest state: first build phase on a board with a far gate = counts row + "far gate ×N" + both teach lines = 4 rows, cardH 144, cardW ≈ 382 (the early-send line is widest). At 412×915 the card spans ≈ y 625..767 (above the big button's title at 781+); at 1280×720 ≈ y 463..607. Both clear.
7. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Exactly-once: both starts funnel through `waves.start()`, and the `phase !== 'build'` guards plus `waves.start()` flipping the phase make a second pay impossible; do not also pay in `clearWave()` or `finishDraft()`.
- Never add the interest to `run.goldEarned` (its doc and the `run.ledger` invariant define it as kill gold + wave bonuses) — `run.gold += pay` only, like `tollLeak`. That keeps coins, score, claim and profile untouched for free.
- The pop must be drawn in the HUD scene (screen space): a board-space `fx.popText` at the gold number would be hidden behind the white card. Consume the flag with `registry.pop`, not `get`, or the pop plays twice.
- `goldCoin` needs the CSS-px `statsGold` registry value converted with `board.toBoard` and the 10/24 px sizes divided by the screen-px-per-board-unit `px` — copy killCoin's math, don't guess units.
- Keep the `Math.max(countsW, ...)` spread safe for an empty `lines` (it is: `Math.max(n)` is `n`).

### Tests
- `tests/core/bankInterest.test.ts` (vitest, model `tests/core/lastStand.test.ts`): `bankInterest(100) === 5` and `bankInterest(120) === 6` (5% rate), `bankInterest(20) === 1`, `bankInterest(19) === 0`, `bankInterest(0) === 0` (floor, paid only ≥ 1), `bankInterest(101) === 5` (floor not round), `bankInterest(200) === 10`, `bankInterest(500) === 10`, `bankInterest(10000) === 10` (the +10 cap).

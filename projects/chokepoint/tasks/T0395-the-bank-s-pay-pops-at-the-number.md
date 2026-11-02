---
id: T0395
title: "The bank's pay pops at the number"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T01:03:06Z
---

## Goal
The bank's pay (T0363) already wears its quiet "bank +N" line in the build and its coin blip at the pay — the pay itself gets the gold's own moment at the stats card's number (the T0385 re-file).

## Details
- The moment the bank pays at a wave's start (the countdown's end or the big button's early send — the existing pay, once per start), the stats card's gold number pops, scale 1.15 and back over ~150 ms, and its coin icon flashes white while scaling — the coin tally's own pop (T0017), wearing the gold line.
- The pop plays only for the bank's pay: never for kill gold, Mint gold, the wave bonus or the early-send's seconds-gold (those keep their own feedback).
- No new sound (the pay's blip already plays — the T0381 lesson), no new line, no layout change: the "bank +N" line already taught the rule in the build, and the number itself carries the amount.

## Acceptance criteria
- [ ] At a wave's start whose bank pay is greater than 0, the gold number pops 1.15× over ~150 ms and its coin icon flashes white, once per start
- [ ] A pay of 0 plays nothing; kill gold, Mint gold, the wave bonus and the early-send's seconds-gold never trigger the pop
- [ ] The coin tally's own pop and the "bank +N" line are untouched; the stats card's layout is unchanged at 412x915 and 1280x720
- [ ] `npm run check` and the desktop + mobile smoke pass

## Design (architect, yoga)

### Files
- edit `src/ui/hud/StatsCard.ts` — in `popGold()`, add the gold row's coin icon white-flash + scale, so the bank-pay pop wears the coin like the coin tally's own pop (`pop()`) does. Nothing else changes.

### Interfaces
None. `popGold(n: number): void` keeps its signature; its body gains the icon flash after the existing guard.

### Steps
1. Open `src/ui/hud/StatsCard.ts`, find `private popGold(n: number): void` (lines 139-147).
2. Inside `popGold`, after the gold number's scale tween (the `this.scene.tweens.add({ targets: this.gold, ... })` line, currently line 146) — i.e. still inside the `if (this.goldPulsing) return;` guard, after `this.goldPulsing = true;` — add exactly this, mirroring `pop()`'s handling of `this.coinTallyIcon` but on `this.coinIcon` (the gold row's coin, field declared at line 27):
   ```ts
   this.coinIcon.setTintFill(0xffffff);
   const base = this.coinIcon.scale;
   this.scene.tweens.add({ targets: this.coinIcon, scale: base * 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.coinIcon.setScale(base); this.coinIcon.clearTint(); } });
   ```
3. Touch nothing else: the "+N" rising text, the gold number scale tween and `goldPulsing` guard, `pop()`, `bankRow()`, `pulseLives()`, `popLives()`, and `RunFlow.bankPay()` (the registry + blip + coin arc are already wired).

### Pitfalls
- The icon code MUST sit after `this.goldPulsing = true;` so the "once per start" guard covers number and icon together; before the guard it would double-play.
- Base the scale on `this.coinIcon.scale` (set by `artScale(..., 1.25)` = `1/3 * 1.25`, never hardcode `1.25` — that would leave the icon 3× the right size).
- `onComplete` must `clearTint()` or the coin stays white for the rest of the run; it must NOT reset `goldPulsing` (the gold tween's `onComplete` already does).
- Do not touch `this.coinTallyIcon` or `pop()` — the coin tally's own pop must keep playing for coin gains; the two pops coexist by design.
- `bankRow`/`goldTagRow` move `this.coinIcon.x` (the ×4 rich-wave shift); scaling is origin-centered so those shifts stay valid, and no layout or size changes (412x915 and 1280x720 unchanged).
- The registry key `bankPay` is set only by `RunFlow.bankPay()` when `pay > 0` (core/bankInterest, 5% floored, capped +10), so kill gold, Mint gold, the wave bonus and the early-send's seconds-gold never reach `popGold` — verify before touching RunFlow that no other `registry.set('bankPay')` exists (Grep: there is exactly one).

### Tests
none

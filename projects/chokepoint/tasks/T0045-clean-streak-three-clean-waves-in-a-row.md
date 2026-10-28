---
id: T0045
title: "Clean streak: three clean waves in a row give the run +1 life"
size: M
priority: 2
status: todo
depends_on: [T0030]
attempts: 0
created: 2026-10-28T11:47:03Z
epic: E1
---

## Goal
A perfect stretch pays back in survival: three clean waves in a row give the run +1 life (once per run), on top of the clean-wave coins, so a flawless start buys a cushion against a later leak.

## Details
- The run tracks a clean streak: each clean wave (zero leaks — the green "Clean" chip moment from T0005) raises it by 1; any leak in a wave resets it to 0 at once.
- The moment the streak reaches 3, and only once per run, the run gains +1 life: the lives number in the stats card rises by 1. The starting lives count is unchanged; the payback may put lives one above it — the streak pays at most once, so never more.
- The streak is taught by the chip itself. Below the chip, centered on it, a small 12 px bold tag appears with the chip and fades with it:
  - streak 1: a muted gray "1/3"; streak 2: a muted gray "2/3".
  - streak 3 (the payback): a green "+1" in the same green as the Clean chip's text, and at the same moment the lives number in the stats card turns green and scales from 1.15 back to 1.0 over ~150 ms (the same pop timing as the coin tally's pop, T0017), then returns to its normal color.
  - After the one payback, clean waves show the plain chip with no tag, for the rest of that run.
- No change to clean-wave coins (the run ledger and its formula, T0001), the chip's look, position or timing (including the 1 s beat before the draft), any sound, the pause screen, the rewards card or the profile.

## Acceptance criteria
- [ ] Three clean waves in a row: the first two show the chip with a muted "1/3" and "2/3" below it; the third shows a green "+1" below it, the lives number rises by 1 and pops green (1.15 → 1.0 over ~150 ms).
- [ ] A wave with a leak shows no chip, as today, and resets the streak: the next clean wave tags "1/3".
- [ ] After the one payback, every later clean wave — including a second three-in-a-row — shows the plain chip with no tag and no extra life.
- [ ] Clean-wave coins, the chip's look and timing, the starting lives count, the rewards card, the profile and all sounds are unchanged.
- [ ] Works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` — streak state on `RunState`: two fields, reset in `leak()`, the one-per-run payback in `clearWave()`, and `streakTag()`
- edit `src/systems/RunFlow.ts` — in `clearWave()`: read the tag before `run.clearWave()` and pass it to the chip
- edit `src/systems/FxSystem.ts` — `cleanChip()` takes an optional tag, drawn under the pill inside the same container
- edit `src/ui/hud/StatsCard.ts` — the lives number pops green when it goes up (the one payback)
- edit `src/debug/runChecks.ts` — one invariant line: lives never exceed start + 1
- edit `tests/core/run.test.ts` — streak tests
- No new files.

### Interfaces
```ts
// core/run.ts — on RunState; add `import { PALETTE } from '../content/palette';`
cleanStreak = 0;    // clean waves in a row; a leak resets it to 0
streakPaid = false; // the run's one +1 life for a streak of 3 was paid
// in leak(), after `this.leaksThisWave += 1;`:   this.cleanStreak = 0;
// in clearWave(), replace `if (this.leaksThisWave === 0) this.cleanWaves += 1;` with:
if (this.leaksThisWave === 0) {
  this.cleanWaves += 1;
  this.cleanStreak += 1;
  if (this.cleanStreak === 3 && !this.streakPaid) { this.lives += 1; this.streakPaid = true; }
}
/** Tag under this wave's clean chip: "1/3", "2/3", the one "+1", or none. Call BEFORE clearWave(). */
streakTag(): { text: string; color: number } | undefined {
  if (this.leaksThisWave > 0 || this.streakPaid) return undefined;
  const next = this.cleanStreak + 1;
  return next === 3 ? { text: '+1', color: PALETTE.green } : { text: `${next}/3`, color: PALETTE.muted };
}
// systems/FxSystem.ts — the only signature change besides the new method above:
cleanChip(x: number, y: number, tag: { text: string; color: number } | undefined = undefined): void
```

### Steps
1. `core/run.ts`: the two fields next to `cleanWaves`/`rerollUsed`; the reset line in `leak()`; the payback block in `clearWave()`; `streakTag()` directly under `clearWave()`. `clearWave()` keeps returning the bonus number.
2. `FxSystem.cleanChip()`, inside that method only: after `const label = ...` add
   `const tagText = tag ? this.scene.add.text(0, 28, tag.text, textStyle(12, tag.color, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 })).setOrigin(0.5) : null;`
   and build the container as `this.scene.add.container(x, y, tagText ? [g, label, tagText] : [g, label])`. Leave both existing tweens untouched (the tag fades with the container's alpha tween).
3. `RunFlow.clearWave()`: add `const tag = this.run.streakTag();` on the line before `const bonus = this.run.clearWave();`, and change the call to `this.s.fx.cleanChip(exit.x, exit.y, tag);`. No other RunFlow change.
4. `StatsCard`: fields `private lastLives = 0; private livesPop = false;` (next to `lastN`/`popping`). In `update()`, right after `this.lives.setText(...)`: `if (game.run.lives > this.lastLives) this.popLives();` and `this.lastLives = game.run.lives;`. New method after `pop()`, modeled on it: `if (this.livesPop) return; this.livesPop = true; this.lives.setTintFill(PALETTE.green); this.scene.tweens.add({ targets: this.lives, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.livesPop = false; this.lives.setScale(1); this.lives.clearTint(); } });`
5. `runChecks.ts`: change `import { HUD } from '../config';` to `import { HUD, START } from '../config';` and add, on the line after `['run.lives', ...]`: `['run.streak', (g) => (g.run.lives <= START.lives + 1 ? null : `lives ${g.run.lives} above start plus the streak's one`)],`
6. `tests/core/run.test.ts`: add `import { PALETTE } from '../../src/content/palette';` and three `it`s (style of the file): (a) three consecutive `startWave()/clearWave()` pairs give +1 life exactly on the third and `streakPaid === true`, and a second three-in-a-row changes nothing; (b) a `leak(1)` between two clears resets `cleanStreak` to 0 at once and the next clean wave does not pay; (c) `streakTag()` called before `clearWave()` returns `{ text: '1/3', color: PALETTE.muted }`, then `'2/3'`, then `{ text: '+1', color: PALETTE.green }`, then `undefined`.

### Pitfalls
- `streakTag()` must be read BEFORE `run.clearWave()` — after it, the payback already flipped `streakPaid`/`cleanStreak` and the "+1" would never show.
- The tag must be a child of the chip container: it then pops, fades, zooms and is destroyed with it. A separate fx object would desync and leak (the `MAX` cap only counts the container).
- Reset the lives text's scale AND tint in `onComplete`, or it stays green at 1.15 forever; lives only ever rise once per run, so the `livesPop` guard is just safety.
- Keep edits inside the named functions: T0034/T0039 touch other `FxSystem` methods, T0015 touches other `RunFlow` methods, T0030 touches `StatsCard.update()` (hence the dependency), T0019/T0015/T0042 append other `INVARIANTS` lines. No reformatting.
- Do not touch coins or the ledger (`cleanWaves` still counts every clean wave; the payback adds no gold), no sound, no change to the chip's look, position, the 1 s beat or the draft, rewards card or profile.
- The tag lives in board units inside the chip container and the pop is inside the existing StatsCard — nothing new to lay out at 412x915 or 1280x720.

### Tests
- `tests/core/run.test.ts`: the three `it`s in step 6 — the once-per-run payback and the leak reset are core rules a later change could silently break.

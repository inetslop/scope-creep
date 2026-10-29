---
id: T0205
title: The clean wave says what it means, where the player looks
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T12:25:57Z
---

## Goal
When a wave ends with no leak, a small green "Clean" pill pops next to the exit gate, at the board's edge, with "1/3", "2/3" or "+1" under it. It sits away from where the player is looking (the "Wave N cleared +gold" text pops at the board's centre), and nothing says what it means. Show the clean result next to the wave-cleared text, in words a new player understands.

## Details
- **What "clean" means today** (unchanged): nothing leaked this wave. Each clean wave adds +1 coin to the run's reward (`coinsForRun` in `core/profile.ts`). Clean waves in a row count up to 3, and the third gives +1 life, once per run (`RunState.clearWave()` / `streakTag()` in `core/run.ts`).
- **Where:** directly under the "Wave N cleared +gold" text at the board's centre (`RunFlow.clearWave()`), as part of that same moment, not at the exit gate. The pop at the exit goes.
- **What it says, in plain words** (one or two short lines, in the game's green, at a size that reads on a phone):
  - a clean wave before the streak pays: "Clean: nothing got through · +1 coin", then "2 of 3 in a row for +1 life" (with the run's count);
  - the wave that pays the streak: "Clean: nothing got through · +1 coin", then "3 in a row: +1 life";
  - after the streak has paid this run: only "Clean: nothing got through · +1 coin".
- A wave with a leak shows no clean line (as today).
- Timing as today: it appears with the wave-cleared text and is readable for the beat before the draft opens (the existing 1-second pause before the draft on a clean wave stays).
- The look stays the game's own: no outline or glow. If it keeps a pill shape, the pill holds the words; it never shows a bare "1/3".

## Acceptance criteria
- [ ] After a clean wave, the clean line appears under "Wave N cleared +gold" at the board's centre, and nothing pops at the exit gate.
- [ ] It says in words that nothing got through and that it is worth +1 coin; before the streak pays it also says how many in a row, out of 3, for +1 life; the paying wave says "+1 life".
- [ ] After a leak there is no clean line; after the streak has paid, only the coin part shows.
- [ ] It reads at 412x915 and 1280x720 and doesn't overlap the wave-cleared text.

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` - replace `streakTag()` with `cleanStreakLine(paidNow)`; drop the now-unused `PALETTE` import
- edit `src/systems/FxSystem.ts` - replace `cleanChip()` with `cleanLines(x, y, second)`
- edit `src/systems/RunFlow.ts` - in `clearWave()`, drop the exit chip, show the clean line at centre under the wave-cleared text; drop the now-unused `CELL` import
- edit `tests/core/run.test.ts` - replace the `streakTag` test with a `cleanStreakLine` test; drop the now-unused `PALETTE` import

### Interfaces
`core/run.ts` — remove `streakTag()`; add (call AFTER `clearWave()`):
```ts
  /** The clean wave's second line under the wave-cleared text: how the streak builds toward a
   * life, or the life it just pays. `paidNow` is true when this wave was the run's one +1-life pay. */
  cleanStreakLine(paidNow: boolean): string | undefined {
    if (paidNow) return '3 in a row: +1 life';
    if (this.streakPaid) return undefined; // the streak already paid this run: only the coin
    return `${this.cleanStreak} of 3 in a row for +1 life`;
  }
```
`systems/FxSystem.ts` — remove `cleanChip(...)`; add (replaces it, in the same spot):
```ts
  /** A clean wave's result in words, under the wave-cleared text at the board's centre: the line
   * "Clean: nothing got through · +1 coin", and, while the streak builds or pays, a second line.
   * Pops in, holds for the beat before the draft veils the board, fades out. */
  cleanLines(x: number, y: number, second: string | undefined): void {
    if (this.live >= FxSystem.MAX) return;
    const first = this.scene.add
      .text(0, 0, 'Clean: nothing got through · +1 coin', textStyle(20, PALETTE.green, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 5 }))
      .setOrigin(0.5).setDepth(DEPTH.fx);
    const kids: Phaser.GameObjects.GameObject[] = [first];
    if (second) {
      kids.push(this.scene.add
        .text(0, 28, second, textStyle(16, PALETTE.green, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 5 }))
        .setOrigin(0.5).setDepth(DEPTH.fx));
    }
    const chip = this.scene.add.container(x, y, kids).setDepth(DEPTH.fx).setScale(0);
    this.live += 1;
    this.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: chip, alpha: 0, delay: 1200, duration: 400, ease: 'Quad.easeIn', onComplete: () => { this.live -= 1; chip.destroy(); } });
  }
```

### Steps
1. `core/run.ts`: replace the `streakTag()` method (lines 129-134) with `cleanStreakLine` above. Change the line-2 import to `import { START, WAVE_BONUS } from '../config';` — no, keep it; remove the `import { PALETTE } from '../content/palette';` line (line 2) since it is now unused.
2. `systems/FxSystem.ts`: replace the `cleanChip` method (lines 169-184) with `cleanLines` above. No import changes.
3. `systems/RunFlow.ts` `clearWave()`: replace the body so it reads:
```ts
    const cleanBefore = this.run.cleanWaves;
    const streakPaidBefore = this.run.streakPaid;
    const bonus = this.run.clearWave();
    const clean = this.run.cleanWaves > cleanBefore;
    hook.stats.wavesCleared += 1;
    this.s.sfx?.waveClear();
    const cx = this.s.board.width / 2;
    const cy = this.s.board.height / 2;
    this.s.fx.popText(cx, cy, `Wave ${this.run.wave} cleared  +${bonus}`, PALETTE.greenDeep);
    if (clean) {
      const second = this.run.cleanStreakLine(!streakPaidBefore && this.run.streakPaid);
      // Under the wave-cleared text, for the beat before the draft veils the board.
      this.s.fx.cleanLines(cx, cy + 40, second);
      this.scene.time.delayedCall(1000, () => this.openDraft());
    } else {
      this.openDraft();
    }
```
   Delete the `tag` line, the `exit`/`cleanChip` lines, and change the import to `import { BUILD_SEC, REROLL_COST } from '../config';` (drop `CELL`).
4. `tests/core/run.test.ts`: replace the test at lines 173-185 (`'tags the clean chip ...'`) with:
```ts
  it('says the clean streak in words: building, the paying wave, then only the coin', () => {
    const run = new RunState(1);
    const clean = (): string | undefined => {
      run.startWave();
      const paidBefore = run.streakPaid;
      run.clearWave();
      return run.cleanStreakLine(!paidBefore && run.streakPaid);
    };
    expect(clean()).toBe('1 of 3 in a row for +1 life');
    expect(clean()).toBe('2 of 3 in a row for +1 life');
    expect(clean()).toBe('3 in a row: +1 life');
    run.startWave();
    run.leak(1); // the streak resets, but the run's one pay is already spent
    expect(clean()).toBeUndefined();
    expect(clean()).toBeUndefined();
  });
```
   Remove the now-unused `import { PALETTE } from '../../src/content/palette';` (line 3).

### Pitfalls
- Unused imports: after the change, `PALETTE` is unused in `run.ts` and `run.test.ts`, and `CELL` is unused in `RunFlow.ts` — remove each or `npm run check` (lint) fails.
- Container origin: the texts are children of the container, so create them at relative `(0,0)`/`(0,28)` and set the container at `(x, y)`; a bare `(x, y)` on the text would double-offset.
- `paidNow` must capture `streakPaid` BEFORE `run.clearWave()` (it flips inside `clearWave()`); the rebuilt-streak case (leak then 3 clean, cleanStreak hits 3 again) is not the paying wave and must show only the coin.
- No overlap: the wave-cleared text rises from centre over 750 ms and the clean lines sit at `cy + 40` (line 2 `+ 28` below), so they never collide.
- Cleanup: the two tweens manage `this.live` (increment once, decrement in the fade's `onComplete`), matching `cleanChip`; don't also route the container through `track()`.
- Timing: keep the `delayedCall(1000)` on the clean branch so the 1 s pause before the draft on a clean wave is preserved; the draft's own shade veils the fading lines.

### Tests
- `tests/core/run.test.ts` (replaces the `streakTag` test): asserts the second line is `1 of 3...`, `2 of 3...`, `3 in a row: +1 life` on the paying wave, and `undefined` after the streak has paid (including after a leak reset). This locks the streak-wording rule so a later change to the pay condition can't silently break the display.

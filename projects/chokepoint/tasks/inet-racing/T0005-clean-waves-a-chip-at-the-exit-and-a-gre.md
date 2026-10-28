---
id: T0005
title: "Clean waves: a chip at the exit and a green line on the card"
assignee: inet-racing
size: M
priority: 2
status: todo
depends_on: [T0001]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E1
---

## Goal
A perfect wave is noticed: the player sees in the moment when they held a wave without leaking, and it is worth something.

## Details
- Data: T0001's run ledger already counts clean waves (a wave that ends with zero leaks) and pays +1 coin each; this task is the display only.
- When a wave ends with no leaks, a small rounded green chip reading "Clean" pops at the path's exit: scale in over 200ms, hold, fade out after ~1.2s. It never plays on a wave with a leak.
- On the game-over card, the "Clean N" line (from T0001) turns green when N > 0 (stays gray/plain at 0).
- No new inputs; no pause-screen change.

## Acceptance criteria
- [ ] A wave with zero leaks shows the green "Clean" chip at the exit once; a wave with any leak shows nothing.
- [ ] After a run with clean waves, the game-over card's "Clean N" line is green; with none, it is plain.
- [ ] The chip is readable at 412x915, sits at the exit without covering the road, and fades on its own.
- [ ] The chip does not block the player's view of enemies still on the path.

## Design (architect, desktop)

### Files
- edit `src/systems/FxSystem.ts` - add one method `cleanChip(x, y)`: the green "Clean" chip (graphics pill + text, a container) that pops in, holds, fades
- edit `src/systems/RunFlow.ts` - in `clearWave()` only: detect a clean wave, play the chip at the exit gate, and delay the draft 1000 ms on a clean wave so the chip is actually seen
- edit `src/scenes/GameOverScene.ts` - one line: the "Clean N" text color turns green when N > 0

### Interfaces
```ts
// FxSystem (src/systems/FxSystem.ts), board units, insert after burst() and before popText():
cleanChip(x: number, y: number): void {
  if (this.live >= FxSystem.MAX) return;
  const g = this.scene.add.graphics();
  g.fillStyle(PALETTE.greenDeep, 1);
  g.fillRoundedRect(-33, -12, 66, 30, 15); // side face
  g.fillStyle(PALETTE.green, 1);
  g.fillRoundedRect(-33, -15, 66, 30, 15); // pill body
  const label = this.scene.add.text(0, -1, 'Clean', textStyle(16, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
  const chip = this.scene.add.container(x, y, [g, label]).setDepth(DEPTH.fx).setScale(0);
  this.live += 1;
  this.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
  this.scene.tweens.add({ targets: chip, alpha: 0, delay: 1200, duration: 400, ease: 'Quad.easeIn', onComplete: () => { this.live -= 1; chip.destroy(); } });
}
```
No other new types. All imports FxSystem needs (PALETTE, DEPTH, textStyle) are already there.

### Steps
1. Add `cleanChip` to `FxSystem` exactly as above (no new imports, no texture: it is transient FX like `popText`, not a painted texture).
2. `RunFlow.ts` line 2: `import { BUILD_SEC } from '../config';` → `import { BUILD_SEC, CELL } from '../config';`. Replace the whole `private clearWave()` (currently lines 110–116) with:
```ts
private clearWave(): void {
  const cleanBefore = this.run.cleanWaves;
  const bonus = this.run.clearWave();
  const clean = this.run.cleanWaves > cleanBefore;
  hook.stats.wavesCleared += 1;
  this.s.sfx?.waveClear();
  this.s.fx.popText(this.s.board.width / 2, this.s.board.height / 2, `Wave ${this.run.wave} cleared  +${bonus}`, PALETTE.greenDeep);
  if (clean) {
    // A beat for the chip to pop before the draft veils the board.
    const exit = this.s.board.path.pointAt(this.s.board.path.length - CELL / 2);
    this.s.fx.cleanChip(exit.x, exit.y);
    this.scene.time.delayedCall(1000, () => this.openDraft());
  } else {
    this.openDraft();
  }
}
```
3. `GameOverScene.ts` line 37: `textStyle(15, PALETTE.muted)` → `textStyle(15, run.cleanWaves > 0 ? PALETTE.greenDeep : PALETTE.muted)` (color only; keep everything else).
4. `npm run check`, then `npm run smoke`.

### Pitfalls
- The draft opens in the same frame the wave clears and GameScene pauses — scene tweens do not advance while paused, so a chip spawned with the draft open would freeze dim under the 0.78 veil and never pop. The 1000 ms `delayedCall` before `openDraft()` is what makes it visible; do not spawn the chip after `openDraft()`.
- `RunState.clearWave()` already set `phase = 'draft'` during that beat: board taps are no-ops (`Building.tap` guards draft), Space is a no-op (`startWaveNow` guards build). No new input guards needed; do not add any.
- Chip anchor is the exit gate: `pointAt(length - CELL/2)` is exactly `edgeEnd` in `art/board.ts`. Never `pointAt(length)` — that is a half-cell past the island edge and hides under the HUD bars at 412x915 (the island fills the fit area exactly). At the gate, the chip sits on the gate/road-end (already covered by the gate square) and beside the road, never over its length; at chip time `aliveCount === 0`, so it can't cover enemies.
- The chip is board-space under the GameScene camera: no `viewSize()`, no `artScale()`; `textStyle` handles resolution like `popText` does.
- `this.live` must increment exactly once per chip (two tweens, one `destroy` in the second `onComplete`), or the `fx.count` invariant drifts. Do not add a new invariant — `fx.count` covers it.
- After the draft closes, up to ~0.5 s of the fade finishes during the build phase — harmless; don't special-case it.
- T0002/T0011 also edit `RunFlow.ts` (other functions, ~line 86) and T0003/T0009 also edit `GameOverScene.ts`. Keep edits to exactly the lines above; if the "Clean N" line has moved (T0003 rewards screen), apply the color change wherever that line now lives.
- Do not touch `core/run.ts`, `profile.ts`, `Sfx` — the clean-wave counting and coin payout (T0001) already exist; this is display only.

### Tests
none (no `src/core` rule changed; the `cleanWaves` delta logic lives in a Phaser system and is covered by the smoke run).

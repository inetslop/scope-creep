---
id: T0420
title: "The game over's bed: a quiet beat under the game-over card"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T11:17:53Z
claimed_at: 2026-11-02T11:55:04Z
finished_at: 2026-11-02T12:33:12Z
---

## Goal
The run's audio beds cover the wave, the build, the draft, the menu and the claim — the game-over card, the last screen a run ends on, is still after its one run-end note (T0367). A quiet beat under it makes the end of the run a resting place like every other: the run's coda, heard.

## Details
- One quiet generative bed, the sixth of the run's: the menu bed's own three notes (E2, B2, E3) as a sine loop at 1.8 s steps with a rest in the beat — the claim bed's own shape (T0408) slowed past the menu bed's 1.6, the calmest of the beds; the beds' shared 0.02 volume and 0.6 s fades.
- It starts on the game-over card's land — the run-end note (T0367) plays on top of the fade-in, unchanged — and keeps playing while the card is shown, Iron or not (no mode form, like the claim bed).
- Leaving the card (to the claim, or to the menu) fades the bed out over ~300 ms into the next scene's own bed — the claim bed's own hand-off pattern (T0408): never a hard cut, never two beds at full volume.
- A new audio file on the claim bed's own file shape (the closest example: `src/audio/claimBed.ts`) and one ownership in the game-over scene (the menu bed's pattern, T0397: constructed on the scene's create, stopped when it is left). No change to the card's look, the run-end note, the claim's flow or any other bed.
- Silent with sound off (Sfx's own guard); no new key, button, HUD element or board mark; the pause screen is untouched.

## Acceptance criteria
- [ ] The moment the game-over card lands, a quiet three-note beat (E2/B2/E3, 1.8 s steps, 0.02 volume) fades in over ~0.6 s and keeps playing while the card is shown; the run-end note still plays on the land, on top of the fade-in
- [ ] Leaving the card fades the beat out over ~300 ms into the next scene's own bed (the claim's or the menu's) — the claim bed's own hand-off (T0408): no hard cut, and never a moment where two beds play at full volume
- [ ] With sound off, nothing plays; the game-over card's look and note, the claim's flow and the menu are byte-identical to before
- [ ] No new key, button, HUD element or board mark; `npm run check` and the desktop + mobile smoke pass

## Design (architect, inet-racing)

### Files
- create `src/audio/gameOverBed.ts` — the sixth run bed: `GameOverBed` class, a copy of `src/audio/claimBed.ts` with different constants (below)
- edit `src/scenes/GameOverScene.ts` — own the bed: field + construct in `create()` + one-line `update()` (menu-bed pattern, T0397)
- edit `src/debug/runChecks.ts` — import `GameOverScene`, add one `gameOverBed.valid` invariant line next to the other bed lines

### Interfaces
`src/audio/gameOverBed.ts` (exported class, same surface as `ClaimBed`):
```ts
import type { Sfx } from './Sfx';

const DECAY_SEC = 0.5, FADE_IN_SEC = 0.6, FADE_OUT_SEC = 0.3, STEP_SEC = 1.8, VOL = 0.02;
const NOTES = [82.41, 123.47, 164.81]; // E2 B2 E3
const PATTERN = [0, 1, 2, -1]; // the claim's shape: E2 B2 E3, then a rest

export class GameOverBed {
  constructor(private readonly sfx: Sfx | undefined) {}
  /** dt = real seconds; playing = the game-over card is shown (call it with true). */
  update(dt: number, playing: boolean): void;
  /** Fades the bed out over 0.3 s; a no-op when not started; call it from the scene's shutdown too. */
  stop(): void;
  broken(): string | undefined;
}
```
Everything else in the class is byte-for-byte `claimBed.ts`, except: `start()`'s gain ramp uses `FADE_IN_SEC` (0.6), `stop()`'s gain ramp and its `setTimeout` use `FADE_OUT_SEC` (0.3); the class doc comment describes this bed (the run's coda under the game-over card: the menu's E2/B2/E3 at 1.8 s steps with the claim's rest — slower than the menu's 1.6, the calmest bed; 0.02 pre-master, the beds' shared volume; fades in over 0.6 s as the card lands, on top of which `Sfx.runEnd()` plays unchanged; fades out over 0.3 s when the card is left, the claim bed's own hand-off (T0408); silent when muted; no forms, like the claim bed). The `broken()` body and its comment stay claim's (`liveNotes > 2`).

`src/scenes/GameOverScene.ts` additions (exact):
- After `import Phaser from 'phaser';` add: `import { GameOverBed } from '../audio/gameOverBed';`
- Class field, after the constructor: `bed!: GameOverBed; // the run's coda bed under the card: its shutdown stops it, runChecks reads it while the card is shown`
- In `create()`, right after `hook.overlay = '';` (before `setBackgroundColor`):
```ts
    this.bed = new GameOverBed(getSfx(this));
    this.events.once('shutdown', () => this.bed.stop()); // the fade-out and ringing notes must not outlive the card (the Sfx context is the singleton's)
```
- New method after `create()` (mirror `MenuScene.update`):
```ts
  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.bed.update(dt, true); // the card is up: this scene's stop is the only way off it
  }
```
Nothing else in the scene changes — in particular `getSfx(this)?.runEnd();` (line 57) stays where it is; the note plays on top of the fade-in.

`src/debug/runChecks.ts`:
- Add `import { GameOverScene } from '../scenes/GameOverScene';` in the scene imports block (before the `MenuScene` import, line 15).
- After the `claimBed.valid` line (116) add, one line:
```ts
  ['gameOverBed.valid', (g) => (g.scene.isActive(SCENES.gameOver) ? (g.scene.get(SCENES.gameOver) as GameOverScene).bed.broken() : null)],
```

### Steps
1. Create `src/audio/gameOverBed.ts`: copy `src/audio/claimBed.ts` wholesale, then change only the constants line, the two ramp/delay sites (FADE_IN in `start()`, FADE_OUT in `stop()`), and the doc comment.
2. Edit `GameOverScene.ts` with the three additions above.
3. Edit `runChecks.ts` with the import and the invariant line.
4. `npm run check`, then `npm run smoke`.

### Pitfalls
- Do not put `bed.stop()` in the exit handlers (`claim`, `again`, the menu button) and do not add a `playing` flag: Phaser 3.90's `this.scene.start(key)` stops the calling scene (verified in `node_modules/phaser/src/scene/ScenePlugin.js`), so every exit — claim, play again, menu, Enter/Space, the smoke auto-restart — fires the `shutdown` listener, which is the one stop. Adding handler-level stops would diverge from the menu/claim pattern.
- Two fade constants, not one: both existing beds reuse one `FADE_SEC` for in and out, but this card takes 0.6 s in and 0.3 s out. Don't "tidy" it back to one constant.
- Don't move, delay or re-voice the `runEnd()` call — the run-end note is T0367's and must land on top of the fade-in unchanged.
- The bed must be constructed inside `create()`, not the constructor or module scope: the scene instance is reused between runs, and a fresh run means a fresh bed.
- Keep `VOL = 0.02`, `DECAY_SEC = 0.5`, sine type and the `sfx.muted` / `ctx.state !== 'running'` guards exactly as claim's — sound-off silence and the never-two-beds-at-full-volume hand-off fall out of the copied guards plus the opposite-direction ramps.
- No changes to `src/audio/Sfx.ts`, the claim flow, the menu, pause, card layout, hotkeys or HUD — byte-identity of those is an acceptance criterion.

### Tests
none (audio only; no `src/core` rule changes)

## Result (attempt 1, inet-racing)

Added the sixth run bed — `src/audio/gameOverBed.ts` (`GameOverBed`, the menu's E2/B2/E3 as a sine loop at 1.8 s steps with the claim's rest, 0.02 volume) — owned by `GameOverScene` (constructed in `create()`, stopped on scene shutdown, driven from a one-line `update()`), plus the `gameOverBed.valid` invariant in `runChecks.ts`. The quiet three-note beat fades in over 0.6 s as the game-over card lands (the run-end note plays on top, unchanged) and fades out over 0.3 s on any exit, the claim bed's hand-off pattern; silent when muted. Card look, run-end note, claim flow and menu are untouched; `npm run check` and desktop + mobile smoke pass.

- Self-review: APPROVE
- Time: 38.1 min

```
projects/chokepoint/game/src/audio/gameOverBed.ts  | 77 ++++++++++++++++++++++
 projects/chokepoint/game/src/debug/runChecks.ts    |  2 +
 .../chokepoint/game/src/scenes/GameOverScene.ts    | 10 +++
 3 files changed, 89 insertions(+)
```

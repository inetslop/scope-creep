---
id: T0417
title: "The island's note: the board's settle gets its thud"
assignee: asus
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T10:20:00Z
claimed_at: 2026-11-02T13:46:47Z
finished_at: 2026-11-02T13:54:10Z
---

## Goal
The board's drop-in (T0407) is the run's opening beat and it is silent; one soft low thud at the moment the board settles makes the arrival felt the way every other structural moment is already heard (the run's end, the wave clear, the move's blip).

## Details
- One new sound, the settle thud: a single sine falling from ~90 Hz to ~60 Hz over ~150 ms at volume 0.12 — the sting's quiet class (T0091 is 0.1), clearly below the leak thud's prominence (0.25): it has to be heard under the draft bed (T0372) without fighting the cards' reveal chimes.
- It plays exactly once per new run, at the moment the drop-in tween completes (the board first rests at rest scale, ~400 ms into the run's open) — the drop-in's own gate: never on a resumed run, never on the menu demo (T0407's gate).
- One new Sfx method (closest example: `Sfx.leakWarn()`, a quiet one-note) and one call site where the drop-in's tween completes (closest example: `Sfx.speedBlip()`'s single call site in WaveSpeed). No change to the tween, the drop-in's look or any HUD; silent with the sound toggle off.

## Acceptance criteria
- [ ] Starting a new run plays exactly one soft thud at the moment the board finishes settling; a resumed run and the menu demo play none.
- [ ] The thud is a single ~150 ms low note quieter than the leak thud, and it does not play with the sound toggle off.
- [ ] The drop-in's look, timing and gate are unchanged; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — add the one new sound `settleThud()`
- edit `src/systems/Board.ts` — hold `sfx` (constructor param, type import, field) and call it from the drop-in tween's `onComplete`
- edit `src/scenes/GameScene.ts` — pass `sfx` into the Board's constructor (one line)

### Interfaces
```ts
// src/audio/Sfx.ts — new method, inserted after sting()'s closing brace (line 120), before runEnd()'s doc comment:
  /** The island's settle at the run's open: one low sine, 90 Hz to 60 Hz over 150 ms, the sting's quiet class, under the leak thud's 0.25. */
  settleThud(): void {
    this.tone(90, 0.15, 'sine', 0.12, 60);
  }
```
```ts
// src/systems/Board.ts
// after the `import type { Tower } from '../entities/Tower';` line:
import type { Sfx } from '../audio/Sfx';
// after the `private readonly scene: Phaser.Scene;` field:
  private readonly sfx: Sfx | undefined;
// constructor: `constructor(scene: Phaser.Scene, map: GameMap, marked: Cell, sfx: Sfx | undefined)`,
// and `this.sfx = sfx;` right after `this.scene = scene;`
// in dropIn(), line 70, change only the last argument:
  // onComplete: () => this.settleRest()
  // becomes:
  // onComplete: () => { this.settleRest(); this.sfx?.settleThud(); }
```
```ts
// src/scenes/GameScene.ts line 136:
    this.board = new Board(this, map, marked, sfx); // `sfx` is the const from getSfx(this) at line 92
```
### Steps
1. Add `settleThud()` to `Sfx.ts` (exact code above; the `tone` helper already no-ops when muted or audio is locked — no toggle logic).
2. `Board.ts`: add the `Sfx` type import, the `sfx` field, the constructor param + assignment, and swap the `onComplete` closure as shown. Nothing else in Board moves — no tween, scale, duration or ease change.
3. `GameScene.ts`: the one-line constructor change.
### Pitfalls
- Exactly-once is structural: `onComplete` fires only when the 400 ms tween runs to term; `settleNow()`'s `killTweensOf` does not fire it (a fast first pick snaps the board silent — the task defines the moment as the tween's completion).
- Gate is inherited, never re-checked: the only `dropIn` call is `RunFlow.openDraft`'s `run.wave === 0` line, reached only via `GameScene`'s `if (!saved) this.flow.openDraft()` — resumed runs, the menu demo and mid-run drafts all never create the tween.
- Always `this.sfx?.settleThud()`: `sfx` is `Sfx | undefined` (registry lookup before the first unlock); a bare call would crash smoke.
- Volume 0.12 is deliberate: the sting's class (0.1) raised so it reads under the draft bed, clearly under the leak thud's 0.25; do not retune.
- No invariant, no test, no HUD change — a sound only.
### Tests
- none

## Result (attempt 1, asus)

Added `Sfx.settleThud()` (one low sine, 90→60 Hz over 150 ms at volume 0.12) in `src/audio/Sfx.ts`, wired it into the board's drop-in tween `onComplete` in `src/systems/Board.ts` (which now takes an optional `Sfx`), and passed `sfx` through at Board's construction in `src/scenes/GameScene.ts` — the island now plays exactly one soft thud when it settles at the run's open, silent on resumed runs, the menu demo, or with sound off.

- Self-review: APPROVE
- Time: 7.4 min

```
projects/chokepoint/game/src/audio/Sfx.ts        | 5 +++++
 projects/chokepoint/game/src/scenes/GameScene.ts | 2 +-
 projects/chokepoint/game/src/systems/Board.ts    | 7 +++++--
 3 files changed, 11 insertions(+), 3 deletions(-)
```

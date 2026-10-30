---
id: T0254
title: "The combo milestone chime: the ×10 kill moment, heard"
assignee: asus
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 2
created: 2026-10-30T04:48:47Z
claimed_at: 2026-10-30T11:17:04Z
epic: E4
---

## Goal
The kill chain's loudest moment gets a note: the moment the ×N counter reaches ×10 — the milestone that already turns it yellow and doubles its chips (T0034) — one soft two-note chime plays, so the chain (which E4's Feast turns into a live damage buff, T0235) is heard at its peak.

## Details
- One soft two-note ascending chime: E5 (~659 Hz) then G5 (~784 Hz), 80 ms sines each, 90 ms apart, volume 0.1 — the coin chime's notes (T0009) at the tier chime's quiet class (T0032), the same shape as the wave-clear sweep (T0240). A new two-note method in the Sfx module (`src/audio/Sfx.ts`) next to `waveSweep()`.
- Played once per chain, from the one place that decides the milestone: `src/systems/FxSystem.ts`'s `killCount()` (T0034) returns the ×10 milestone — the chime plays there, and nowhere else.
- The 5th kill of a chain (T0066's gold milestone) plays no chime; kills ×11 and up in the same chain stay silent; a later chain plays again at its own ×10.
- The chime is scene-level: at 2× fast-forward (T0019) it plays once, never stretched or doubled.
- Silent when sound is off (T0035). Procedural, no sound file.
- No new HUD or board mark: the yellow counter and the 12-chip burst (T0034) already show the moment; this adds its note.

## Acceptance criteria
- [ ] The kill that brings the counter to ×10 plays one E5→G5 chime (80 ms sines, 90 ms apart, volume 0.1); the ×5 gold milestone (T0066) plays no chime.
- [ ] Exactly one chime per chain: ×11 and later in the same chain are silent, and a later chain plays again at its own ×10.
- [ ] At 2× fast-forward (T0019) the chime plays once, and the yellow counter and the 12-chip burst are unchanged.
- [ ] With sound off (T0035) the milestone stays fully visible and the chime is silent.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - new method `comboChime()` inserted after `waveSweep()` (line 165), before `deny()`
- edit `src/systems/FxSystem.ts` - `import type { Sfx }`, field `private readonly sfx`, optional ctor param, one line in `killCount()`
- edit `src/scenes/GameScene.ts` - line 105: `new FxSystem(this)` → `new FxSystem(this, sfx)`

### Interfaces
```ts
// Sfx.ts — next to waveSweep(), same shape (E5 then G5, 80 ms sines, 90 ms apart, vol 0.1):
comboChime(): void;

// FxSystem.ts — sfx flows in like EnemySystem/TowerSystem/ExitWarning already do:
import type { Sfx } from '../audio/Sfx';
private readonly sfx: Sfx | undefined;
constructor(scene: Phaser.Scene, sfx?: Sfx);
```

### Steps
1. In `Sfx.ts`, after the `waveSweep()` method add exactly:
```ts
  /** The ×10 kill-chain milestone: a soft two-note rise, E5 then G5, 90 ms apart, the tier-chime's quiet volume. */
  comboChime(): void {
    this.tone(659, 0.08, 'sine', 0.1);
    this.tone(784, 0.08, 'sine', 0.1, undefined, 0.09);
  }
```
2. In `FxSystem.ts`: add the type import; add field `private readonly sfx: Sfx | undefined;` next to `readonly scene`; ctor becomes `constructor(scene: Phaser.Scene, sfx?: Sfx) { this.scene = scene; this.sfx = sfx; }`.
3. In `FxSystem.killCount()` (line 155): replace `return this.comboN === 10;` with:
```ts
    if (this.comboN === 10) this.sfx?.comboChime();
    return this.comboN === 10;
```
4. In `GameScene.ts` line 105: `this.fx = new FxSystem(this, sfx);` (`sfx` is the `getSfx(this)` from line 77).

### Pitfalls
- `src/scenes/menu/MenuDemo.ts:69` also does `new FxSystem(scene)` — the param stays optional so that call is untouched (demo plays no chime).
- Gate must be `=== 10`, never `>=`: ×11+ stays silent; `breakCombo()` and the 1.5 s gap reset `comboN` to 0, so a later chain chimes at its own ×10. ×5 (T0066) never fires it.
- Do not touch the yellow branch (`if (this.comboN === 10) t.setStyle(...)`) or the `burst(..., milestone)` call — counter and 12-chip burst stay as T0034 left them.
- `Sfx.tone` already no-ops when muted or audio locked (sound off T0035) and runs in WebAudio real time, so 2× fast-forward plays it once, unstretched; no cleanup needed (no held nodes, unlike `beamHumStart`).

### Tests
none

## Attempt 1 failed (asus)

Runner error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at 4cd695f40a9646de941cc68e711a86e4894f0a1b but expected 899caa73a8b2051727438934e1949239c8dbfdef


```
Error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at 4cd695f40a9646de941cc68e711a86e4894f0a1b but expected 899caa73a8b2051727438934e1949239c8dbfdef

    at Git.fetch (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/git.ts:134:29)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async integrate (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:260:5)
    at async runDevTask (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:144:21)
    at async main (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/runner.ts:154:9)
```

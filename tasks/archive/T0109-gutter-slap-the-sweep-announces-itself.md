---
id: T0109
title: Gutter slap — the sweep announces itself
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0102, T0107]
attempts: 1
created: 2026-10-27T13:08:21Z
claimed_at: 2026-10-27T16:12:51Z
finished_at: 2026-10-27T16:28:28Z
---

## Goal
The moment a gutter band enters the page, a soft paper slap plays — the sweep (T0099) is heard as well as seen, so a player not watching the boundary still knows the ink is coming.

## Details
- One new SFX method in the SFX module (`src/audio/Sfx.ts`; closest examples in the same file: the noise-based hit and level-up sounds from T0003, and the throttled `critHit()` blip from T0019): a short filtered noise burst — about 80 ms, low-passed around 800 Hz, gain about half of the normal hit, fast attack, quick decay. A paper "slap": no new tone, no pitch movement.
- Where it plays: the Gutter system (the one that draws the sweeping band and the red rule; its pure timing lives in `src/core/gutter.ts`) — at the moment the band starts its 4.0 s crossing, i.e. when the band's leading edge crosses into the safe area. That is 1.5 s after the red rule telegraph begins, not at the telegraph's start.
- One slap per sweep entry. Sweeps are 20 s apart, so no throttling is needed; the Gutter is inactive before 14:00, so nothing plays until the first sweep.
- No gameplay change: the Gutter's 40-unit width, 4.0 s crossing, 20 s cadence, 4 damage/s burn and the 1.5 s telegraph are all untouched. No HUD, no input, no new key. The slap obeys the existing mute (M) like all other SFX.

## Acceptance criteria
- [ ] The moment a gutter band starts its crossing (1.5 s after the red rule telegraph begins), one soft paper slap plays — audible under the music, clearly quieter than a normal hit, with no new tone.
- [ ] No slap while the Gutter is inactive (before 14:00) or during the 20 s between sweeps, and no second slap during a band's 4.0 s crossing.
- [ ] The Gutter's width, crossing time, cadence, burn and telegraph are unchanged, and no HUD element, input or key is added.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/audio/Sfx.ts` — add `gutterSlap()`: one filtered noise burst, no tone
- edit `src/systems/GutterSystem.ts` — receive `Sfx`, play one slap per sweep entry
- edit `src/scenes/GameScene.ts` — construct `Sfx` before `GutterSystem`, pass it in

### Interfaces
```ts
// Sfx.ts — new public method (no fields, no throttling — sweeps are 20 s apart; mute comes from canPlay())
gutterSlap(): void

// GutterSystem.ts — only constructor change: sfx appended as last parameter
constructor(scene: Phaser.Scene, run: RunState, player: Player, marginalia: Marginalia, damageNumbers: DamageNumbers, sfx: Sfx)
```

### Steps
1. `src/audio/Sfx.ts` — insert after `slam()`'s closing brace (line 175), before `levelUp()`. Reuse the private `noise()` helper (it already does instant attack + exponential decay):
```ts
  /** Soft paper slap as the gutter band sweeps into the page: ~80 ms low-passed noise at half a hit's gain, no tone. */
  gutterSlap(): void {
    if (!this.canPlay()) return;
    this.noise(0.08, 0.11, 800, 'lowpass');
  }
```
2. `src/systems/GutterSystem.ts` — (a) add `import type { Sfx } from '../audio/Sfx';` after the `'../art/shapes'` import; (b) add fields `private readonly sfx: Sfx;` (with the other readonly fields) and `private lastSlapSweep = -1;` (after `taught`); (c) append `sfx: Sfx` to the constructor and set `this.sfx = sfx;`; (d) in `update()`, right after the `this.bandX = ...` line (line 51), before `this.g.clear()`, insert:
```ts
    if (ph.active && ph.sweep !== this.lastSlapSweep) {
      this.lastSlapSweep = ph.sweep;
      this.sfx.gutterSlap();
    }
```
(e) in the class doc, after the `"THE PAGE INKS" marginalia note.` line, add: ` * One soft paper slap (Sfx.gutterSlap) plays when each band sweeps into the safe area; the burn stays silent.`
3. `src/scenes/GameScene.ts` — move lines 101–102 (`this.sfx = new Sfx(this);` and `this.registry.set('sfx', this.sfx);`) above line 100, and change line 100 to:
```ts
    this.gutter = new GutterSystem(this, this.run, this.player, this.marginalia, this.damageNumbers, this.sfx);
```

### Pitfalls
- `Sfx` is currently constructed AFTER `GutterSystem` in `create()` — passing `this.sfx` without moving those two lines compiles but hands over `undefined`.
- Trigger on `ph.sweep` (integer, stable for the whole 4 s crossing), not on a bool edge: a late frame or pause/resume mid-crossing must never re-slap, and a dropped frame cannot skip the entry (dt is clamped to 50 ms).
- Do NOT add a `last*At` throttle field and do NOT write a new gain envelope — the `noise()` helper is the whole sound; no `tone()` call (no new tone, no pitch movement).
- Do not touch `GUTTER`/`gutterAt` in `src/core/gutter.ts` (width 40, cross 4 s, period 20 s, burn 4/s, telegraph 1.5 s all unchanged); no HUD, no input, no new key, no new invariants (no new system added).

### Tests
none

## Result (attempt 1, yoga)

The gutter sweep now announces itself — when the ink band's leading edge crosses into the safe area (1.5 s after the red rule telegraph), one soft paper slap plays: an ~80 ms low-passed noise burst (~800 Hz, half a normal hit's gain, no tone) added as `Sfx.gutterSlap()` in `src/audio/Sfx.ts`, fired once per sweep entry from `GutterSystem` (`src/systems/GutterSystem.ts`, which now receives `Sfx` constructed in `src/scenes/GameScene.ts`). Nothing plays before 14:00, between sweeps, or twice during a crossing, and the Gutter's timing, burn, telegraph, HUD and input are all untouched. `npm run check` and `npm run smoke` pass.

- Self-review: APPROVE
- Time: 15.6 min

```
game/src/audio/Sfx.ts            |  6 ++++++
 game/src/scenes/GameScene.ts     |  2 +-
 game/src/systems/GutterSystem.ts | 14 ++++++++++++--
 3 files changed, 19 insertions(+), 3 deletions(-)
```

---
id: T0064
title: Boss nameplate intro
assignee: desktop
size: M
priority: 2
status: done
depends_on: [T0054]
attempts: 1
created: 2026-10-27T03:07:33Z
claimed_at: 2026-10-27T11:42:01Z
finished_at: 2026-10-27T11:55:00Z
---

## Goal
The first time each boss spawns in a run, its name is printed in small caps near the top of the page and fades out over 2 s — the player learns who they are fighting, landing on top of the T0058 boss sting.

## Details
- When The Frame first spawns in a run, the text "THE FRAME" is printed horizontally centered near the top of the page, in clean geometric small caps, ink color, and fades out linearly (opacity 1 → 0) over 2.0 s, then is removed.
- When The Grid first spawns in a run, the same treatment with "THE GRID".
- Take the name from the boss's existing content data (the FRAME/GRID registry), not a hardcoded string — a future third boss should get its nameplate for free.
- First appearance only: later respawns of the same boss (the +50% HP ones) show no nameplate. The T0058 boss sting still plays on every spawn — no new audio here.
- Placement: top of the page, centered, clearly above the boss health bar and clear of the HUD readouts (note: T0054, on desktop-4070, is adding a "SCORE n" readout to the HUD — re-read the HUD scene before editing and keep both clear). It is decorative only: no input blocking, no pointer events.
- Text style should match the existing HUD/flash labels (same type as the "RHYTHM" flash / marginalia labels); it should scale with the rest of the HUD on mobile.
- No new art, no new SFX, no new scene.

## Acceptance criteria
- [ ] The first Frame spawn of a run prints "THE FRAME" top-center and it is fully faded within ~2 s; the first Grid spawn of a run prints "THE GRID" the same way.
- [ ] Second and later spawns of the same boss show no nameplate, and the T0058 boss sting still plays on those respawns.
- [ ] The nameplate never overlaps the boss health bar or the HUD readouts and does not block input.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` - per-run boss-id sighting set + `firstBossSighting()`, next to the existing `firstSighting()`
- edit `src/scenes/keys.ts` - add `bossNameplate` to `GAME_EVENTS`
- edit `src/systems/BossSystem.ts` - emit the event on the spawn frame, only when this boss id is new to the run
- edit `src/scenes/HudScene.ts` - the nameplate: one Text, one listener, a 2 s linear fade in `update()`
- edit `tests/core/core.test.ts` - unit test for `firstBossSighting`

No new files, no new art, no new SFX, no new scene.

### Interfaces
```ts
// core/run.ts — add to RunState directly below firstSighting()
private readonly seenBossIds = new Set<string>();
/** True exactly once per boss id per run (first-appearance nameplate). */
firstBossSighting(id: string): boolean {
  if (this.seenBossIds.has(id)) return false;
  this.seenBossIds.add(id);
  return true;
}

// scenes/keys.ts — add to GAME_EVENTS
/** The boss first appeared this run. Payload: the boss name (string) from its content def. */
bossNameplate: 'boss-nameplate';

// systems/BossSystem.ts — in startEntering(), immediately after this.music.bossSwell();
if (this.run.firstBossSighting(this.def.id)) this.scene.events.emit(GAME_EVENTS.bossNameplate, this.def.name);
```

### Steps
1. Apply the three snippets above (BossSystem also needs `import { GAME_EVENTS } from '../scenes/keys';`).
2. HudScene fields (near `bossWarnText`) + top const: `private bossPlate!: Phaser.GameObjects.Text; private bossPlateActive = false; private bossPlateAge = 0;` and `const BOSS_PLATE_SEC = 2;`.
3. In `HudScene.create()` right after the `bossWarnText` line: `this.bossPlate = this.add.text(0, 0, '', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0).setVisible(false);` and add `this.bossPlateActive = false; this.bossPlateAge = 0;` to the state-reset block.
4. In `create()`, beside the other `gameEvents` listeners, add `const onBossNameplate = (name: string): void => { this.bossPlate.setText(name); this.bossPlateAge = 0; this.bossPlateActive = true; this.bossPlate.setAlpha(1).setVisible(true); };` then `gameEvents.on(GAME_EVENTS.bossNameplate, onBossNameplate);` and `gameEvents.off(GAME_EVENTS.bossNameplate, onBossNameplate);` in the existing SHUTDOWN block.
5. In `update()`, after the boss-bar if/else block, add:
```ts
if (this.bossPlateActive) {
  if (this.scene.isActive(SCENES.game)) this.bossPlateAge += dt; // frozen while pause/level-up is up
  const bossTop = (narrow ? PAD + 40 : PAD) + 26;
  this.bossPlate.setPosition(width / 2, bossTop + 42); // 12 px below the bar's bottom edge
  if (this.bossPlateAge >= BOSS_PLATE_SEC) {
    this.bossPlateActive = false;
    this.bossPlate.setAlpha(0).setVisible(false);
  } else {
    this.bossPlate.setAlpha(1 - this.bossPlateAge / BOSS_PLATE_SEC);
  }
}
```
6. Add the unit test below. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Placement: the slot above the boss bar is already occupied (timer + the bar's own name label), so the plate goes below the bar at `bossTop + 42`, centered. Do not put it above the bar — that is what overlaps the HUD. Re-read HudScene before editing (T0054 adds a SCORE readout there); if that readout lands in the plate's slot, bump the y down by one row (single expression).
- Name comes from `this.def.name` (content data, already all-caps per content.test.ts). No hardcoding, no case transforms — a future third boss gets its plate for free.
- First-appearance-only state lives in RunState, so it resets on every new run automatically. Do not touch `bossSting`/`bossSwell` — they must still fire on every spawn.
- The listener must be removed in the SHUTDOWN block (the Game scene's emitter survives restarts), and plate state reset in `create()` (Hud is re-created each run).
- Leave the Text non-interactive (default) — no input blocking. No new invariant: this is a HUD label in the same class as the RHYTHM/ERASED flashes, not a system.
- The fade is pure `dt` math (seconds), no tween; the `isActive` guard keeps the 2 s window from being consumed while the game scene is paused.

### Tests
- `tests/core/core.test.ts`, in `describe('RunState')` next to the first-sighting test:
```ts
it('reports each boss id as a first sighting exactly once', () => {
  const run = new RunState(1);
  expect(run.firstBossSighting('frame')).toBe(true);
  expect(run.firstBossSighting('frame')).toBe(false);
  expect(run.firstBossSighting('grid')).toBe(true);
});
```
- Optional visual check (boss first appears at 300 s): temporarily set `firstAtSec: 8, intervalSec: 15` in `src/core/boss.ts`, play, then `git checkout src/core/boss.ts` — the diff must be clean.

## Result (attempt 1, desktop)

Added the T0064 boss nameplate: `RunState.firstBossSighting()` (per-run boss-id set, unit-tested), a new `bossNameplate` game event emitted by `BossSystem.startEntering()` only on a boss's first spawn of the run (name taken from the boss content def, so a future third boss gets it for free), and a decorative Text in `HudScene` that prints the name centered below the boss bar and fades out linearly over 2 s, frozen while pause/level-up overlays are up and removed from the emitter on shutdown. Boss sting/swell are untouched and still play on every spawn. `npm run check` (185 tests) and `npm run smoke` (desktop + mobile) both pass, plus an extra smoke run with an accelerated boss schedule to exercise the nameplate path end-to-end in the browser.

- Self-review: APPROVE
- Time: 13.0 min
- Self-review made fixes (kept; checks pass).

```
game/src/core/run.ts           |  9 +++++++++
 game/src/scenes/HudScene.ts    | 39 +++++++++++++++++++++++++++++++++++++++
 game/src/scenes/keys.ts        |  2 ++
 game/src/systems/BossSystem.ts |  2 ++
 game/tests/core/core.test.ts   |  7 +++++++
 5 files changed, 59 insertions(+)
```

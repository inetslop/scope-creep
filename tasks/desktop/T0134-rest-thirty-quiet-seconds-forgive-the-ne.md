---
id: T0134
title: Rest — thirty quiet seconds forgive the next hit
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T18:14:35Z
---

## Goal
Survival should have a rhythm: after 30 seconds without taking damage, the next discrete hit you take is free — the late page learns that peace is a weapon, and banking a quiet moment against a boss bullet or a swarm dive becomes a real decision.

## Details
- The rule: from run start, and after any damage taken (enemy contact, an enemy bullet, or a continuous burn — the Gutter (T0099), the Crop (T0045), The Press's 8/s), 30 seconds without taking any damage puts you at Rest. While at Rest, the next discrete damage instance — enemy contact or an enemy bullet, from any enemy, elite or boss — is fully negated: 0 damage, no kill-streak reset (T0014), no platemark (T0094), no hurt sound; instead the existing low blip (T0101) plays, a small flat ink ring pops at the player's position, and the HUD label pops.
- The 30-second count restarts from the moment of the negated hit — one free hit per 30 seconds of peace, never two in a row.
- Continuous burns are never negated; they only restart the count (standing in the Gutter can never put you at Rest).
- Multiple discrete hits in the same frame: only the first is negated, the rest apply normally.
- HUD: a small-caps "REST" label in the HUD, in the same idiom and position as the "RHYTHM" flash (T0014), ink at ~70% alpha, laid out for 412×915 and 1280×720 like the rest of the HUD. It appears the moment the 30 seconds are up, holds while covered, pops (1.2× → 1.0× over 150 ms) the moment the hit is negated, and disappears the moment the count restarts.
- The rule is a small pure state (time-since-damage, covered, negate-next) with unit tests in the crop/still-life pattern: not covered at 29.9 s, covered at 30.0 s; any damage at any point restarts the count; a negated hit restarts the count exactly (not covered again until 30.0 s after the negation).
- No new key, no new SFX (the blip is reused), no new scene.

## Acceptance criteria
- [ ] A run that takes no damage prints "REST" in the HUD at exactly 0:30; the first hit after that deals 0 damage — no HP loss, no streak reset, no platemark — the label pops, the low blip plays, and the label is gone again until 30 s of peace have passed.
- [ ] Any damage (contact, bullet, or standing in a Gutter/Crop burn) restarts the 30 s count and hides the label until it completes again; burns are never negated.
- [ ] A second discrete hit landing in the same frame as a negated hit applies normally.
- [ ] While not at Rest, every hit behaves byte-identically to before (damage, streak, platemark, hurt sound); no new key, sound or scene.

## Design (architect, desktop)

- Discrete player damage happens in exactly **4 places**: `CombatSystem.onPlayerTouched`, `CombatSystem.onPlayerShot`, `BossSystem.onPlayerTouched` (boss contact, incl. Frame dash + Palette swatch), and the Grid arm sweep (`BossSystem` line 388). All four funnel through `RunState.takeDamage`, so the negation decision belongs **inside `takeDamage`** — bosses and elites get it for free, and the Press's future 8/s burn gets "restarts the count, never negated" for free because it will call `run.drain()`.
- Burns (`CropSystem`, `GutterSystem`) already funnel through `run.drain()` — one line there restarts the count for every current and future hazard, with zero per-system edits.
- No scene events are needed: HudScene can read `run.rest.covered` / `run.rest.negations` directly (it's already a pure reader of RunState), so `keys.ts` stays untouched.
- All existing unit tests keep passing untouched, because `RestState` only arms when someone calls `tick()` (only GameScene does).

DESIGN:
### Files
- create `src/core/rest.ts` - pure Rest rule: `REST` constant + `RestState` class
- create `tests/core/rest.test.ts` - unit tests for the rule + RunState wiring
- edit `src/core/run.ts` - import, `readonly rest` field, `takeDamage` negates, `drain` restarts
- edit `src/systems/CombatSystem.ts` - both player-hit handlers branch on `rested`; new private `restForgive()`
- edit `src/systems/BossSystem.ts` - same branch in `onPlayerTouched` and the Grid arm-sweep block; new private `restForgive()`
- edit `src/scenes/GameScene.ts` - import `REST`, `run.rest.tick(dt)` in update, `rest` invariant
- edit `src/scenes/HudScene.ts` - REST label (field, create, create-reset, update pop+visibility)

### Interfaces
```ts
// src/core/rest.ts — full file
/**
 * Rest (pure logic). After `windowSec` (30 s) without taking any damage the
 * player is at rest: the next discrete hit (enemy/boss contact or bullet) is
 * fully negated. Any damage restarts the count — including continuous burns
 * (Crop, Gutter, The Press), which are never negated. A negated hit restarts
 * the count too: one free hit per 30 s of peace, never two in a row.
 */
export const REST = { windowSec: 30 } as const;

export class RestState {
  /** Seconds of peace since the last damage of any kind. */
  since = 0;
  /** True while at rest: the next discrete hit is free. */
  covered = false;
  /** Discrete hits negated this run; the HUD pops the REST label when this grows. */
  negations = 0;

  /** Advances the quiet count by dt seconds; flips `covered` at REST.windowSec. */
  tick(dt: number): void {
    this.since += dt;
    this.covered = this.since >= REST.windowSec;
  }

  /** A discrete hit landed. At rest: negated (returns true) and the count restarts exactly. Otherwise returns false and just restarts. */
  discreteHit(): boolean {
    const negated = this.covered;
    this.since = 0;
    this.covered = false;
    if (negated) this.negations += 1;
    return negated;
  }

  /** A continuous burn tick: never negated, restarts the count. */
  burn(): void {
    this.since = 0;
    this.covered = false;
  }
}
```
`RunState` gains `readonly rest = new RestState();` (after the `inkwell` field). `takeDamage` body becomes: early-return unchanged, then `if (this.rest.discreteHit()) return 0;` before the armor line. `drain`: `if (dealt > 0) this.streak = 0;` becomes a 3-line block also calling `this.rest.burn();`.

### Steps
1. Create `src/core/rest.ts` exactly as above.
2. `src/core/run.ts`: insert `import { RestState } from './rest';` between the `progression` and `rng` imports; add the `rest` field after `inkwell = 0;`; apply the `takeDamage`/`drain` changes above (update the doc comments: "At rest the hit is fully negated…", "Burns are never negated; they only restart the rest count").
3. `CombatSystem.ts`: in `onPlayerTouched`, after the capsule gate add `const rested = this.run.rest.covered;` before `takeDamage`, and after it: `if (rested) { e.hit(0, this.player, 320); this.restForgive(); return; }` (keep the shove; skip `player.hurt`/`fx.playerHit`/`sfx.playerHurt`). In `onPlayerShot`: same `rested` capture; `if (rested) this.restForgive(); else { <the three original hurt lines> }`; `p.despawn()` stays after. Add after `onPlayerShot`: `/** A hit forgiven at rest: the low blip and a small flat ink ring — no hurt frame, no platemark, no shake. */ private restForgive(): void { this.fx.critRing(this.player.x, this.player.y); this.sfx.streakBreak(); }`
4. `BossSystem.ts`: apply the identical `rested` pattern in `onPlayerTouched` (capture after the `swatchHit = true` line, so a negated swatch is still consumed) and in the Grid arm-sweep `if` block (line ~383: wrap the hurt trio in the else branch). Add the same `restForgive()` private method beside `onPlayerTouched`.
5. `GameScene.ts`: `import { REST } from '../core/rest';` before the `RunState` import; in `update()` add `run.rest.tick(dt);` on the line after `run.timeSec += dt;`; in `registerInvariants()` after the `inkwell` invariant add `hook.addInvariant('rest', () => (this.run.rest.covered === (this.run.rest.since >= REST.windowSec) ? null : \`rest covered ${this.run.rest.covered} at ${this.run.rest.since} s of peace\`));`
6. `HudScene.ts`: field decls after `cropFlashed`: `private restText!: Phaser.GameObjects.Text; private lastRestNegations = 0; private restPopUntil = 0;`. In `create()`, insert between the `streakText` and `rhythmText` lines (so the flashes draw over REST): `this.restText = this.add.text(0, 0, 'REST', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(1, 0.5).setAlpha(0.7).setVisible(false);` and reset `lastRestNegations = 0; restPopUntil = 0;` beside `cropFlashed = false;`. In `update()` after the two `cropText` lines:
```ts
    if (run.rest.negations !== this.lastRestNegations) { // a hit was just forgiven
      this.lastRestNegations = run.rest.negations;
      this.restPopUntil = this.time.now + 150;
      this.tweens.killTweensOf(this.restText);
      this.restText.setScale(1.2);
      this.tweens.add({ targets: this.restText, scale: 1, duration: 150, ease: 'Sine.easeOut' });
    }
    this.restText.setPosition(width - PAD - this.streakText.width - 8, PAD + 60); // same slot as RHYTHM
    this.restText.setVisible(run.rest.covered || this.time.now < this.restPopUntil);
```
7. Create `tests/core/rest.test.ts`; run `npm run check`, then `npm run smoke`.

### Pitfalls
- The not-at-rest path must stay byte-identical: when `rested` is false the original line sequence (takeDamage → hurt → shove/fx/sfx → despawn) runs unchanged — do not reorder lines.
- No i-frames on a negated hit: do NOT call `player.hurt()` — the next contact applies normally, per spec.
- `covered` is consumed synchronously inside `takeDamage`, so a second hit the same frame sees `covered === false` — do not add a per-frame "used" flag.
- `tick()` is only called by GameScene, so unit tests that never tick see the old `takeDamage`/`drain` behavior: all existing tests (e.g. `streak.test.ts`) pass untouched.
- The HUD label must stay visible for 150 ms after the negation even though `covered` is already false (pop-out) — that's what `restPopUntil` is for; without it the pop tween runs on a hidden label.
- Reset `lastRestNegations`/`restPopUntil` in `HudScene.create()`: the scene instance survives stop/launch.
- Reuse `Sfx.streakBreak()` (the T0101 low blip, has its own 40 ms throttle) and `FxSystem.critRing()` (small ink ring) — no new SFX, emitter, key or scene.
- Parallel edits: run.ts (T0116/T0120/T0129), CombatSystem/BossSystem (T0120/T0129), GameScene (T0119/T0120), HudScene (T0124) — keep every hunk at the stated anchor line and don't reformat adjacent code.

### Tests
- `tests/core/rest.test.ts` (crop/gutter style): constant exposed; not covered at 29.9 s, covered at 30.0 s; any damage (burn or discrete) at any point restarts the count; a negated hit restarts exactly — not covered again at 29.999 s after it, covered at 30.0 s; burns are never negated and a burn on the rest-completing frame can never hold the rest (`negations` stays 0); of two discrete hits in one pass only the first is negated; a non-negated hit doesn't increment `negations`; RunState wiring: `takeDamage` at rest returns 0 with hp and streak intact, `drain` at rest still deals damage and restarts the count.

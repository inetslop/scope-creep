---
id: T0146
title: Second Wind — the last heart forgives once
assignee: desktop
size: M
priority: 2
status: todo
depends_on: [T0139, T0144]
attempts: 0
created: 2026-10-27T21:50:56Z
---

## Goal
The last heart is a moment, not an ending. The first time your HP falls to 1 or below in a run, the page forgives you the way Rest forgives the quiet: a one-time heal that turns the near-death into a comeback.

## Details
- A new run rule, owned by a **pure rule module in `src/core/`** (the rest/crop pattern) with unit tests: `SecondWindState` + constants, per run, not persisted.
- The rule: the moment the player's current HP, after any damage (enemy contact, enemy bullet, or a continuous burn — Gutter, Crop, Tide, The Press), falls to **1 or below** without killing, and the wind is unused in this run:
  - the wind is consumed (never again this run);
  - the player is healed by **25% of max HP**, rounded down, minimum 1 HP, capped at max HP.
- A hit that kills (HP to 0 or below) never triggers — the page forgives the near-death, not the death.
- At the trigger, once per run, at the player's position:
  - a flat **paper-light** (PALETTE.paperLight) ring growing ~8→24 u, fading over 300 ms (the first-light ring idiom, T0138, paperLight instead of ink) — the dark page brightens at you;
  - a small-caps **"SECOND WIND"** note in ink in the HUD, fading over 2 s (the nameplate idiom, T0064), laid out for 412×915 and 1280×720;
  - the existing low blip (T0101);
  - the level-up pulse swell (T0102) plays on your circle.
- It composes with everything and changes nothing else: a Rest (T0134) negation deals no damage so it never triggers; the Varnish coat (T0139) can still leave you at 1 after the halving and the trigger fires on the final HP; the low-HP vignette (T0141) stays on until you heal above 30%.
- No new key, scene, always-visible HUD element, marginalia, or change to stat, spawn, hazard, weapon, clock or music.
- The pure module exposes the trigger decision and heal amount given (used, currentHp, maxHp); unit tests lock: no trigger above 1 HP, trigger at exactly 1, trigger below 1 while alive (0.5), no trigger on a killing blow (hp ≤ 0), once per run (no second trigger even after dropping to 1 again), heal = max(1, floor(0.25 × maxHp)), the cap at max HP, and a fresh run unused.

## Acceptance criteria
- [ ] In a run, the first time your HP falls to 1 or below without dying, you are healed 25% of max HP (floor, min 1, capped at max); a paper-light ring pops at you, an ink small-caps "SECOND WIND" note prints for 2 s, the low blip plays, and your circle swells.
- [ ] A second fall to 1 HP later in the same run does nothing — no heal, no ring, no note, no sound.
- [ ] A hit that kills never triggers the wind.
- [ ] The trigger works from continuous burns (Gutter, Crop, Tide, The Press) as well as from discrete hits.
- [ ] A fresh run starts unused; nothing persists between runs; no new key, scene or always-visible HUD element.
- [ ] A pure rule module with unit tests (threshold, killing-blow exclusion, once-per-run, heal amount, cap); the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.

## Design (architect, desktop)

### Files
- create `src/core/secondWind.ts` - pure rule module (rest/crop pattern): `SecondWindState` + `SECOND_WIND` constants
- create `tests/core/secondWind.test.ts` - unit tests for the rule + RunState wiring
- edit `src/core/run.ts` - own the state; fire the check in `takeDamage()`/`drain()` after the HP subtraction
- edit `src/systems/FxSystem.ts` - paperLight `windRings` emitter + `windRing()`
- edit `src/scenes/GameScene.ts` - fire the juice on the trigger edge + register invariant
- edit `src/scenes/HudScene.ts` - "SECOND WIND" nameplate note fading 2 s

### Interfaces
```ts
// src/core/secondWind.ts
export const SECOND_WIND = { nearDeathAt: 1, healFraction: 0.25, minHeal: 1 } as const;
/** Fires when unused, the hit did not kill (hp > 0), and hp <= 1. */
export function windTriggers(used: boolean, currentHp: number, maxHp: number): boolean;
/** The heal: max(1, floor(0.25 * maxHp)), capped at maxHp. */
export function windHealAmount(maxHp: number): number;
export class SecondWindState {
  used: boolean;   // false in a fresh run; once true, never again
  triggers: number; // 0 or 1; edge-detected by GameScene and HudScene
  /** Call after any damage has landed, with the HP remaining. Consumes the wind and returns the heal amount, or 0. */
  nearDeath(currentHp: number, maxHp: number): number;
}
```
`nearDeath` body: `if (!windTriggers(this.used, currentHp, maxHp)) return 0; this.used = true; this.triggers += 1; return windHealAmount(maxHp);`

### Steps
1. Create `src/core/secondWind.ts` with the interface above (JSDoc header modeled on `core/rest.ts`).
2. `run.ts`: add `import { SecondWindState } from './secondWind';` between the `./rng` and `./stats` imports; add after the `readonly rest` field (line 37): `/** Second Wind (core/secondWind.ts): the first non-lethal fall to 1 HP or below heals 25% of max HP; once per run. */` + `readonly secondWind = new SecondWindState();`. In `takeDamage()` insert before `return dealt;`: `const windHeal = this.secondWind.nearDeath(this.hp, this.stats.maxHp); // the last heart forgives once` / `if (windHeal > 0) this.heal(windHeal);`. In `drain()` insert the same two lines inside `if (dealt > 0) {` after `this.rest.burn();`. Use `this.heal()` (not manual clamp) so the max-HP cap holds.
3. `FxSystem.ts`: field after `restRings` (line 32): `private readonly windRings: Phaser.GameObjects.Particles.ParticleEmitter;`. In the constructor after the `restRings` emitter, a copy of the `firstLightRings` config (`lifespan: 300`, `scale: { start: 0.29, end: 0.86 }`, `alpha: { start: 1, end: 0 }`) but `tint: PALETTE.paperLight`. Add `this.windRings` after `this.restRings` in the depth loop (line 111). Method after `restRing()`: `windRing(x: number, y: number): void { this.windRings.explode(1, x, y); }` with a JSDoc (Second Wind: the paperLight ring; the dark page brightens at you).
4. `GameScene.ts`: `import { SECOND_WIND } from '../core/secondWind';`; field `private lastWindTriggers = 0;` next to `warmStartName`; `this.lastWindTriggers = 0;` in `create()` next to `this.ending = false;`. In `update()` directly after the rest-ring line (180): `if (run.secondWind.triggers !== this.lastWindTriggers) { // the last heart forgave once (core/secondWind.ts)` / `this.lastWindTriggers = run.secondWind.triggers;` / `this.fx.windRing(this.player.x, this.player.y);` / `this.player.pulse(); // the level-up pulse swell (T0102)` / `this.sfx.streakBreak(); // the low blip (T0101)` / `}`. In `registerInvariants()` after the `'rest'` invariant (line 471): `hook.addInvariant('second-wind', () => { const w = this.run.secondWind; if (w.triggers !== (w.used ? 1 : 0)) return \`second wind triggers ${w.triggers} but used ${w.used}\`; if (!w.used && !this.run.isDead && this.run.hp <= SECOND_WIND.nearDeathAt) return \`second wind unused at hp ${this.run.hp}\`; return null; });`
5. `HudScene.ts`: fields `private windNote!: Phaser.GameObjects.Text;` `private windNoteUntil = 0;` `private lastWindTriggers = 0;`. In `create()` after the `inkNote` line: `this.windNote = this.add.text(0, 0, 'SECOND WIND', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0).setVisible(false);` and in the reset block: `this.windNoteUntil = 0; this.lastWindTriggers = 0;`. In `update()` after the rest block (line 261): `if (run.secondWind.triggers !== this.lastWindTriggers) { this.lastWindTriggers = run.secondWind.triggers; this.windNoteUntil = this.time.now + 2000; }` / `if (this.time.now < this.windNoteUntil) { const p = this.bossPlatePos(width); this.windNote.setPosition(p.x, p.y); this.windNote.setAlpha((this.windNoteUntil - this.time.now) / 2000).setVisible(true); }` / `else if (this.windNote.visible) this.windNote.setVisible(false);` — the nameplate slot: (640, 80) at 1280×720, (206, 120) at 412×915; hidden otherwise, not an always-visible element.
6. Write `tests/core/secondWind.test.ts` (see Tests).
7. Run `npm run check`, then `npm run smoke`; both must pass.

### Pitfalls
- Fire the rule only after the HP subtraction, inside `takeDamage()`/`drain()`: every damage path (contact, bullets, Crop/Gutter/The Press burns, and Tide T0127 later) funnels through these two methods; checking at call sites would miss burns.
- A killing blow (hp <= 0) must NOT set `used` — `windTriggers` requires `currentHp > 0`; the clamp to 0 in both methods makes "killing" exactly `hp === 0`.
- T0139 (Varnish, in progress) also edits `takeDamage()` — build on the merged version; the after-subtraction position is what makes the trigger fire on the final HP after the halving.
- Add `windRings` to the depth loop or it renders at depth 0, under the arena walls.
- HudScene's instance survives stop/launch, so reset `lastWindTriggers`/`windNoteUntil` in `create()`; no new GAME_EVENT (the counter edge suffices); no tweens on `windNote` (manual alpha, inkNote idiom) so nothing to clean up on shutdown.
- `GameScene.update`, `registerInvariants` and `HudScene.create/update` are hot files for open tasks (T0124/T0127/T0142): keep each addition exactly in the region named above — no reordering, no appending at function ends.

### Tests
- `tests/core/secondWind.test.ts` (vitest, style of `tests/core/rest.test.ts`): constants; `windTriggers` — false above 1 (1.5), true at exactly 1, true below 1 while alive (0.5), false on a killing blow (0), false when used; `windHealAmount` = max(1, floor(0.25×maxHp)) at maxHp 1, 3, 7, 9, 100, 103 and always ≤ maxHp (the cap); `SecondWindState` fresh unused, triggers at ≤1 while alive, no second trigger after dropping to 0.5 again, killing blow leaves `used` false.
- RunState wiring describe block (as in `rest.test.ts`): fresh run unused; `takeDamage(99)` at maxHp 100 → hp 26 and used; `takeDamage(99.5)` → hp 25.5; `takeDamage(100)` → hp 0, unused; `drain(99.6)` → hp 25.4 (burns trigger too); after the wind, draining down to 1 does not re-trigger; a rest-negated hit never triggers; post-trigger hp never exceeds maxHp.

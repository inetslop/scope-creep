---
id: T0463
title: "The reserve and its first card, the surge: the next wave's towers attack 50% faster"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T02:24:38Z
epic: E24
design_attempts: 1
---

## Goal
The run's gold buys the shape of the next wave: the build phase gains the reserve — the surge is a 60-gold once-per-run buy that makes the next wave's towers attack 50% faster. The first of the three heavy cards (E24): the run's big economy call — the next tower slot, or the next wave's tempo.

## Details
- The reserve card: a new white card in the top-left stack, under the level chips (under the stats card when the run has no level chips), the stats card's own width (196 px); it appears with the build phase's HUD and is gone in the wave and draft phases. For now it holds one entry: the bold line **Surge · 60** (13 px name, the price with the coin glyph, the stats card's coin icon; the line is the tap target) and under it one muted one-liner, the iron card's subline pattern (T0406): "the next wave's towers +50% faster — once per run".
- The buy: 60 gold, once per run — a per-run flag the run save carries (the first pass's pattern, T0433). On a tap with 60+ gold: the gold drops with the gold pop's look and one small muted coin blip at the card (the Toll leak pay's blip class, T0255), and the line flips to **Surge · used** — muted, dimmed, untappable; the one-liner stays. Under 60 gold the line dims and the price goes red (the pattern E15's move line wears, T0394) and the tap does nothing. A resumed run keeps the bought state.
- The effect: the wave that starts next — sent by the countdown or early — has every tower attack 50% faster for the whole wave. The +50% adds to the tower's attack-speed total the way Haste's +30% does: a tower inside a Haste ring during the surged wave attacks 1.8× as fast (a Common Bolt, 1.6/s, fires at 2.4/s for that wave). Every attack cycle is sped — shots, pulses, gusts, roots, marks; the beam is a continuous line and its per-second damage is untouched. When the wave ends the effect ends; the wave after is normal.
- The chip: while the surged wave runs, the wave card wears a muted "surged" chip under the wave number, the WaveCard's own chip look (the "held · N" chip still lands after a wave that lost lives). It is gone by the next build phase.
- The pause screen's controls list names the reserve card one line, the way the speed and zoom controls are listed.
- Nothing else changes: the draft, the waves, the hand, the tower panel, the claim card (its "reserve" line is a later slice of E24), the board.
- It fits 412x915 and 1280x720: one entry is the bold line plus the one-liner (~48 px tall); nothing overlaps the stats card, the level chips or the next-wave preview.

## Acceptance criteria
- [ ] Every build phase of a run shows the reserve card under the level chips with the "Surge · 60" line and its muted one-liner; it is gone in the wave and draft phases.
- [ ] A tap with 60+ gold pays 60 (the gold pop, one coin blip), the line reads "Surge · used" dimmed, and the surge is never buyable again in the run — including a resumed run.
- [ ] With under 60 gold the line is dimmed with a red price and the tap does nothing.
- [ ] The next wave, sent by the countdown or early, has every tower attacking 50% faster for its whole duration — a Common Bolt fires at 2.4/s, a tower in a Haste ring at 1.8×, a beam's per-second unchanged — and the wave after is normal again.
- [ ] During the surged wave the wave card wears the muted "surged" chip under its number, gone by the next build phase; a held wave still lands its "held · N" chip after.
- [ ] The pause's controls list names the reserve card.
- [ ] At 412x915 and 1280x720 the card fits the top-left stack without overlapping another element.

## Design (architect, cachyos-x8664)

### Files
- **CREATE `src/core/surge.ts`** — pure: `surgeRateMul(rallyRateMul, hasteRatePct, surged)`.
- **CREATE `src/ui/hud/ReserveCard.ts`** — the new HUD part (196px card, tappable "Surge · 60" line, muted one-liner, the buy VFX).
- **CREATE `tests/core/surge.test.ts`** — unit tests for `surgeRateMul`.
- **EDIT `src/config.ts`** — `export const SURGE = { price: 60, ratePct: 0.5 } as const;`.
- **EDIT `src/core/run.ts`** — RunState `surgedWave = 0` field + `buySurge(): boolean` (spends SURGE.price, sets `surgedWave = wave + 1`).
- **EDIT `src/core/saveRun.ts`** — `SavedRun.surgedWave: number` + a parse guard (`inInt(p.surgedWave, 0, 1e6)`).
- **EDIT `src/systems/RunSave.ts`** — persist `surgedWave: run.surgedWave` + restore `run.surgedWave = saved.surgedWave`.
- **EDIT `src/systems/TowerSystem.ts`** — before the tower loop compute `const surged = this.run.surgedWave === this.run.wave;`; change line 117 to `t.cooldown += 1 / (t.spec.rate * surgeRateMul(t.rallyRateMul, t.hasteRatePct, surged));`.
- **EDIT `src/ui/hud/LevelChips.ts`** — in `place()` set `registry.set('levelChipsBottom', <block bottom edge, or statsCardBottom when no chips>)`.
- **EDIT `src/scenes/HudScene.ts`** — `new ReserveCard(this, game)` in the parts list (after `LevelChips`).
- **EDIT `src/ui/hud/WaveCard.ts`** — a muted "surged" chip (its own chip look: muted rounded-rect + bold `label`, like the held chip) under the wave number, shown while `run.surgedWave === run.wave`, gone by the next build; the `held · N` chip is untouched (both can coexist; card grows to fit both).
- **EDIT `src/scenes/PauseScene.ts`** — one line in `CONTROLS`: `'Surge — the reserve card, build phase only: +50% tower attack speed for the next wave, once'`.
- **EDIT `src/debug/runChecks.ts`** — `['run.surge', (g) => (g.run.surgedWave >= 0 && g.run.surgedWave <= g.run.wave + 1 ? null : 'surged wave ' + g.run.surgedWave)]`.

### Interfaces
- `// core/surge.ts`
  ```ts
  import { SURGE } from '../config';
  /** The additive attack-speed share for the surged wave, folded into Tower's rally+haste total. */
  export function surgeRateMul(rallyRateMul: number, hasteRatePct: number, surged: boolean): number {
    return rallyRateMul + hasteRatePct + (surged ? SURGE.ratePct : 0);
  }
  ```
- `// core/run.ts`
  ```ts
  /** The run's one surged wave: 0 until bought, then the next wave's number. */
  surgedWave: number = 0;
  /** Buys the one surge (spend + mark the next wave). False when already used or the gold is short. */
  buySurge(): boolean {
    if (this.surgedWave !== 0 || !this.spend(SURGE.price)) return false;
    this.surgedWave = this.wave + 1;
    return true;
  }
  ```
- `// ui/hud/ReserveCard.ts`
  ```ts
  export class ReserveCard implements HudPart {
    constructor(scene: Phaser.Scene, game: GameScene);
    layout(width: number, height: number): void;
    update(game: GameScene): void;
  }
  ```
  Build once in the constructor (a 196×48 `makeCard`, the tappable line = an interactive container holding the `COIN_TEXTURE` coin icon + "Surge" + "· 60", a muted one-liner below; `box = container([card, line, oneLine])`).

### Steps
1. `config.ts`: add the `SURGE` const (price 60, ratePct 0.5).
2. `core/surge.ts`: `surgeRateMul` (add SURGE.ratePct to the rally+haste sum when `surged`).
3. `core/run.ts`: add `surgedWave = 0` + `buySurge()`.
4. `core/saveRun.ts`: add `surgedWave: number` to `SavedRun` and `inInt(p.surgedWave, 0, 1e6)` in `loadSavedRun`.
5. `systems/RunSave.ts`: persist `surgedWave: run.surgedWave`; restore `run.surgedWave = saved.surgedWave`.
6. `systems/TowerSystem.ts`: compute `surged = run.surgedWave === run.wave` once in `update()` before the tower loop; fold it into the rate at line 117 (import `surgeRateMul`).
7. `ui/hud/LevelChips.ts`: in `place()` set the `levelChipsBottom` registry (block bottom when chips exist, else `statsCardBottom`).
8. `ui/hud/ReserveCard.ts`: constructor builds the card + line + one-liner (see below). `layout()`: `top = registry.get('levelChipsBottom') ?? TOP` (12+72+GAP from LevelChips); `box.setPosition(EDGE + 196/2, top + GAP + 48/2)`. `update()`: `show = game.run.phase === 'build'`; `box.setVisible(show)`; when shown — if `used = run.surgedWave !== 0` hide coin + set "used" (muted) + dim line (alpha 0.6) + disable; else if `affordable = run.canAfford(SURGE.price)` price ink + full; else dim + price red + disable; re-read `levelChipsBottom` and re-position the box (it follows the bank line). Tap (pointerup on the line, `stopPropagation`): `if (this.game.run.buySurge())` play the VFX — a muted "−60" text rising off the card's coin icon + the coin-icon scale pop (1.15/150 ms) + `getSfx(this.scene)?.coinBlip()` (model it on `StatsCard.popGold` + `tollLeak`'s blip).
9. `scenes/HudScene.ts`: add `new ReserveCard(this, game)` after `LevelChips`.
10. `ui/hud/WaveCard.ts`: the "surged" chip, shown while `run.surgedWave === run.wave` (cleared by the next build), built/cleared in the same `wear()` path as the held chip.
11. `scenes/PauseScene.ts`: add the one `CONTROLS` line.
12. `debug/runChecks.ts`: add the `run.surge` invariant.

### Pitfalls
- `run.surgedWave` is the wave's *number*, not a bool: 0 = never bought, `run.wave + 1` when bought in build, `run.wave` when that wave runs. "is this wave surged" is `run.surgedWave === run.wave` (works even when a resumed run rewinds into the wave). "already used" is `run.surgedWave !== 0`.
- Beams (`t.spec.kind === 'beam'`) never reach line 117 (they're excluded at line 109), so their per-second is untouched — do not special-case them.
- The line must not be a raw pointerdown handler (board drag/pinch would fire it): an interactive container + `stopPropagation` on pointerup, and disable by not firing, not by hiding.
- `levelChipsBottom` can move mid-run (the stats card's bank line grows/shrinks): re-read it in `update()` and re-position, like LevelChips follows it.
- The reserve card is hidden (not destroyed) in wave/draft/over — `box.setVisible`, so it keeps its layout.
- Verify the top-left stack fits 412×915 and 1280×720: one chip row + the ~48px card under it.

### Tests
- `tests/core/surge.test.ts`: `surgeRateMul(1, 0, true) === 1.5` (1.6/s → 2.4/s), `surgeRateMul(1, 0.3, true) === 1.8` (Haste ring, 1.8×), `surgeRateMul(1, 0.3, false) === 1.3` (no surge).
- `npm run check` and `npm run smoke` pass.

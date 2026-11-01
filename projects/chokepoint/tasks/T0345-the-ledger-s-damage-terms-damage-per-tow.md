---
id: T0345
title: "The ledger's damage terms: damage per tower on the Summary's rows"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T07:03:24Z
claimed_at: 2026-11-01T08:06:36Z
epic: E12
---

## Goal
The pause's Summary page (T0306's run page) shows each standing tower's kills and ≈N/s — but kills only count the finishing blow, so a tower that does the work and not the kill (an Ember that burns, a Mark that marks) reads smaller than it is. The run ledger records the damage each tower deals, and the row shows it.

## Details
- The run ledger grows a per-tower damage tally next to the existing per-tower kills, with the same lifecycle as the kills term (a new run starts at 0; a resumed run does to it exactly what a resume does to the row's kills term).
- Attribution: every point of damage counts for the tower that dealt it, as it was dealt (not clamped to the enemy's remaining hp) and after the Bulwark's plate and the Titan's shield halving, so a halved hit counts halved:
  - a Bolt's hit, a Splash's burst, a Spray's pellet (a crit counts the doubled amount), a Reach's heavy shot and a Lance's pierce each count for the firing tower, per enemy struck;
  - a Beam's tick counts for the Beam tower; an Ember's burn tick counts for the tower that ignited.
  - A support that deals no damage (a Mark, a Mint, a Rally, an Anchor or a Push) reads 0, exactly like its kills line — a Mark's +25% is not damage it dealt.
- The Summary's per-tower rows (the page's existing rows, kept sorted by kills as they are) gain one muted damage term — the damage dealt this run, a plain integer in the row's existing style, placed wherever the row's layout fits it at 412x915 and 1280x720 with a five-digit number (a "· dmg N" on the kills line, or its own line under the row); the kills and ≈N/s reads stay where they are.
- The end card's and the claim card's by-tower chips are unchanged (their space); no new HUD element, no sound.

## Acceptance criteria
- [ ] The pause's Summary shows each standing tower's damage dealt this run as a muted term on its row, beside the existing kills and ≈N/s reads; an Ember tower shows the damage its burn ticks dealt even when another tower takes the kill.
- [ ] A support tower (a Mark, a Mint, a Rally, an Anchor or a Push) reads 0 on its damage term, like its kills line.
- [ ] The term is written as the run goes: pausing mid-run shows what has been dealt so far, and the term has the same lifecycle as the row's kills term across new and resumed runs.
- [ ] A halved hit (a Bulwark's plate, a shielded Titan) counts halved; a crit pellet counts the doubled amount.
- [ ] The end card's and the claim card's by-tower chips are unchanged; nothing else on screen changes; the rows fit both layout widths with a five-digit number.

## Design (architect, desktop)

### Files
- edit `src/entities/Tower.ts` - one new public number field `damageDealt` next to `kills`
- edit `src/systems/EnemySystem.ts` - add `shieldMul` import; tally dealt damage into `payload.source.damageDealt` in the three places where damage is applied: `strike()`, `beamTick()`, `tickBurn()`
- edit `src/scenes/SummaryScene.ts` - the by-tower rows gain one muted `dmg N` line under the ≈N/s line
- edit `src/debug/runChecks.ts` - one cheap invariant next to the other `towers.*` ones

### Interfaces
```ts
// Tower.ts — public field, declared right after `kills = 0;` (line 56)
/** Damage this tower dealt with its own damage this run, as it landed (the summary's "dmg N" line). */
damageDealt = 0;
```
No other type changes. It is NOT added to `SavedRun`/`SavedTower` in `core/saveRun.ts` — exactly like `kills`, it resets to 0 when a run is resumed, and a new run starts at 0.

### Steps
1. `src/entities/Tower.ts`: after line 56 (`kills = 0;`) add the `damageDealt = 0;` field above.
2. `src/systems/EnemySystem.ts`:
   - Add `import { shieldMul } from '../core/shield';` directly under the existing `import { plateMul } from '../core/plate';` (line 12).
   - In `strike()` (line ~210), inside `if (payload.damage > 0)`, between `if (crit) critChip(...)` and `if (e.hit(damage)) {...}` add:
     `payload.source.damageDealt += damage * shieldMul(e.def, e.shielded); // the ledger's damage term: as dealt, halved by the shield like the hit`
     (`damage` there already includes the plate halving and the crit doubling.)
   - In `beamTick()` (line ~133), between `if (crit) critChip(...)` and `if (target.hit(dealt, false)) ...` add:
     `source.damageDealt += dealt * shieldMul(target.def, target.shielded); // the ledger's damage term, halved by the shield like the tick`
   - In `tickBurn()` (line ~120), inside the `for (const damage of burnStep(...))` loop, between `if (crit) critChip(...)` and `if (e.hit(dealt, false)) ...` add:
     `if (e.burnSource) e.burnSource.damageDealt += dealt * shieldMul(e.def, e.shielded); // the igniter's damage term, halved by the shield like the tick`
   These three functions are where every damage path lands: shots/splash/pellets/pierce/pulse through `strike()` (via `ProjectileSystem` and `TowerSystem`'s strike callback), beam line/ray/Lance-pierce/scorch ticks through `beamTick()`, Ember burn ticks through `tickBurn()`. Supports (Mark, Mint, Rally, Anchor, Push) build payloads with `damage: 0`, so the `payload.damage > 0` guard keeps them at 0.
3. `src/scenes/SummaryScene.ts`:
   - Line 75: `const ENTRY_H = CHIP_H + 4 + LINE_H;` → `const ENTRY_H = CHIP_H + 4 + LINE_H + 4 + LINE_H;` and update the comment to: `// the chip, the ≈N/s line and the dmg line under it, each with its 4 px gap`. The panel-height formula at line 139 uses `ENTRY_H`, so it picks this up automatically.
   - Line 99: add the damage to the entry map: `.map((t) => ({ first: t.augments[0]?.id, tier: t.augments[0]?.tier, kills: t.kills, damage: Math.floor(t.damageDealt), perSec: Math.floor(towerDps(t.spec, t.rallyRateMul)) }))`. Keep the sort exactly as is (kills, then name).
   - In the `entries.forEach` row loop (line ~224), right after the `if (t.perSec >= 1) parts.push(this.add.text(x, rowTop + CHIP_H + 4 + LINE_H / 2, ...))` line, add (always pushed, even at 0):
     `parts.push(this.add.text(x, rowTop + CHIP_H + 4 + LINE_H + 4 + LINE_H / 2, `dmg ${t.damage}`, textStyle(11, PALETTE.muted)).setOrigin(0.5));`
     with the comment `// Its damage term, always shown: a support that deals none reads 0, like its kills line.`
4. `src/debug/runChecks.ts`: in `INVARIANTS`, after the `towers.crit` entry (line ~79-82) add:
   ```ts
   ['towers.damageLedger', (g) => {
     for (const t of g.towers.towers) if (!Number.isFinite(t.damageDealt) || t.damageDealt < 0) return `damage dealt ${t.damageDealt} at (${t.cell.col}, ${t.cell.row})`;
     return null;
   }],
   ```

### Pitfalls
- Do not persist `damageDealt` in `core/saveRun.ts`/`systems/RunSave.ts` and do not restore it: resume must zero it, exactly as it does `Tower.kills` today (towers are rebuilt with defaults).
- Add the computed `damage`/`dealt`, never the amount `e.hit()` consumed — hp clamping must not shrink the tally, and Mark's `markPct` amplification (applied inside `Enemy.hit`) is not damage the tower dealt.
- Crit: use the post-crit value (`damage`, `dealt`), so a crit pellet/burn tick counts doubled.
- Burn ticks: guard on `e.burnSource` before crediting (mirror the existing `crit` guard in the same loop); a burn whose source overtook is credited to the live igniter, matching `kill()`'s `e.burnSource`.
- `damageDealt` can be fractional (beam ticks, plate 0.5) — keep the field a float, floor only at the Summary's display.
- The damage line is a fixed third slot in every row (uniform `ENTRY_H`); do not conditionally stack it under the ≈N/s line's absence, and do not move the kills (`×N`) or ≈N/s reads. "dmg 12345" at 11px is ~60 px wide: it fits the 340 px card at 412x915 (scale 1) and the card's whole-card scale-down at 1280x720.
- Do not touch `ui/byTower.ts` or the `towerKills` registry line in `systems/RunFlow.ts:188`: the end card's and claim card's chips stay kills-only.

### Tests
none (no `src/core` rule changes; the tallying lives in `EnemySystem`, which the project does not unit-test).

---
id: T0361
title: "Herd: the augment that grows with the crowd"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T13:25:34Z
design_attempts: 1
---

## Goal
A new support augment — Herd, Rare or Epic — whose buff grows with the number of enemies inside its 2-cell ring: the first augment that scales with how crowded the board is. A cluster built around a Herd tower hits harder on exactly the waves that pack the road (tight, rush, a boss's escort) and eases off when the wave thins. Its registration retires Anchor to keep the draft at 16.

## Card lines
Herd is `minTier: rare` (Rare or Epic, never Common) and not `opening` (never in the first draft).
- asTower (Rare): "Towers within 2 cells deal +5% damage per enemy within 2 cells, up to 5. Does not attack itself."
- asTower (Epic): "Towers within 2 cells deal +8% damage per enemy within 2 cells, up to 5. Does not attack itself."
- asAdded (Rare): "This tower deals +5% damage per enemy within 2 cells, up to 5. Each extra Herd +5% per enemy."
- asAdded (Epic): "This tower deals +8% damage per enemy within 2 cells, up to 5. Each extra Herd +8% per enemy."

## Details
- **The feed (every copy, host-local, live per frame like Haste):** every Herd copy in a tower T makes T's own damage × (1 + per-enemy amount × min(enemies in T's 2-cell ring, 5)), per-enemy amount the copy's own tier (Rare 5%, Epic 8%), one per copy (two copies on T → +10%/+16% per enemy). Ring reach is the 2-cell circle, center inside the ring (the Rally/Mint reach, T0050's fix). With no enemy in the ring the feed is 0: the tower hits at its plain damage.
- **The aura (first form only):** when Herd is the tower's first augment, the same feed applies to every other tower in the Herd tower's ring, with the crowd read from the Herd tower's ring (per-enemy amount the Herd tower's first Herd's tier). The Herd tower's own feed is a no-op for it (it never attacks — the Haste pattern: a support whose own included buff has nothing to buff).
- **Stacking and growth:** a tower's own Herd copies and the auras around it add (each read caps at 5 independently). Reach on any tower with a Herd copy grows its ring the way it grows a Rally's (T0103). As with a Rally stacked on a Rally, a second Herd in a Herd tower's free slot does nothing (the feed has no damage to feed) — the copy belongs in an attack tower.
- **What the feed applies to:** the fed tower's own attack damage — shots (Bolt, Lance, Rapid, Reach), Spray's pellets (a crit's double applies to the buffed base), Splash's blast, Beam's per-second, and the fed tower's own Ember burn ticks (a burn is that tower's damage, as on the DPS line, T0084). Not buffed: 0-damage supports (Frost, Push, Anchor, Mint, Toll, Mark, Rally, Haste, Herd — a percent of 0; the stated acceptable no-op, the what-if's marker still shows what the card would do on an attack tower), and kill-spawned secondaries (a jumped burn T0059, beam-kill needles T0242, traps T0062). Stacks with Mark's mark (the mark multiplies the buffed damage — it "takes more damage from everything").
- **Look:** icon a green hexagon, size 0.22 — a shape-and-color pair no other augment uses. On the tower: no barrel (a support, like Rally and Mint); a thin green ring at the plinth with five tick marks around it, one tick lit green per enemy in the ring (cap 5), a tick clearing the instant its enemy leaves, and the ring's quiet working-aura shimmer in its own green (T0055's ring, T0354's live pattern: on while at least one tick is lit, gone when the ring is empty). The what-if (T0096) shows a compact marker for a held Herd following the existing per-augment marker vocabulary.
- **Registration and the 16 cap:** the draft index caps at 16 (the E4 protocol). When Herd registers, if the index is over 16, remove **Anchor** — the fifth removal, after E4's four (Frost, Rally, Mint, Mark, canonical in T0064); order-independent, since none of the four names Anchor. Anchor's removal: the draft no longer offers it, the codex (T0221) drops its card (its render reads the index — no new UI), and a tower that already holds an Anchor keeps it and works exactly as before (pulse and hits-root). The first-draft floor (T0048), the tier odds (T0011) and the no-repeat rule (T0052) are unchanged: Herd offers when the roll lands Rare or Epic with the normal index share.
- **No new key, button or HUD element;** the pause's controls list is untouched. The panel's existing lines carry it (the card lines state both forms; the ticks on the tower show the live count — no new readout, nothing shown twice).
- The work lives in new files: the augment's content file (beside `src/content/augments/`) and the aura's system (a new systems file beside `RallySystem`/`HasteSystem` for the live per-frame reads); registrations, the tower look and the what-if marker follow the existing augment pattern.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Rally | `kind rally`: a support that buffs towers within 2 cells | Rally's +10% attack speed is flat: it does not change while the wave passes. Herd's damage bonus rises and falls with the enemies in the ring — the same cluster is a different tower on a tight wave than on a quiet one |
| Haste | `kind rally`: a support that buffs towers within 2 cells (and the enemies) | Haste's buff is flat per copy and acts on speed; Herd's is driven by the crowd and acts on damage |
| Momentum | named similar: a damage buff for towers | Momentum's +5% is run-wide, permanent and driven by clean waves; Herd's is local (its ring), live (with the crowd) and only for the towers in and around it |
| Mark | named similar: amplifies damage | Mark marks one enemy (the furthest) to take +25% from all towers; Herd buffs the fed towers' own output and scales with how many enemies are in the ring — no mark, no single target |

## Acceptance criteria
- [ ] The draft offers Herd as a Rare or Epic card, never Common, and never in the first draft; the card, hand, tower panel and codex show its green hexagon and its tier's card lines.
- [ ] A Herd tower shows the five-tick green ring at its plinth: one tick lights per enemy inside its 2-cell ring, clears the instant its enemy leaves, and the working-aura shimmer (T0055/T0354) is on while at least one tick is lit and off when the ring is empty.
- [ ] A tower inside a Herd ring deals its plain damage × (1 + per-enemy amount × min(enemies in the Herd ring, 5)); with no enemy in the ring it deals its plain damage; a tower's own Herd copies and the auras around it add.
- [ ] A Herd copy in a later slot of an attack tower feeds that tower on the crowd around itself; on a 0-damage support tower an added Herd changes nothing (the stated no-op).
- [ ] The feed multiplies the fed tower's own damage: shots, pellets (crits double the buffed base), blasts, beam per-second and its own burn ticks; 0-damage supports, a jumped burn, beam-kill needles and traps are not buffed; a marked enemy takes the mark on top of the buff; Reach on a Herd-fed tower grows its ring.
- [ ] On registration, if the index is over 16, Anchor is removed from the draft index and the codex; a tower that already has an Anchor keeps it and works as before; the four E4 removals (Frost, Rally, Mint, Mark) are untouched.
- [ ] The game is playable menu to game over with a Herd card in the draft, on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/content/augments/herd.ts` — the Herd `AugmentDef` (green hexagon, minTier rare, `kind: 'rally'`, no `opening`, no `tech`)
- create `src/systems/HerdSystem.ts` — per-frame crowd reads → `herdDamageMul` per tower, relights each Herd ring
- create `tests/core/herd.test.ts` — unit tests (see Tests)
- edit `src/content/types.ts` — 3 fields: `FirstForm.herd`, `AddedForm.herd`, `TierValues.herdPerEnemy` (each next to the `haste` entry)
- edit `src/core/tiers.ts` — `tierFirst`/`tierAdded` carry the tier's `herdPerEnemy`
- edit `src/core/augments.ts` — import `herd`; 3 `TowerSpec` fields (+ `EMPTY` + spec literal, after `hasteCount`); accumulation loop after the haste loop; two `describeSpec` lines
- edit `src/content/augments/index.ts` — `herd,` after `haste,` in `AUGMENTS`; `anchor` removed from `AUGMENTS`; new `RETIRED`/`KNOWN_AUGMENTS`
- edit `src/core/saveRun.ts`, `src/debug/runChecks.ts`, `src/art/icons.ts`, `src/art/entities.ts` — accept/paint `KNOWN_AUGMENTS` (retired Anchor stays resolvable)
- edit `src/entities/Tower.ts`, `src/entities/towerLook.ts` — `herdRing` graphics + `drawHerdRing()`
- edit `src/systems/TowerSystem.ts`, `src/systems/BeamSystem.ts`, `src/systems/attacks/pulse.ts`, `src/systems/EnemySystem.ts` — apply `herdDamageMul` to the fed damage
- edit `src/systems/towerGhost.ts` — Herd what-if marker
- edit `src/scenes/GameScene.ts` — wire `HerdSystem` (4 one-line changes)
- edit `src/scenes/DraftScene.ts` — 2×2 grid when a card's lines are too long for the phone column
- edit `tests/content.test.ts`, `tests/core/augments.test.ts`, `tests/core/anchor.test.ts` — see Tests

### Interfaces
```ts
// content/types.ts (exact additions)
FirstForm.herd?: { perEnemy: number }        // "The feed's per-enemy damage fraction per enemy in the 2-cell ring, cap 5 (Herd first)."
AddedForm.herd?: { perEnemy: number }        // "…added by this copy, per enemy in the tower's own ring, cap 5 (Herd)."
TierValues.herdPerEnemy?: number             // "Replaces this copy's per-enemy feed fraction in both forms (Herd)."
// core/tiers.ts — add to the non-common returns:
//   tierFirst:  herd: f.herd ? { perEnemy: t.herdPerEnemy ?? f.herd.perEnemy } : undefined,
//   tierAdded:  herd: a.herd ? { perEnemy: t.herdPerEnemy ?? a.herd.perEnemy } : undefined,
// core/augments.ts — TowerSpec, after hasteCount:
herdPct: number; herdFirstPct: number; herdCount: number   // EMPTY/literal: 0,0,0
// core/augments.ts — after the haste loop:
let nothing; for (let i = 0; i < augments.length; i++) { const c = augments[i]!; const a = getAugment(c.id);
  if (a.id !== herd.id) continue;
  const pct = i === 0 ? tierFirst(a, c.tier).herd?.perEnemy ?? 0 : tierAdded(a, c.tier).herd?.perEnemy ?? 0;
  if (i === 0) spec.herdFirstPct = pct; spec.herdPct += pct; spec.herdCount += 1; }
// content/augments/index.ts:
export const KNOWN_AUGMENTS: readonly AugmentDef[] = [...AUGMENTS, ...RETIRED]; // RETIRED = [anchor]; byId = new Map(KNOWN_AUGMENTS.map(...))
// entities/towerLook.ts:
export function drawHerdRing(g: Phaser.GameObjects.Graphics, spec: TowerSpec, lit: number): void
// entities/Tower.ts: herdRing: Phaser.GameObjects.Graphics | undefined;  herdDamageMul = 1;
// systems/HerdSystem.ts: export class HerdSystem { constructor(towers: TowerSystem, enemies: EnemySystem); update(_dt: number): void }
```

### Steps
1. `herd.ts`: `id 'herd'`, `name 'Herd'`, `look: { shape: 'hexagon', color: 'green', size: 0.22 }`, `first: { kind: 'rally', damage: 0, range: 2, rate: 1, herd: { perEnemy: 0.05 } }`, `added: { herd: { perEnemy: 0.05 } }`, `minTier: 'rare'`, `tiers.rare = { herdPerEnemy: 0.05, asTower: 'Towers within 2 cells deal +5% damage per enemy within 2 cells, up to 5. Does not attack itself.', asAdded: 'This tower deals +5% damage per enemy within 2 cells, up to 5. Each extra Herd +5% per enemy.' }`, `tiers.epic = { herdPerEnemy: 0.08, asTower: '…deal +8% damage…', asAdded: '…+8% damage…' }` (epic lines identical but +8%). Base `asTower: 'Towers in its ring deal +5% damage per enemy in it, up to 5.'`, base `asAdded: 'This tower deals +5% damage per enemy in its ring, up to 5.'` (base lines never show — no Common — and must stay ≤70 chars).
2. `types.ts` + `tiers.ts` per Interfaces.
3. `core/augments.ts`: import `herd` beside the `haste` import; spec fields; accumulation loop; in `describeSpec`'s `kind === 'rally'` branch add `spec.firstId === herd.id ? \`Towers within ${reach} cells deal ${Math.round(spec.herdFirstPct*100)}% more damage per enemy in the ring, up to 5\` :` before the Rally line, and after the haste trailing line add: `if (spec.herdCount > 0 && spec.firstId !== herd.id) line += \`, and deals ${Math.round(spec.herdPct*100)}% more damage per enemy within ${reach} cells (up to 5)\`;` (compute `reach` as the haste block does).
4. `index.ts`: `herd,` after `haste,`; delete `anchor,`; `const RETIRED: readonly AugmentDef[] = [anchor];` + `KNOWN_AUGMENTS` + `byId` over it. Then the four sites: `saveRun.ts:83` and `runChecks.ts` `augments.valid` use `KNOWN_AUGMENTS.some(...)`; `art/icons.ts:10` and `art/entities.ts:43` iterate `KNOWN_AUGMENTS`.
5. Damage: `Tower.ts` add `herdDamageMul = 1;` beside `hasteRatePct`. `TowerSystem.attack()`: `damage: spec.damage * t.herdDamageMul` and `burn: spec.burn ? { ...spec.burn, dps: spec.burn.dps * t.herdDamageMul } : undefined`. `BeamSystem` line 88: `const m = t.spec.beamRapidMul * t.rallyRateMul * t.herdDamageMul;`. `pulse.ts:23`: `damage: spec.boltDamage * tower.herdDamageMul`. `EnemySystem.beamEffects` line 166: `const mul = source.spec.damageMul * source.herdDamageMul;` — these four are the only damage edits; mark stacking, crits, 0-damage no-ops and kill-spawned secondaries fall out with no further work.
6. `towerLook.ts` `drawHerdRing`: `g.clear(); if (spec.herdCount === 0) return;` const `r = BODY * 1.5`; `fillRing(g,0,0,r,2,0,Math.PI*2,PALETTE.greenDeep,0.9)`; five ticks at `a = (i/5)*Math.PI*2` (fillRing: 0 = up), lit `i < lit` → `fillRing(g,0,0,r,4,a-0.13,a+0.13,PALETTE.green,1)`, unlit → thickness 2.5 `PALETTE.greenDeep` alpha 0.7; if `lit > 0` also `fillRing(g,0,0,spec.range*CELL,4,0,Math.PI*2,PALETTE.green,0.2)` (the working-aura shimmer). `Tower.ts`: `refreshHerdRing(spec)` like `refreshHasteRing` (own Graphics at `this.base` center, `DEPTH.towers`, called with `lit = 0`), called in `refresh()` after `refreshHasteRing`; add the ring to `sellAway()` parts and `destroy()` like `hasteRing`.
7. `HerdSystem.update`: `const list = this.towers.towers;` build `crowd = new Map<Tower, number>()`: for each `t` with `t.spec.herdCount > 0` count `e.active` with `(e.x - t.base.x)² + (e.y - t.base.y)² <= (t.spec.range*CELL)²`. Then for every `t`: `let mul = 1; if (t.spec.herdCount > 0) mul += t.spec.herdPct * Math.min(crowd.get(t) ?? 0, 5); for (const h of list) if (h.spec.firstId === herd.id && h !== t && inRallyReach(h.cell, t.cell, h.spec.range)) mul += h.spec.herdFirstPct * Math.min(crowd.get(h) ?? 0, 5); t.herdDamageMul = mul; if (t.herdRing) drawHerdRing(t.herdRing, t.spec, Math.min(crowd.get(t) ?? 0, 5));` Import `herd` from content, `inRallyReach` from `core/rally`, `drawHerdRing` from `towerLook`. No member state.
8. `GameScene.ts`: import + `herd!: HerdSystem;` field + `this.herd = new HerdSystem(this.towers, this.enemies);` (after the haste line 156) + `this.herd.update(simDt);` after `this.haste.update(simDt)` (line 236).
9. `towerGhost.ts` `drawMarker`: new branch before the final fallback: `else if (added.herd) { fillRing(g, 0, y, 9, 2, 0, Math.PI*2, color, 1); for (let i = 0; i < 5; i++) { const a = (i/5)*Math.PI*2; fillRing(g, 0, y, 9, 3, a-0.1, a+0.1, color, 1); } }`.
10. `DraftScene.ts`: after `hasRow` add `let longOffer = false;`; at the top of `buildRow` set `longOffer = !four && copies.some((c) => { const b = getAugment(c.id); return tierTowerLine(b, c.tier).length > 70 || tierAddedLine(b, c.tier).length > 56; });`; `cardWidth`: `four ? 121 : (hasRow || longOffer) ? 178 : CARD_W`; `cardSlot` condition: `if (four || (w < 740 && (hasRow || longOffer)))`. The existing 2×2 grid (third card centered) then carries the tall card on phones.
11. `runChecks.ts`: after `haste.aura` add `['herd.feed', (g) => { for (const t of g.towers.towers) if (!Number.isFinite(t.herdDamageMul) || t.herdDamageMul < 1 - 1e-9) return \`herd multiplier ${t.herdDamageMul} at (${t.cell.col}, ${t.cell.row})\`; return null; }],`.
12. `npm run check`, then `npm run smoke`.

### Pitfalls
- Retiring Anchor means `getAugment('anchor')` must keep resolving (held towers, saved runs): missing any of the four `KNOWN_AUGMENTS` sites makes `augments.valid` fire every frame, wipes a saved run, or leaves anchor's icon/body unpainted.
- Card lines are 96/93 chars: without step 10 the three-card draft column at 412×915 runs off-screen (`portrait()` top goes negative). Never hand-place a new line at a fixed y; the card grows from its measured lines.
- `herdDamageMul` must be re-set on every tower every frame (a sold Herd tower must not leave a stale buff) and init to 1; it is read one frame late by `towers.update` (RunFlow runs before GameScene's `rally/haste/herd` updates) — same lag as Haste, do not "fix" it.
- Burn is buffed by baking `herdDamageMul` into `payload.burn.dps` at ignition (and via `beamEffects`' `mul` for beam ignitions); do not scale burn ticks in `EnemySystem.tickBurn` — a second site would double-apply.
- `fillRing` angles: 0 = up, clockwise — ticks start at the top.
- Herd first is `kind 'rally'`: it never attacks (even with Bolt added), so its own feed is a no-op; a second Herd in it adds to `herdPct` but feeds nothing — expected.
- The shimmer is drawn per frame on the tower's own `herdRing` Graphics (alpha via redraw), not via `fx.track`; do not add an `auraRing` call per frame.
- `HerdSystem.update` takes `_dt` (unused) or lint fails.

### Tests
- new `tests/core/herd.test.ts`: `tierFirst/tierAdded` give 0.05/0.08 per tier; `towerSpec([copy('herd','rare')])` → kind rally, damage 0, `herdCount 1`, `herdPct 0.05`, `herdFirstPct 0.05`; two copies → `herdPct 0.13`; `towerSpec([copy('bolt'), copy('herd','rare')])` → `herdFirstPct 0` (no aura off a non-first); 300 seeds: every offered Herd is Rare or Epic and `rollOffer(rng, AUGMENTS, 3, 1, true)` never contains it; `AUGMENTS.length === 16`, `AUGMENTS.every(a => a.id !== 'anchor')`, `getAugment('anchor')` still resolves, `draftPool([])` has no anchor but has herd; card lines contain their tier's `+5%`/`+8%`.
- `tests/content.test.ts`: the two tier-line caps `56` → `100`; pink-square family `['anchor','mark','mint']` → `['mark','mint']`.
- `tests/core/augments.test.ts` ("Anchor never rolls as Common…"): drop the anchor count/`toBeGreaterThan(0)` (keep Push).
- `tests/core/anchor.test.ts` ("rolls from Rare up…"): keep the spec/tier assertions, replace the roll loop with `expect(seen).toBe(0)` (retired: never rolls again).

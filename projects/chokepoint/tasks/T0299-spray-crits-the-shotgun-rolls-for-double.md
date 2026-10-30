---
id: T0299
title: "Spray crits: the shotgun rolls for double damage (the T0282 re-file)"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T18:18:58Z
claimed_at: 2026-10-30T22:59:45Z
epic: E4
design_attempts: 1
---

## Goal
The up-close tower gets a spicy moment: every pellet of a Spray blast can roll for double damage, seen where it lands.

## Details
- Every pellet of every Spray blast (first form and added pellets alike) rolls independently: 15% chance to crit, that pellet dealing double its normal damage (8 instead of 4 on Common; the tier's damageMul applies as usual, then the doubling). A crit only doubles that pellet's damage — range, other effects and the rest of the blast are unchanged.
- A critting pellet's impact: the normal hit flash plus one small yellow chip (~8 px, the combo-milestone yellow, T0034) at the impact point. A kill by a critting pellet is an ordinary kill: same gold, Mint bonuses, combo and source-tower kills line as a non-crit kill. No new sound.
- The tower panel's "≈ N/s" line (T0084) counts expected pellet damage for Spray: pellets × damage × 1.15, so the line stays honest. No other augment's term changes.
- Card lines: asTower becomes "Blasts 5 pellets in a cone: 15% hit for double." (47 characters, under the 56-character tier-line cap that killed T0093). asAdded is unchanged at every tier ("+2 pellets per blast." / "+3 …" / "+4 …" — the chance is the same at every tier; the tiers scale the pellet damage the crit doubles). The codex description follows: "Blasts 5 pellets in a cone: deadly up close, 15% hit for double. Added: +2 pellets per blast."
- The tower's look, the what-if preview (T0096) and the beam-kill split needles (T0242) are unchanged; the split needles keep their flat 12 damage and never crit.

## Card lines
- asTower: "Blasts 5 pellets in a cone: 15% hit for double." (all tiers)
- asAdded: "+2 pellets per blast." / Rare "+3 pellets per blast." / Epic "+4 pellets per blast." (unchanged)

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Rapid | changes Spray's damage when added (damageMul) | a flat, always-on multiplier on every pellet — the crit is a per-pellet roll that misses most pellets and spikes a few, with a visible moment where it lands |
| Mark | changes damage taken (+25% from all) | a flat, target-side change on marked enemies — the crit is an attacker-side roll that works on any target and shows itself at the impact |
| Beam-kill split needles (T0242) | the same pellet look on a kill | a flat 12-damage follow-up that never varies — the crit changes the blast itself, pellet by pellet |

No existing augment rolls per-hit damage variance; the crit joins no `first.kind` or `added` row and adds no field to the added-form index.

## Acceptance criteria
- [ ] A unit test with the roll forced: a critting pellet deals exactly twice the normal pellet damage (the tier's damageMul applied before the doubling), and non-crit pellets are byte-identical to today's damage.
- [ ] A critting pellet's impact shows one small yellow chip (the milestone yellow) at the impact point on top of the normal hit flash; non-crit pellets show no chip.
- [ ] A kill by a critting pellet pays normal kill gold, Mint bonuses and combo, and counts for the source tower's kills line, exactly like a non-crit kill.
- [ ] The "≈ N/s" line on a Spray tower is 15% higher than before the change (pellets × damage × 1.15) and no other augment's term moves.
- [ ] Draft, hand, tower panel and codex show the new asTower line "Blasts 5 pellets in a cone: 15% hit for double." and the unchanged added lines.
- [ ] Beam-kill split needles (T0242) still deal a flat 12 each and never crit.

## Design (architect, cachyos-x8664)

### Files
- NEW `src/core/sprayCrit.ts` — pure: `SPRAY_CRIT_CHANCE = 0.15`, `sprayPelletDamage(normalDamage, roll) → { damage, crit }`.
- EDIT `src/content/augments/spray.ts` — `asTower` + `description` only (data; draft/hand/panel/codex pick it up). `asAdded` and `tiers` unchanged.
- EDIT `src/systems/TowerSystem.ts` — `firePellets` closure (the only caller of `fireCone`): draw a per-pellet roll from `this.run.rng`, build a `HitPayload[]` (each `{ ...payload, damage, crit }`), pass the array to `fireCone`.
- EDIT `src/systems/ProjectileSystem.ts` — `fireCone`: `payload: HitPayload` → `payloads: HitPayload[]` (drop `count`; loop uses `payloads[i]!`).
- EDIT `src/systems/EnemySystem.ts` — `HitPayload`: add `crit?: boolean`; `hit()`: after the strike loop, `if (payload.crit) critChip(this.fx, target.x, target.y)`.
- NEW `src/systems/fx/critChip.ts` — one small chip (`PALETTE.yellow`, ~8px) at (x, y); early-return on `fx.full`; `fx.track(...)`.
- EDIT `src/core/towerDps.ts` — spray term only: `* (1 + SPRAY_CRIT_CHANCE)`.

### Interfaces
- `sprayCrit.ts`: `export const SPRAY_CRIT_CHANCE = 0.15;` `export function sprayPelletDamage(normalDamage: number, roll: number): { damage: number; crit: boolean }` — `crit = roll < SPRAY_CRIT_CHANCE`, `damage = crit ? normalDamage * 2 : normalDamage`.
- `critChip.ts`: `export function critChip(fx: FxSystem, x: number, y: number): void`.
- `ProjectileSystem.fireCone(x, y, target: Enemy, payloads: HitPayload[], speed: number, maxDist: number): void` (was `(x, y, target, count, payload, speed, maxDist)`; `count = payloads.length`, loop `this.take().firePellet(x, y, Math.sin(a), Math.cos(a), payloads[i]!, speed, maxDist, blast)`).
- `EnemySystem.HitPayload` gains `crit?: boolean`. `TowerSystem`: `firePellets` signature unchanged; add `HitPayload` to its `./EnemySystem` import + import `sprayPelletDamage` from `core/sprayCrit`.

### Steps (build order)
1. `src/core/sprayCrit.ts`: `SPRAY_CRIT_CHANCE = 0.15`; `sprayPelletDamage` as above.
2. `src/systems/fx/critChip.ts`: `critChip` — one chip: `artScale(fx.scene.add.image(x, y, CHIP_TEXTURE), 0.8).setTint(PALETTE.yellow).setDepth(DEPTH.fx)`, then `fx.track(chip, 220, { y: y - 14, alpha: 0, ease: 'Quad.easeOut' })`.
3. `src/content/augments/spray.ts`: `asTower` = `Blasts 5 pellets in a cone: 15% hit for double.`; `description` = `Blasts 5 pellets in a cone: deadly up close, 15% hit for double. Added: +2 pellets per blast.`.
4. `src/systems/TowerSystem.ts` `firePellets`: `const pellets: HitPayload[] = []; for (let i = 0; i < count; i++) { const r = sprayPelletDamage(payload.damage, this.run.rng.next()); pellets.push({ ...payload, damage: r.damage, crit: r.crit }); } this.projectiles.fireCone(m.x, m.y, target, pellets, spec.projectileSpeed * CELL, maxDist);`.
5. `src/systems/ProjectileSystem.ts` `fireCone`: signature → `payloads: HitPayload[]` (drop `count`); loop → `payloads[i]!`.
6. `src/systems/EnemySystem.ts`: `HitPayload` + `crit?: boolean`; `hit()` → after `for (const e of victims) this.strike(e, payload, flight);` add `if (payload.crit) critChip(this.fx, target.x, target.y);` (import `critChip` from `./fx/critChip`).
7. `src/core/towerDps.ts` line 25 → `dps += spec.damage * spec.spray * spec.rate * (1 + SPRAY_CRIT_CHANCE);` (import `SPRAY_CRIT_CHANCE`).
8. `tests/core/sprayCrit.test.ts` (new): forced roll.
9. `tests/core/augments.test.ts` lines 134–136: multiply the three spray `towerDps` expectations by `(1 + SPRAY_CRIT_CHANCE)` (import it).

### Pitfalls
- Chip is the PRIMARY impact, one chip, in `hit()` — not per splash victim: a Spray+Splash tower's splash victims strike through `strike()` (no chip), correct. A rare piercing Spray pellet strikes through `settle`'s pierce branch (`strike()`, no chip) — acceptable (the chip is the impact-point moment).
- The "normal hit flash" is the enemy's existing white flash (`Enemy.hit` → `this.flash = 0.06`); the chip is IN ADDITION. Do not add a flash. The chip's color is `PALETTE.yellow` (the combo-milestone yellow, `FxSystem.killCount`'s ×10), not a new palette entry.
- The split needles (T0242) go through `fireNeedle` → `fire` (homing), whose payload is built by `sprayNeedles.ts` (no `crit`): they keep flat 12 and never crit. Do not touch them.
- The crit is a behavior on the existing Spray, NOT a new augment: no field on `FirstForm`/`AddedForm`, no `AUGMENTS` line, no new attack. `asAdded`/`tiers` unchanged. The `crit` rides only on the per-pellet payload copies (the shared `attack()` payload has no `crit`), so a non-Spray hit (bolt/pulse/beam) shows no chip.
- `fireCone` is Spray-only (one call site); `firePellet` (Projectile) is unchanged (still takes one `payload`; each pellet gets its own).
- Only the spray term in `towerDps` moves (×1.15); the beam/pulse/shot terms and `TowerPanel` are untouched.

### Tests
- `tests/core/sprayCrit.test.ts`: `sprayPelletDamage(8, 0) → { damage: 16, crit: true }` (exactly 2×; damageMul applied before — e.g. `sprayPelletDamage(4 * 5 / 4, 0).damage === (4 * 5 / 4) * 2`); `sprayPelletDamage(8, 0.5) → { damage: 8, crit: false }` (byte-identical to today); threshold `roll < 0.15` (0.15 is not a crit).
- `tests/core/augments.test.ts` lines 134–136: `4 * 5 / 1.2 * (1 + SPRAY_CRIT_CHANCE)` etc. (the other augments' `towerDps` tests stay).
- The chip and the crit kill are smoke, not unit tests: the chip shows on a crit pellet's impact (no chip on a non-crit), and a crit kill pays gold/mints/combo/`source.kills` exactly like a non-crit (`kill()` is unchanged).

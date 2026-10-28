---
id: T0020
title: "Rally: the rule-changing Epic that rewards clusters"
assignee: asus
size: L
priority: 3
status: in-progress
depends_on: [T0012]
attempts: 1
created: 2026-10-28T04:12:01Z
claimed_at: 2026-10-28T05:44:47Z
epic: E4
---

## Goal
The draft can roll a second rule-changing Epic augment, Rally, that makes one tower change another: clusters of towers attack faster. It is the first augment whose effect is on other towers, and it rewards building in tight groups beside the road.

## Details
- **Rally is Epic-only.** It never comes as Common or Rare; it can only be rolled as Epic, reusing the Epic-only flag that Mark (T0012) introduces.
- **Closest existing augment:** Frost. Both are support augments with no attack of their own — but Frost changes enemies (it slows them), while Rally changes other towers (a tower-to-tower interaction no current augment has).
- **As a tower's first augment (support role):** the tower does not attack. It radiates a rally: every other tower within 2 cells (a 5x5 square, Chebyshev distance <= 2) attacks 10% faster. The buff is flat and does not stack — a tower in range of several Rally towers still gains only 10%.
- **When added to a tower:** the tower keeps its attack and joins its own rally — it gains the +10% attack speed itself while still granting +10% to the other towers within 2 cells.
- **Show on the tower:** a Rally tower is a taller teal chunky rounded beacon (a pillar with a rounded cap), clearly distinct from the short, fat shapes of the attacking towers. While at least one other tower is within 2 cells, a soft teal ring pulses out to the 2-cell radius once per second. Every buffed tower shows a small yellow up-chevron tick floating just above it.
- **Values:** range 2 cells; +10% attack speed; does not stack; the pulse ring and the chevron are the only visual effects.
- **Card lines (draft):**
  - First: "Towers within 2 cells attack 10% faster. Does not attack itself."
  - Added: "Joins its own rally: this tower also attacks 10% faster."
- **Discoverability:** no new keys or buttons. The pulsing ring shows the range and the chevron shows exactly which towers are sped up, so a first-time player can read what Rally is doing on the board.

## Acceptance criteria
- [ ] The draft can roll Rally, only as an Epic card (Epic frame and gem row); it never appears as Common or Rare.
- [ ] A tower built with Rally first is the teal beacon and never fires at enemies.
- [ ] A lone Rally tower shows no ring; once another tower is built within 2 cells, the teal ring starts pulsing and that tower gets the yellow chevron.
- [ ] A buffed tower attacks 10% faster (its shots land 10% more often over a short window) and shows the chevron.
- [ ] A tower 3 or more cells away from the Rally tower gets no chevron and no speed change.
- [ ] Adding Rally to an existing attacking tower keeps that tower's attack, gives it the chevron, and still buffs the other towers within 2 cells.
- [ ] A tower within 2 cells of two different Rally towers gains only +10% (the buff does not stack).
- [ ] The game remains playable and readable for a first-time player: the ring and chevron show what Rally does without reading the card.

## Design (architect, desktop)

### Files
- create `src/content/augments/rally.ts` — Rally's `AugmentDef`: `look: { shape: 'pillar', color: 'teal', size: 0.22 }`, T0012's Epic-only flag set, `first: { kind: 'rally', damage: 0, range: 2, rate: 1 }`, `added: { rally: { pct: 0.1 } }`, `asTower: 'Towers within 2 cells attack 10% faster. Does not attack itself.'`, `asAdded: 'Joins its own rally: this tower also attacks 10% faster.'` (same line for both `tiers.rare.asAdded` and `tiers.epic.asAdded`, no multipliers — the buff stays flat 10%), `description: 'Towers within 2 cells attack 10% faster. Added: joins its own rally.'`
- create `src/core/rally.ts` — pure rally rule (no Phaser)
- create `src/systems/attacks/rally.ts` — the no-op attack
- create `src/systems/RallySystem.ts` — applies the buff, draws chevrons, pulses the ring
- create `tests/core/rally.test.ts` — unit tests (see Tests)
- edit `src/content/types.ts` — `Shape`: append `| 'pillar'` to the existing one-line union; `AttackKind`: add a commented `| 'rally'` line after `'pulse'`; `AddedForm`: add `/** Joins the tower's own rally (flat, never stacks; applied by systems/RallySystem.ts). */ rally?: { pct: number };` after `rangeMul`
- edit `src/content/augments/index.ts` — one line `rally,` after `frost,`
- edit `src/systems/attacks/index.ts` — one line `rally,` after `pulse,`
- edit `src/entities/Tower.ts` — public field `rallyRateMul = 1;` (comment: set by RallySystem, 1 when not buffed) after `cooldown`
- edit `src/systems/TowerSystem.ts` — one line in `update()`: `if (this.attack(t, enemies)) t.cooldown += 1 / (t.spec.rate * t.rallyRateMul);`
- edit `src/entities/towerLook.ts` — `barrelCount`: `if (!spec.attacks || spec.kind === 'rally') return 0;`; in the Rapid-tick decoration add `if (spec.kind === 'rally') return;` as first line (a beacon has no speed to show)
- edit `src/core/augments.ts` — `describeSpec`: insert `} else if (spec.kind === 'rally') { const r = getAugment('rally'); line = \`Towers within ${r.first.range} cells attack ${Math.round((r.added.rally?.pct ?? 0) * 100)}% faster\`; }` before the `spec.damage <= 0` branch
- edit `src/art/paint.ts` — `shapePath`: after the circle case add `if (shape === 'pillar') { const w = radius * 0.72, h = radius * 1.5; roundRectPath(ctx, x - w, y - h, w * 2, h * 2, w); return; }` (vertical capsule, corner radius = half width)
- edit `src/art/shapes.ts` — `sides` record: add `pillar: 0` (shapePath handles it before `shapePoints`, like circle)
- edit `src/art/entities.ts` — `paintTowerBody`: eye dot y becomes `shape === 'pillar' ? c - r * 0.78 : c - r * 0.05` (on the cap)
- edit `src/scenes/GameScene.ts` — field `rally!: RallySystem;`, `this.rally = new RallySystem(this, this.towers, this.fx);` after the `flow` line, `this.rally.update(dt);` next to `this.exitWarn.update(dt)` in `update()`
- edit `src/debug/runChecks.ts` — after the `'towers.valid'` line: `['rally.valid', (g) => { for (const t of g.towers.towers) if (t.rallyRateMul < 1 - 1e-9 || t.rallyRateMul > 1.2) return \`rally multiplier ${t.rallyRateMul}\`; return null; }],`
- edit `tests/content.test.ts` — line 39: `expect(a.first.damage > 0 || a.first.slow || a.first.kind === 'rally').toBeTruthy();`; line 45 only: cap `56` → `70` (the task's asTower line is 64 chars; keep the tier-line cap at 56)

### Interfaces
```ts
// src/core/rally.ts (imports getAugment from '../content/augments', Cell from './map')
export const RALLY_RANGE: number; // getAugment('rally').first.range (2)
export const RALLY_PCT: number;   // getAugment('rally').added.rally?.pct ?? 0 (0.1)
export function inRallyReach(a: Cell, b: Cell, range: number): boolean; // Chebyshev <= range (the 5x5 square)
export function rallyBuffed(cells: readonly Cell[], rally: readonly boolean[], attacks: readonly boolean[], range: number): boolean[];
// buffed[i] = attacks[i] && (rally[i] || any j !== i with rally[j] && inRallyReach) — boolean, so it can't stack

// src/systems/attacks/rally.ts
export const rally: Attack; // () => false — the beacon never fires (no fx, sfx or stats)

// src/systems/RallySystem.ts
export class RallySystem {
  constructor(scene: Phaser.Scene, towers: TowerSystem, fx: FxSystem);
  update(dt: number): void; // every frame, every active phase
}
```
`update()`: map `towers.towers` to `hasRally` (`t.augments.some((c) => c.id === 'rally')`) and `attacks` (`t.spec.attacks && t.spec.kind !== 'rally'`); `rallyBuffed(...)`; set each `t.rallyRateMul = buffed ? 1 + RALLY_PCT : 1`; one `Graphics` at `DEPTH.bars` cleared and refilled each frame with a filled yellow chevron (PALETTE.yellow) per buffed tower, centered at `(t.x, t.y - 32)`, polygon `(x-7,y+3) (x,y-4) (x+7,y+3) (x+7,y+6.5) (x,y-0.5) (x-7,y+6.5)` via `beginPath/lineTo/closePath/fillPath`; a plain number `pulseSec` accumulates `dt`, and every ≥1 s each `hasRally` tower with any other tower `inRallyReach` calls `fx.ring(s.x, s.y, RALLY_RANGE * CELL, PALETTE.teal)`.

### Steps
1. Gate: T0012 (Mark) must be merged first — read the Epic-only flag it added to `AugmentDef` in `src/content/types.ts` (set in `mark.ts`) and how `core/tiers.ts` honors it. If it is not in the code, stop.
2. `src/content/types.ts` (pillar, rally kind, `AddedForm.rally`).
3. `src/content/augments/rally.ts` (with that flag set `true`) + the index line.
4. `src/core/rally.ts`.
5. `src/systems/attacks/rally.ts` + the `ATTACKS` line.
6. `Tower.rallyRateMul` + the `TowerSystem.update` line.
7. The two `towerLook.ts` guards.
8. `describeSpec` branch.
9. Art: `shapePath` capsule, `sides.pillar`, the cap eye. The pillar is taller (3r) than any body — it must stay inside the existing `bodySize` texture with its side face and shadow; never rotate it.
10. `RallySystem` + the three `GameScene` lines.
11. `runChecks` invariant.
12. `tests/core/rally.test.ts` + the two `tests/content.test.ts` line changes.
13. `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- Never apply the buff as a multiplier in `towerSpec`: the `AddedForm.rally` field is declarative — only `core/rally.ts` reads it. The whole effect is the boolean → `rallyRateMul ∈ {1, 1.1}`, so two rally towers or a second rally copy in one tower can never produce 1.21.
- `kind: 'rally'` flows through `TowerSystem.attack` into `ATTACKS['rally']` (returns false → no cooldown set, no sound, no `shotsFired`); without the `barrelCount` guard, Bolt added to a beacon would paint a dead barrel.
- Hover preview and `showRange` already read `spec.range` (2) — no Building changes; the 2-cell circle on hover is intentional and free.
- Smoke safety: the opening draft filter (`first.damage > 0`) already excludes Rally, so the first tower always attacks and `shotsFired` stays > 0; later drafts may offer it, which is fine.
- Ring/chevron are board-space (world units), drawn at `DEPTH.bars`/`DEPTH.fx`; the chevron Graphics is one object cleared per frame (no per-tower objects, nothing to clean on shutdown; the scene destroys it).
- Merge surface: `TowerSystem.ts` (T0004), `Tower.ts`/`towerLook.ts` (T010), `GameScene.ts`/`runChecks.ts` (T0015/T0019), `types.ts`/`index.ts`/`augments.ts` (T0004/T0006/T0012) are touched by open tasks — keep every edit to exactly the lines above, placed next to the related code, no reformatting.
- `?smoke` auto-pick, draft layout (64-char line wraps to 2 lines in the 220px card), and 412x915 portrait all work unchanged: no new inputs or HUD parts.

### Tests
`tests/core/rally.test.ts`: (1) `RALLY_RANGE === 2`, `RALLY_PCT ≈ 0.1`, `inRallyReach` — (2,2) diagonal is IN (square, not circle), (3,0) and (0,3) are OUT; (2) a lone beacon: `attacks: false` for it → not buffed, no chevron; a bolt at Chebyshev 2 is buffed, one at 3 is not; (3) two rallies around one bolt → buffed (the boolean result proves no stacking); an attacking tower with rally added is buffed while alone; (4) across ~120 seeded `rollOffer` calls (seeds 1–40, waves 1/5/10, `opening = false`), every offered rally copy is `'epic'` and at least one rally is offered (guard against a vacuous pass). Adapt the `rollOffer` call to the signature T0012 leaves behind.

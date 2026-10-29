---
id: T0152
title: "Haste: the Epic that hastens everything it touches"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T12:14:31Z
epic: E4
---

## Goal
E4's next pool augment — and the first tech-gated one: an Epic-only aura that makes the road inside it race, so a Haste tower is a tempo trade, the first augment whose buff costs the run something. It lands gated: absent from every draft roll until the tech tree's pool node (T0153, 25 coins) is bought, so the tree unlocks Haste, it doesn't build.

## Details
- Card (Epic only, like Mark/Rally/Mint/Anchor — never Common or Rare; not an opening-draft augment):
  - asTower: “2 cells: towers +30% attack, enemies +30% speed.”
  - asAdded: “Each extra Haste: +15% to both.”
  - description: “Towers and enemies within 2 cells run 30% faster. Added: each extra +15% to both.”
- First form: kind `rally` (the support aura that makes towers attack faster), extended with a new enemy side — a support with no attack of its own, 0 damage like the other supports (the panel's “≈ N/s” line, T0084, shows nothing for it).
- Added form: a new field `haste` (no existing added form changes it): each extra copy scales the aura +15% to both sides. It is the aura itself, so it works the same on every host attack kind (shot, spray, pulse, beam, burn, mark, rally, spray) — there are no per-hit effects to apply.
- The aura (one per Haste tower, radius 2 cells, the same circle reach as Rally and Mint — the T0103 ring rule: the enemy's or tower's center inside the 2-cell circle around the Haste tower):
  - Enemy side: while an enemy's center is inside, it walks ×(1.30 + 0.15 × extra copies) of its current speed — continuous while inside, off the moment it leaves; no duration, no re-application, no shrug-off (it is not a root). It multiplies whatever speed the enemy has: a Sprinter's ramped speed, a Dasher's crawl and its dash. The Ward (T0111) is affected — it ignores slow, root and push, not speed changes. With a slow: the slow first, then Haste (a 40% slow + 30% haste = 0.6 × 1.3 = 0.78 of base).
  - Tower side: the same attack-speed stat Rally changes — every tower with its center inside, including the host tower (a Bolt + Haste tower fires at 1.3× its rate) and supports' pulses, attacks (1.30 + 0.15 × extra copies) × faster. Stacks additively with Rally (10% + 30% = 40% faster), no cap. A Mute-silenced tower inside the aura stays silent (the buff does not override silence).
  - Copies: two Hastes in one tower = one aura at +45% to both; three = +60%; additive, no cap.
- Look: a flat wide red ring at the tower's base (no augment uses red; the draft-card icon is the same red ring, size 0.22); one tick per copy; the ring is 40% alpha while no enemy is inside, full alpha while at least one is, and flashes to full for a ~0.2 s beat each time an enemy enters (the working-aura beat, T0055).
- The gate (the tech-tree unlock, E2's branch three): Haste is in the content but absent from every draft roll (pre-wave-1, later, reroll, the fourth card) unless the saved profile's purchased list holds the tech node id `haste` (T0153's node). The check runs at every draft roll, so a node bought between runs takes effect from the next draft on. Until T0153 lands the node cannot be bought and Haste never rolls.
- 16-cap (the augments module): this is the pipeline's 19th augment (14 in + T0025, T0062, T0064, T0095, T0152). The ROADMAP flags the cap: the first task to land past 16 (Momentum, T0064) removes or merges one and says which — the PO's leaning is a Frost + Haste merge (the same enemy-speed stat, opposite signs). If that merge lands before this task builds, Haste is the merged form and this task is re-filed to match; the architect notes the state at design time.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Rally | `kind rally`: a 2-cell aura that makes towers attack faster; its added form changes the same attack-speed stat | It also makes enemies inside walk faster — Rally only buffs towers; Haste is the first aura that works on enemies and towers at once, a buff that costs the run something |
| Frost | the added form changes enemy movement speed | Frost slows hit enemies by 40% for 2 s, applied per hit with a duration; Haste hastens continuously while inside the aura — the opposite direction, no per-hit, no duration, and Frost never touches towers |
| Push | an aura that moves enemies in a radius | Push drags enemies backward along the road (position, −0.4 cells per hit); Haste changes walking speed (velocity) — a pushed-and-hasted enemy keeps walking, faster |
| Anchor | an aura that changes enemy speed to zero | Anchor fully stops for 0.75 s every 3 s, with the 2 s shrug-off after; Haste multiplies speed while inside — continuous, reversible the moment the enemy leaves, no timer |
| Mint | a 2-cell aura support with no attack of its own | Mint's aura changes the economy (kill gold); Haste's aura changes tempo — and its buff is a cost as much as a gain |
| Momentum | a run-growth buff with no input | Momentum is run-wide, one-way and damage-only (+5% per clean wave, never lost); Haste is per-tower, two-way, and turns off the instant the enemies leave the radius |

## Acceptance criteria
- [ ] With the `haste` node not owned (or T0153 not landed), no draft — pre-wave-1, later, a reroll, a fourth card — ever offers Haste; with it owned, Haste rolls Epic-only like the other Epics and can be bought and built like them.
- [ ] A Haste tower: an enemy inside its 2-cell radius walks 30% faster while inside and the multiplier is gone the moment it leaves (a Dot covers the same stretch measurably quicker through the ring); the aura is continuous — no duration, no re-application, no shrug-off after leaving.
- [ ] A Haste tower: every tower inside the radius attacks 30% faster, including the host (a Bolt + Haste tower fires at 1.3× its rate) and supports' pulses; a Mute-silenced tower inside the aura stays silent.
- [ ] Two Hastes in one tower: one aura, +45% to both, two ticks on the base ring; three: +60%; additive, no cap; with a Rally overlapping, the tower side is 10% + 30% = 40% faster.
- [ ] A Sprinter inside the aura walks at its ramped speed ×1.3; a Ward inside walks +30% faster; an enemy both slowed (Frost) and hastened walks at 0.6 × 1.3 = 0.78 of its base speed.
- [ ] Look: a flat wide red ring at the base, one tick per copy, 40% alpha with no enemy inside, full while at least one is inside, a ~0.2 s brighten beat on each entry; the draft card's icon is the red ring.
- [ ] Byte-identical: with no Haste tower on the board (and no node owned), enemy speeds and tower attack cadences are byte-identical to today.

## Design (architect, desktop)

### Files
- create `src/content/augments/haste.ts` - the Haste AugmentDef (Epic-only, `tech: 'haste'` gate, kind `rally` first form with enemy side, `haste` added form)
- edit `src/content/augments/index.ts` - import `haste` + one line in `AUGMENTS` directly after `rally`
- edit `src/content/types.ts` - `FirstForm.haste`, `AddedForm.haste`, `AugmentDef.tech`
- edit `src/core/augments.ts` - `TowerSpec.hastePct`/`hasteCount` (+ `EMPTY`/init), the haste loop in `towerSpec()`, new `draftPool()`, `describeSpec()` lines
- create `src/systems/HasteSystem.ts` - the aura: enemy + tower buffs, ring alpha/beat
- edit `src/systems/TowerSystem.ts` - one line: haste into the cooldown stat
- edit `src/systems/RunFlow.ts` - both `rollOffer` calls take `draftPool(this.run.techOwned)`; imports
- edit `src/entities/Enemy.ts` - `hastePct` field, reset in `spawn()`, multiplied in `advance()` (walk + dash legs)
- edit `src/entities/Tower.ts` - `hasteRatePct` field, `hasteRing` Graphics, `refreshHasteRing()`, destroy
- edit `src/entities/towerLook.ts` - `drawHasteRing()`
- edit `src/core/run.ts` - `RunState.techOwned`
- edit `src/scenes/GameScene.ts` - load `purchased` once, pass to `RunState`, construct/update `HasteSystem` (wiring only)
- edit `src/debug/runChecks.ts` - one `haste.aura` invariant next to `mute.jam`
- create `tests/core/haste.test.ts`

### Interfaces
```ts
// content/types.ts (one line each, next to the related fields)
FirstForm.haste?: { pct: number };   // aura percent on the enemy side (Haste first)
AddedForm.haste?: { pct: number };   // added to the aura per extra Haste copy, both sides
AugmentDef.tech?: string;            // tech node id that must be in the profile's purchased list before it rolls

// core/augments.ts
TowerSpec: hastePct: number; hasteCount: number;   // 0 / 0 in EMPTY and in towerSpec()'s init
export function draftPool(owned: readonly string[]): readonly AugmentDef[]  // AUGMENTS minus a.tech-gated ones not in owned

// core/run.ts
RunState.techOwned: readonly string[];              // constructor(seed: number, techOwned: readonly string[] = [])

// entities
Enemy.hastePct = 0;                                 // fraction the aura adds; set by HasteSystem each frame, reset in spawn()
Tower.hasteRatePct = 0;                             // fraction added ON TOP of rallyRateMul (additive, no cap)
Tower.hasteRing: Phaser.GameObjects.Graphics | undefined;
towerLook: export function drawHasteRing(g: Phaser.GameObjects.Graphics, spec: TowerSpec): void;

// systems/HasteSystem.ts
export class HasteSystem { constructor(towers: TowerSystem, enemies: EnemySystem); update(dt: number): void; }

// content/augments/haste.ts (card lines verbatim from the task)
id: 'haste', tier: 'epic', tech: 'haste',
look: { shape: 'ring', color: 'red', size: 0.22 },  // icon + tower body painted automatically; 'ring red' is a fresh pair
first: { kind: 'rally', damage: 0, range: 2, rate: 1, haste: { pct: 0.3 } },
added: { haste: { pct: 0.15 } },
tiers: { rare: { asAdded: 'Each extra Haste: +15% to both.' }, epic: { asAdded: 'Each extra Haste: +15% to both.' } }
```

### Steps
1. `content/types.ts`: add the three fields above (docs comments in the file's style).
2. Create `content/augments/haste.ts` modelled on `rally.ts` (Epic-only: `tier: 'epic'`, both tier lines identical, like Rally/Mark). Add it to `AUGMENTS` after `rally`.
3. `core/augments.ts`: add spec fields; in `towerSpec()` after the Push loop:
```ts
// Hastes in any slot: the aura's percent on both sides. The tower's first Haste copy sets it at
// the first-form percent; each extra copy adds its added-form percent (30% + 15% each).
let hasteSeen = false;
for (let i = 0; i < augments.length; i++) {
  const c = augments[i]!;
  const a = getAugment(c.id);
  if (a.id !== haste.id) continue;
  spec.hastePct += hasteSeen ? tierAdded(a, c.tier).haste?.pct ?? 0 : a.first.haste?.pct ?? 0;
  hasteSeen = true;
  spec.hasteCount += 1;
}
```
(import `haste` like `anchor` is.) Add `draftPool(owned) = AUGMENTS.filter((a) => a.tech === undefined || owned.includes(a.tech))`. In `describeSpec()`: in the `kind === 'rally'` branch, when `spec.firstId === 'haste'` say `` `Towers and enemies within ${reach} cells run ${Math.round(spec.hastePct * 100)}% faster` `` (else keep the Rally line); and in the trailer section add, for `hasteCount > 0 && firstId !== 'haste'`: `` `, and towers and enemies within ${reach} cells run ${pct}% faster` `` (reach from `spec.range`).
4. `core/run.ts`: `readonly techOwned: readonly string[]` + constructor param (default `[]`).
5. `entities/Enemy.ts`: field `hastePct = 0;` beside `slowPct`; `this.hastePct = 0;` in `spawn()`; in `advance()`: `const speed = this.rootLeft > 0 ? 0 : this.speed * (1 - this.slowPct) * (1 + this.hastePct);` and the dash leg `this.distance += (c.dashCells / c.dashSec) * CELL * (1 + this.hastePct) * dt;`.
6. `entities/towerLook.ts`: `drawHasteRing()` — `g.clear()`, return if `hasteCount === 0`; `const r = BODY * 1.7;` full `fillRing(g, 0, 0, r, 6, 0, Math.PI * 2, PALETTE.red)`; one tick per copy: `a = (i / spec.hasteCount) * Math.PI * 2`, `fillRing(g, 0, 0, r, 9, a - 0.14, a + 0.14, PALETTE.red)`. `entities/Tower.ts`: two fields; in `refresh()` call new `refreshHasteRing(spec)` after `drawDecorations` (create `scene.add.graphics().setDepth(DEPTH.towers).setPosition(this.base.x, this.base.y)` once, `setAlpha(0.4)`, then `drawHasteRing`); destroy it in `destroy()`.
7. Create `systems/HasteSystem.ts` (per-run, state in closure): each `update(dt)`: `auras = towers.towers.filter(t => t.spec.hasteCount > 0)`; reset `e.hastePct = 0` for all enemies, then per aura add `h.spec.hastePct` to each active enemy with `dx*dx + dy*dy <= (h.spec.range * CELL)^2` (centered on `h.base.x, h.base.y`) and count them; per tower `t.hasteRatePct = (t.spec.hasteCount > 0 ? t.spec.hastePct : 0) + sum over other auras in `inRallyReach(h.cell, t.cell, h.spec.range)` (reuse `core/rally.ts`); per aura, with `Map<Tower, { prev: number; flash: number }>`: `if (n > prev) flash = 0.2; if (n === 0) flash = Math.max(0, flash - dt); ring.setAlpha(n > 0 || flash > 0 ? 1 : 0.4)`.
8. `systems/TowerSystem.ts` line 103: `t.cooldown += 1 / (t.spec.rate * (t.rallyRateMul + t.hasteRatePct));` (sum, not product: 10% + 30% = 1.4).
9. `systems/RunFlow.ts`: both `rollOffer(this.run.rng, AUGMENTS, ...)` become `rollOffer(this.run.rng, draftPool(this.run.techOwned), ...)`; swap the `AUGMENTS` import for `draftPool`.
10. `scenes/GameScene.ts`: `const purchased = loadProfile(window.localStorage).purchased;` before `new RunState(...)` (pass it as 2nd arg in all cases); `if (!saved)` then uses `startBonuses(purchased)`. Import `HasteSystem`; field `haste!: HasteSystem;` beside `rally`; `this.haste = new HasteSystem(this.towers, this.enemies);` after the RallySystem construction; `this.haste.update(simDt);` after `this.rally.update(simDt);` in `update()`.
11. `debug/runChecks.ts`: `['haste.aura', (g) => { const has = g.towers.towers.some((t) => t.spec.hasteCount > 0); if (!has && (g.towers.towers.some((t) => t.hasteRatePct > 0) || g.enemies.all.some((e) => e.active && e.hastePct > 0))) return 'haste working with no Haste tower'; return null; }],` after `mute.jam`.
12. `tests/core/haste.test.ts`, then `npm run check` and `npm run smoke`.

### Pitfalls
- 16-cap state at design time (2026-10-29): 14 augments in the pool; T0025/T0062/T0064/T0095 not landed; the PO-leaning Frost+Haste merge (T0064's cap move) has NOT landed — Frost is intact. Haste lands as the 15th; if that merge lands first, this task is re-filed.
- Byte-identical: `x * (1 + 0)` and `x + 0` are exact in IEEE 754 — keep the additive form exactly; never rewrite it as a product (`1.1 × 1.3 = 1.43` would break the 40% acceptance number) or "simplify" away the `+ 0`.
- Never mutate `Enemy.speed` for haste: the `enemies.speedCap` invariant and Sprinter's ramp read it; haste is only the multiplier in `advance()`.
- `hastePct` must be reset in `spawn()` (pooled enemies) and the beat map lives in the HasteSystem closure (per-run).
- A tower with Haste in ANY slot radiates, and its first Haste copy (any slot) sets 30% — that is why a Bolt + Haste tower fires at 1.3×; the host is always in its own aura (Rally's `rally[i] → true` precedent).
- The aura radius is the haste tower's own `spec.range` (Reach added to a Haste tower widens it — Rally precedent); tower reach stays `inRallyReach` on cells (T0103 ring rule), enemy reach is the board-unit distance to the enemy center.
- Mute silence needs no code: TowerSystem skips `t.jammed` before any cooldown math; don't let haste touch `jammed`. The ring is not dimmed by jam (same as the rally chevron).
- Beam DPS is not scaled (a beam has no cadence — identical to Rally today); "works on every host kind" means the aura radiates from and buffs them, not that beamDps grows.
- The ring needs its own Graphics: DECORATIONS draws into the shared `deco` Graphics, which cannot take a per-object alpha.
- Haste never opens the draft: `first.damage` is 0 and there is no `opening: true`; rollOffer's opening filter handles it. `draftPool` keeps array order, so unowned runs roll byte-identical offers.
- Future Ward (T0111) ignores slow/root/push only — keep `hastePct` a separate factor so the Ward is hastened, as specified.

### Tests
- `tests/core/haste.test.ts`: `towerSpec` haste math — `[haste]` → 0.3/1, `[bolt, haste]` → 0.3/1, `[haste, haste]` → 0.45/2, `[haste, haste, haste]` → 0.6/3, `[haste, rally]` → 0.3 (rally adds no haste); `draftPool` — `[]` excludes `haste` and keeps the other 14 in order, `['haste']` includes it, `['gold-1']` still excludes it; `rollOffer(new Rng(1), draftPool([]), 3, w, w === 0)` never yields `haste` for a run of waves.

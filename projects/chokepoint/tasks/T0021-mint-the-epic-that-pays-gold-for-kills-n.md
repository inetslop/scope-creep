---
id: T0021
title: "Mint: the Epic that pays gold for kills near it"
size: L
priority: 3
status: todo
depends_on: [T0020, T0012, T0004, T010]
attempts: 0
created: 2026-10-28T04:43:01Z
epic: E4
---

## Goal
The draft's third rule-changing Epic: a tower that turns kills into extra gold, so where you build becomes an economy decision, not just a combat one — a chokepoint where your towers do most of the killing now pays for itself.

## Details
- New augment, Epic-only (never rolled Common or Rare), reusing the Epic-only flag that Mark (T0012) introduces.
- **Not offered in the opening draft** (like Rally, T0020): the opening offers only attacking augments, so the first tower always attacks.
- **Closest existing augment:** Frost — both are support augments with no attack of their own. What is new: Frost changes enemies (it slows them), while Mint changes the economy (kills pay more gold), which no current augment touches.
- **As a tower's first augment (support role):** the tower does not attack. Every enemy killed within 2 cells of a Mint tower (a 5x5 square, Chebyshev distance <= 2, like Rally) drops **+1 extra gold** on top of its normal kill gold.
- **When added to a tower:** that tower's own kills drop **+1 extra gold**. Only killing towers (Bolt, Rapid, Reach, Splash) earn it; a Frost or Rally tower with Mint added earns nothing extra from its own hits, because it does not kill.
- Copies stack: two Mints in one tower make its kills drop +2; a Mint-added Bolt inside another Mint tower's 2-cell radius earns both, +2 on the same kill.
- **Look on the tower:** body color yellow (gold's color; if another augment already uses yellow, the nearest bright unused color), and a small coin disc (about 10 px, styled like the HUD's coin icon: a flat circle with a darker side face) riding on the side of the tower's base. The disc always contrasts the body color and is the first thing that says "gold" at a glance.
- The extra gold shows in the existing gold pop where the kill happens (the pop's number is just bigger by 1). No new HUD element, no new input, no new sound.
- **Card lines (the card is always Epic; no Common/Rare values exist):**
  - First: "Kills within 2 cells drop +1 gold. Does not attack."
  - Added: "This tower's kills drop +1 gold."
- **Values:** +1 gold per kill per Mint copy; aura radius 2 cells (5x5 square). No other numbers.

## Acceptance criteria
- [ ] The draft can roll Mint, only as an Epic card (Epic frame and gem row); it never appears as Common or Rare, and never in the opening draft.
- [ ] A tower built with Mint first shows the coin disc and never fires at enemies; an enemy killed within its 2 cells drops +1 more gold than the same kill with the tower absent (the gold pop shows the extra).
- [ ] An enemy killed 3 or more cells away from the Mint tower drops the normal kill gold.
- [ ] A Bolt tower with Mint added drops +1 more gold per kill of its own; a Frost tower with Mint added drops none extra.
- [ ] Two Mints in one tower make that tower's kills drop +2; a Mint-added Bolt inside a Mint tower's 2 cells earns +2 on one kill.
- [ ] The tower panel shows Mint's card lines like the other augments, and the coin disc is visible on the tower at 1x zoom at 412x915 and 1280x720.
- [ ] The game remains playable and readable for a first-time player: the coin disc and the bigger gold pop say what Mint does without reading the card.

## Design (architect, desktop)

### Files
- create `src/content/augments/mint.ts` - the Mint `AugmentDef` (support, Epic-only)
- create `src/core/mint.ts` - pure kill-gold rule: `MintTower`, `chebyshev()`, `mintGoldBonus()`
- edit `src/content/types.ts` - one optional field on `FirstForm`, one on `AddedForm`
- edit `src/content/augments/index.ts` - import `mint`, add it to `AUGMENTS` right after `frost`
- edit `src/core/augments.ts` - `TowerSpec` fields, `towerSpec()` accumulation, `describeSpec()` support branch
- edit `src/systems/EnemySystem.ts` - `HitPayload.source`, a `towers` getter, gold bonus in `strike()`
- edit `src/systems/TowerSystem.ts` - `source: t` in the payload literal, skip pure-support towers in `update()`
- edit `src/scenes/GameScene.ts` - one wiring line after `this.towers = new TowerSystem(...)`
- edit `src/entities/towerLook.ts` - one `DECORATIONS` entry (coin), after the frost ring
- edit `src/debug/runChecks.ts` - one invariant line after `'towers.valid'`
- edit `tests/content.test.ts`, `tests/core/augments.test.ts` - new cases; create `tests/core/mint.test.ts`

### Interfaces
```ts
// content/types.ts
export interface FirstForm { /* ... */ goldRadius?: number; }   // kills within this many cells (Chebyshev) pay +1 per mint copy on the tower
export interface AddedForm { /* ... */ goldPerKill?: number; }  // this tower's own kills drop this much extra gold

// core/augments.ts TowerSpec (also add goldPerKill: 0, goldRadius: 0 to EMPTY)
goldPerKill: number; // one per mint copy in the tower, any slot
goldRadius: number;  // 0 unless the FIRST augment's form has goldRadius

// core/mint.ts (new)
export interface MintTower { cell: Cell; spec: TowerSpec; } // structural — Tower satisfies it; core never imports entities/
export function chebyshev(a: Cell, b: Cell): number; // max(abs col gap, abs row gap)
export function mintGoldBonus(towers: readonly MintTower[], cell: Cell, source: MintTower): number;

// systems/EnemySystem.ts
export interface HitPayload { /* ... */ source: Tower; } // required; every payload is built by TowerSystem (pulse.ts spreads it, Projectile stores it)
towers: () => readonly Tower[] = () => []; // EnemySystem field; GameScene sets it: this.enemies.towers = () => this.towers.towers;
```
`mint.ts`: `id:'mint'`, `name:'Mint'`, `look: { shape: 'square', color: 'pink', size: 0.22 }` (Rapid owns yellow; pink is the nearest unused bright — the coin stays yellow = gold), `first: { kind: 'pulse', damage: 0, range: 2, rate: 1, goldRadius: 2 }`, `added: { goldPerKill: 1 }`, `asTower: 'Kills within 2 cells drop +1 gold. Does not attack.'`, `asAdded: "This tower's kills drop +1 gold."` (description: both in one line). `tiers.rare`/`tiers.epic`: `{ asAdded: "This tower's kills drop +1 gold." }` (no multipliers — +1 is the only number). **Copy Mark's Epic-only flag from `content/augments/mark.ts` / `AugmentDef` exactly as T0012 did (same field, same value) — do not add your own tier logic; T0012's roll change makes it Epic. Never in the opening draft: the existing `first.damage > 0` filter in `rollOffer` already excludes it.**

### Steps
1. Confirm T0012 is merged; read `mark.ts` and the flag + tier handling it introduced.
2. Add the two optional fields to `content/types.ts`.
3. Write `mint.ts`; register it in `AUGMENTS` after `frost` (import after the frost import).
4. `core/augments.ts`: add the two `TowerSpec` fields (+`EMPTY`); in `towerSpec()` set `goldRadius: f.goldRadius ?? 0` and, after the added-forms loop, `for (const a of augments) spec.goldPerKill += tierAdded(getAugment(a.id), a.tier).goldPerKill ?? 0;`. Rewrite the `spec.damage <= 0` branch of `describeSpec()`: with slow keep today's lines; else `line = spec.bolts > 0 ? \`Shoots ${spec.bolts > 1 ? \`${spec.bolts} enemies\` : 'the enemy furthest along'}\` : 'Does not attack'`; then before `return`: `if (spec.goldRadius > 0) line += \` kills within ${spec.goldRadius} cells drop +${spec.goldPerKill} gold\`; else if (spec.goldPerKill > 0) line += \` kills drop +${spec.goldPerKill} gold\`;` (keep a comma where it joins a non-empty line).
5. Write `core/mint.ts` per the interface: for each tower with `spec.goldPerKill > 0`, pay `spec.goldPerKill` when `t === source` OR (`t.spec.goldRadius > 0` and `chebyshev(t.cell, cell) <= t.spec.goldRadius`); each copy is paid at most once.
6. `EnemySystem.ts`: `source: Tower` in `HitPayload`; the `towers` getter field; in `strike()` after the kill: `const cell = this.board.cellAt(e.x, e.y); const paid = this.run.addKill(e.def.gold + (cell ? mintGoldBonus(this.towers(), cell, payload.source) : 0));` — the existing `popText(\`+${paid}\`)` shows the bigger number; add no new pop.
7. `TowerSystem.ts`: add `source: t` to the payload literal in `attack()`; in `update()` right after `if (!t.spec.attacks) continue;` add `if (t.spec.damage <= 0 && !t.spec.slow && t.spec.bolts === 0) continue;` (a Mint tower must never pulse: without this, `pulse.ts` would fire its wave fx, kick and pulse sfx around a tower that does nothing).
8. `GameScene.ts`: after the `new TowerSystem` line: `this.enemies.towers = () => this.towers.towers;`
9. `towerLook.ts`: new `DECORATIONS` entry after the frost ring: if `spec.goldPerKill === 0` return; `const r = 0.1 * CELL;` `g.fillStyle(PALETTE.yellowDeep, 1); g.fillCircle(16.5, 14, r); g.fillStyle(PALETTE.yellow, 1); g.fillCircle(16.5, 12, r);` (deco-local units, origin at body center; plinth is 4 below — the coin sits on the plinth's right side, clear of the body and the pips).
10. `runChecks.ts`: after `'towers.valid'`: `['towers.gold', (g) => { for (const t of g.towers.towers) if (!Number.isInteger(t.spec.goldPerKill) || t.spec.goldPerKill < 0 || t.spec.goldPerKill > t.augments.length) return \`kill-gold \${t.spec.goldPerKill} at (\${t.cell.col}, \${t.cell.row})\`; return null; }],`
11. Tests (below), then `npm run check` and `npm run smoke`.

### Pitfalls
- `tests/content.test.ts` line ~39 requires `a.first.damage > 0 || a.first.slow` — extend it with `|| a.first.goldRadius`; do not give Mint a fake slow.
- `HitPayload.source` is required: the only payload producers are the `TowerSystem.attack()` literal and `pulse.ts`'s spread — compile to confirm nothing else builds one.
- Hover/selected range ring, draft card (pink accent, 3 purple gems, Epic frame), hand icon, tower body texture, TowerPanel title/desc/slot icons all come for free from `spec.range`/`AUGMENTS`/tier UI — touch none of those files.
- Keep `describeSpec` output byte-identical for existing towers (Frost, Frost+Bolt, Splash, Bolt+splash); the existing tests assert on it.
- Chebyshev is cell-to-cell (`tower.cell` vs `board.cellAt(...)`), radius 2 inclusive, diagonal corner (2,2) in / (3,0) out; a kill off-board (`cellAt` undefined) pays normal gold.
- Copies stack but each copy pays once per kill (`t === source || near`, not additive); Mint+Bolt first keeps `goldRadius: 2` (its bolts always kill inside its own aura).
- Insert new lines next to their kin (frost in `AUGMENTS`, frost ring in `DECORATIONS`, `towers.valid` in `INVARIANTS`), never at list ends; no new sounds, HUD parts, inputs or hotkeys.

### Tests
- `tests/core/mint.test.ts` (new): chebyshev values; kill at cell distance 2 (incl. diagonal) near a Mint tower → +1, distance 3 → 0; Bolt+Mint kills → +1, Bolt+Mint+Mint → +2; Bolt+Mint inside a Mint tower's radius → +2; a Mint tower that is also the (hypothetical) source pays its copies once; Mint+Mint tower aura → +2; two Mint towers in range → +2. (Use real `towerSpec` copies; do NOT test "Frost+Mint pays 0" — the rule pays the killer's copies, Frost simply never kills.)
- `tests/core/augments.test.ts`: `spec('mint')` → `goldRadius 2`, `goldPerKill 1`, `damage 0`; `spec('bolt','mint','mint').goldPerKill === 2`; `describeSpec(spec('mint')) === 'Does not attack, kills within 2 cells drop +1 gold.'`; `describeSpec(spec('bolt','mint'))` contains 'kills drop +1 gold'; `describeSpec(spec('frost'))` unchanged.

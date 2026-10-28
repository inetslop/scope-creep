---
id: T0012
title: "Mark: the rule-changing augment that only comes as Epic"
assignee: asus
size: L
priority: 2
status: in-progress
depends_on: [T0002, T0011]
attempts: 1
created: 2026-10-28T02:08:37Z
claimed_at: 2026-10-28T04:05:34Z
epic: E4
---

## Goal
E4's jackpot: a rule-changing augment that only ever appears as Epic. It marks the enemy furthest along so that everything hurts it more — and it turns any tower's hits into markers, so it combines in a way no current augment does.

## Details
- New augment, Epic only. Closest existing: Bolt (same target — the enemy furthest along) and Frost (the support-role precedent — a first form that affects enemies without dealing damage). What is new: the **mark** — a damage multiplier on an enemy that applies to ALL damage sources (other towers, other augments, this tower's later hits), not just one tower's attack.
- As a tower's first augment (support role, no damage, no projectile): every 1.2 s it marks the unmarked enemy furthest along within 3.0 cells. A marked enemy takes 25% more damage from everything, until it dies.
- Added to a tower: "hits apply the mark" — every enemy this tower hits takes the mark. Mark potency = 25% per Mark in the tower that marked the enemy (a tower holding two Marks marks for +50%). An enemy carries at most one mark (first mark wins); the mark disappears when the enemy dies.
- Card lines (the card is always Epic; no Common/Rare values exist):
  - "Marks the enemy furthest along: +25% damage from all."
  - "Added: hits apply the mark, +25% per Mark."
- Draft rule: a card rolls its tier first, then its augment — Mark is in the pool ONLY for cards that rolled Epic. Common and Rare cards are drawn from the unchanged pool, so a Common or Rare Mark card can never exist. (With T0011's live odds Mark is ~1 of every 6 Epic cards — rarer still late in a run.)
- Look on the tower: body color pink (if an augment already uses pink, another bright unused color) with a body shape no other augment uses, so a Mark tower reads as new at a glance. A thin ink-colored ring around the tower base flashes on each mark (scale up + fade, 200 ms); each Mark in the tower adds one small tick to the ring (the existing tick look). If T0010's tier pips have landed, they stay visible — the ring and ticks sit around/below the pips, never on top of them.
- Look on the enemy: the mark is a small ink-colored down-chevron hovering above the enemy, pop-in over 100 ms. It never overlaps the enemy's body or the towers.
- Values: no damage, no kill gold, cooldown 1.2 s, range 3.0 cells. Available from the very first draft; no wave gating.

## Acceptance criteria
- [ ] A lone Mark tower marks the enemy furthest along in range every 1.2 s; the marked enemy shows the ink chevron and dies one hit sooner than an unmarked one of the same kind.
- [ ] A Bolt tower with Mark in a second slot marks the enemy it hits (the chevron appears on the hit enemy, not on the furthest one).
- [ ] A tower with two Marks marks for +50% (the marked enemy dies even sooner); an enemy never shows two chevrons.
- [ ] Over many seeded drafts, Mark appears only as Epic (purple frame, 3 gems); no Common or Rare Mark card ever appears.
- [ ] The Mark tower shows the ink ring; the ring flashes on each mark; chevron and ring are visible at 1x zoom at 412x915 and 1280x720.
- [ ] T0011's odds line and the normal draft pool for non-Epic cards are unchanged by this task.

## Design (architect, desktop)

### Files
- create `src/content/augments/mark.ts` - the Mark augment: Epic-only, support first form (marks, no damage), `added` marks on hits
- create `src/systems/attacks/mark.ts` - the `mark` attack kind: marks the unmarked enemy furthest along
- create `tests/core/mark.test.ts` - unit tests for the mark rules
- edit `src/content/types.ts` - `AttackKind` += `'mark'`; `FirstForm.mark?`; `AddedForm.mark?`; `AugmentDef` += `tier?`, `opening?`
- edit `src/content/augments/index.ts` - import + `mark,` line next to `frost,`
- edit `src/core/augments.ts` - `TowerSpec.markPct`/`markCount` (+EMPTY), towerSpec mark sum, extraShots pulse-only, rollOffer opening predicate, describeSpec lines
- edit `src/entities/Enemy.ts` - `markPct`/`markAge` fields, `mark()`, mark multiplies in `hit()`, reset in `spawn()`
- edit `src/systems/EnemySystem.ts` - `HitPayload.mark`; `strike()` applies mark + ring flash; `brokenMark()`
- edit `src/systems/TowerSystem.ts` - build `payload.mark` in `attack()`
- edit `src/systems/attacks/index.ts` - `mark,` line in `ATTACKS` + import
- edit `src/entities/towerLook.ts` - `barrelCount` guard; `DECORATIONS` mark ring/ticks line after the Frost line
- edit `src/systems/enemyMarks.ts` - `MARKS` ink down-chevron line after the health-bar line
- edit `src/systems/FxSystem.ts` - `markFlash()` after `ring()`; edit `src/audio/Sfx.ts` - `mark()` after `pulse()`
- edit `src/debug/runChecks.ts` - `enemies.mark` invariant after `enemies.count`
- edit `tests/content.test.ts` - first-form predicate += `|| a.first.mark`; edit `tests/core/augments.test.ts` - opening-draft test predicate += `|| a.opening`

### Interfaces
```ts
// content/types.ts
FirstForm:  mark?: number  // a 'mark' attack: fraction of extra damage a marked enemy takes from everything
AddedForm:  mark?: number  // hits apply the mark: enemies hit take this much more (0.25 per Mark in the tower)
AugmentDef: tier?: 'common' | 'rare' | 'epic'  // draft rolls tier first, then augment; undefined: any tier (reuse T0002's tier type if it exists)
           opening?: boolean // may be offered in the opening draft despite no damage
// core/augments.ts TowerSpec (+ EMPTY): markPct: number (0.25 per Mark in the tower); markCount: number (one ring tick per)
// systems/EnemySystem.ts HitPayload: mark: { pct: number; x: number; y: number } | undefined  // x,y = tower base (flash spot)
// entities/Enemy.ts: markPct = 0; markAge = 0; mark(pct: number): boolean  // first mark wins, resets markAge
// systems/FxSystem.ts: markFlash(x: number, y: number, radius: number): void  // ink fillRing, track 200 ms {scale: 1.25, alpha: 0}
```
Mark data: `id 'mark'`, `look {shape: 'square', color: 'pink', size: 0.22}` (square is the one unused augment shape; no augment uses pink), `first {kind: 'mark', damage: 0, range: 3, rate: 1 / 1.2, mark: 0.25}`, `added {mark: 0.25}`, `tier: 'epic'`, `opening: true`, card lines exactly: `asTower: 'Marks the enemy furthest along: +25% damage from all.'`, `asAdded: 'Hits apply the mark, +25% per Mark.'`. No new painter: icon and body paint automatically from the `AUGMENTS` loops.

### Steps
1. `content/types.ts`: add `| 'mark'` (own doc line) after `| 'pulse'`; `mark?` after `slow?` in both forms; `tier?`/`opening?` after `added` in `AugmentDef`.
2. Create `mark.ts` (above); register in `index.ts` (import after frost import, line after `frost,`).
3. `core/augments.ts`: in `towerSpec` change `else spec.bolts +=` to `else if (spec.kind === 'pulse') spec.bolts +=`; after that loop: `for (let i = 0; i < augments.length; i++) { const a = augments[i]!; const pct = i === 0 ? a.first.mark ?? 0 : a.added.mark ?? 0; if (pct > 0) { spec.markPct += pct; spec.markCount += 1; } }`; `rollOffer` opening filter → `a.first.damage > 0 || a.opening`; `describeSpec`: add `const marked = Math.round(spec.markPct * 100)`, new branch `else if (spec.kind === 'mark') { line = \`Marks the enemy furthest along: marked enemies take ${marked}% more damage\`; if (slow) line += ... }`, and append `, and its hits mark` in the shot/pulse branches when `marked > 0`.
4. `Enemy.ts`: fields; `spawn()` resets `markPct`/`markAge`; `advance()`: `if (this.markPct > 0) this.markAge += dt;`; `hit()`: `this.hp -= damage * (1 + this.markPct);`; `mark()` as above.
5. `EnemySystem.ts`: import `CELL`; `HitPayload.mark`; in `strike()` after the slow line: `if (payload.mark && e.mark(payload.mark.pct)) this.fx.markFlash(payload.mark.x, payload.mark.y, CELL * 0.43);`; add `brokenMark()` (active enemy with NaN/out-of-[0,1] `markPct`).
6. `TowerSystem.attack()`: payload += `mark: spec.markPct > 0 ? { pct: spec.markPct, x: t.x, y: t.y } : undefined`.
7. `systems/attacks/mark.ts`: local `furthestUnmarked(x, y, range, enemies)` (copy of `pickTarget` skipping `e.markPct > 0`, kept here — `core/targeting.ts` belongs to T0004); `export const mark: Attack = ({ tower, enemies, range, payload, strike, sfx }) => { const i = furthestUnmarked(tower.x, tower.y, range, enemies); if (i === -1 || !payload.mark) return false; strike(enemies[i]!, payload); sfx?.mark(); return true; };`; register in `ATTACKS`.
8. `towerLook.ts`: `barrelCount` → `spec.kind === 'shot' ? spec.shots : spec.kind === 'pulse' ? spec.bolts : 0`; after the Frost decoration: `(g, spec) => { if (spec.markCount === 0) return; fillRing(g, 0, 0, BODY * 1.95, 2, 0, Math.PI * 2, PALETTE.ink, 0.85); for (let i = 0; i < spec.markCount; i++) { const a = (i * Math.PI) / 2; fillRing(g, 0, 0, BODY * 1.95, 3, a - 0.14, a + 0.14, PALETTE.ink); } }` (ring radius ≈27.5 clears the pips at ≤22 from center — verify against T0010's pips when it lands).
9. `enemyMarks.ts`, after the health-bar line: `(g, e) => { if (e.markPct <= 0) return; const t = Math.min(1, e.markAge / 0.1); const pop = t < 1 ? 1.15 * Math.sin((t * Math.PI) / 2) : 1; const w = 6 * pop; const h = 4 * pop; const a = 3 * pop; const y = e.y - e.def.look.size * 64 - 20; g.fillStyle(PALETTE.ink, 0.9); g.fillTriangle(e.x - w, y - h, e.x - a, y - h, e.x, y); g.fillTriangle(e.x + w, y - h, e.x + a, y - h, e.x, y); }`.
10. `FxSystem.markFlash` (as in Interfaces, `DEPTH.fx`); `Sfx.mark(): this.tone(660, 0.09, 'sine', 0.3, 990);`; `runChecks` line `['enemies.mark', (g) => g.enemies.brokenMark()]`.
11. Tests: `content.test.ts` predicate `a.first.damage > 0 || a.first.slow || a.first.mark`; `augments.test.ts` opening test → `a.first.damage > 0 || a.opening`; create `tests/core/mark.test.ts`.
12. Only after T0002+T0011 land: add the tier filter to their tier→augment roll — pool for a card of tier T = base pool filtered by `a.tier === undefined || a.tier === T` (opening keeps `a.first.damage > 0 || a.opening`); if T0002 uses per-tier pool tables, put `mark` only in the Epic one. Never touch T0011's odds: Mark ≈ 1 of 6 Epic cards falls out of the 6-augment Epic pool.
13. `npm run check`.

### Pitfalls
- Pooled enemies: `markPct`/`markAge` must reset in `spawn()` or a mark (and the chevron) outlives its enemy.
- First mark wins: `Enemy.mark()` returns false when marked, and `furthestUnmarked` skips marked enemies, so each 1.2 s tick marks a new enemy and no enemy ever shows two chevrons.
- The mark applies in `strike()` before the damage: the hit that marks also deals boosted damage (intended); the flash still shows on a killing hit.
- A `mark`-kind tower must get no barrels or bolts (Mark+Bolt would otherwise show a dead barrel): the `else if` in `towerSpec` and the `barrelCount` guard.
- The flash goes through `FxSystem.track` (capped, auto-destroyed) — never destroy it manually; the chevron is drawn in the per-frame-cleared marks Graphics (no tweens); its pop-in uses `markAge` (dt), never a frame count.
- Card lines: ≤56 chars and no leading "Added:" (content test); registry lines go next to related entries (T0004/T0006/T0009/T0010/T0005 also add lines to the same registries).
- At 1x fit on 412 px the chevron is ≈8 px wide and the ring ≈40 px across — visible; no new HUD, no layout work.
- Do not change `RunFlow`, `DraftScene`, `Building` (tier wiring is T0002's), and don't add stats to `testHook.ts`.

### Tests
- `tests/core/mark.test.ts`: `spec('mark')` → `{kind: 'mark', damage: 0, range: 3, markPct: 0.25, markCount: 1, bolts: 0}`, rate ≈ `1/1.2`; `spec('mark','mark')` 0.5/2; `spec('bolt','mark')` 0.25 kind 'shot'; `spec('bolt','mark','mark')` 0.5; `spec('splash','mark')`, `spec('frost','mark')` 0.25; `spec('mark','bolt').bolts === 0`; `spec('mark','reach').range ≈ 4.05`; `describeSpec` matches /mark/ for `mark` and `bolt+mark`; `getAugment('mark').tier === 'epic'`, `.opening === true`, all other augments' tier undefined; opening roll (30 seeds) every offer has `first.damage > 0 || opening`; after T0002: seeded tiered offers — `mark` appears only on epic cards.

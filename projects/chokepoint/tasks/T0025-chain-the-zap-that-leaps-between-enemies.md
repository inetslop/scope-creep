---
id: T0025
title: "Chain: the zap that leaps between enemies"
size: L
priority: 3
status: todo
depends_on: [T0020, T0004]
attempts: 2
created: 2026-10-28T05:31:15Z
claimed_at: 2026-10-28T18:05:35Z
finished_at: 2026-10-28T21:36:24Z
epic: E4
---

## Goal
The draft can roll a new augment, Chain: a zap that strikes one enemy and leaps to the next — the first attack that changes target mid-attack. Added to any tower, it makes that tower's attack leap to one more enemy, so a chokepoint can hit a whole pocket, not just one line.

## Details
- New pool augment (rolls at all tiers like Lance and Anchor — not Epic-only; offered from the opening draft, since it has an attack of its own). **Closest existing:** Splash (the only other multi-hit: a burst that strikes everything inside a radius). **What is new:** Chain's hits pick a *new enemy one at a time* — each leap reaches up to 2.5 cells from the previous hit, so a 3-leap chain can cross the whole field, far past any burst radius. And as an added form it makes **any** first augment's attack leap to a second target (a Bolt + Chain shot strikes one enemy beyond the target; Lance's pierce is only along the path — this is a different way of hitting more than anything in the game).
- **As a tower's first augment (an attack of its own):** a zap that strikes the enemy furthest along in range, then leaps to the nearest enemy it has not yet struck, then to the next. Each leap is a flat white zigzag bolt that flashes between the two struck enemies and fades over ~100 ms, with a soft bright zap blip per leap (one new Sfx method, no louder than the hit blip). If no unstruck enemy is within leap reach, the attack ends early (2 or 1 leap is fine — an attack never wastes a leap on air).
- **When added to a tower:** each attack leaps to 1 more enemy — after the attack's last normal hit, the zap leaps to the nearest unstruck enemy within leap reach. Copies stack: two added Chains leap to two more.
- **Exact values (Common / Rare / Epic):**
  - Damage per leap: 15 / 18 / 20.
  - Leaps per attack: 3 at every tier; +1 per added Chain copy (any tier).
  - Attack cadence: every 1.2 s / 1.05 s / 0.9 s.
  - Range 2.8 cells; leap reach 2.5 cells from the previous hit.
- **Card lines (Common):** first: "A zap that leaps: 15 damage, 3 leaps, every 1.2s." / added: "Each attack leaps to 1 more enemy." The Rare and Epic cards show their own damage and cadence in the same first line; the added line is the same at every tier.
- **Look on the tower:** a body shape and a bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). A short stubby white barrel (the zap flashes out of it; it throws nothing), and one small white zigzag tick on the base ring per Chain in the tower (the existing tick look).
- The leap rule is a pure core function with unit tests (first target = furthest along; each next = nearest unstruck enemy within leap reach; an enemy already struck this attack is skipped; early stop when nothing is in reach). Closest example: the pierce-target function and its tests in the core targeting file (Lance, T0004).
- The per-leap number is the one the damage-per-second sanity test in the augment tests sees (15 × ~0.83 ≈ 12.5, the same band as the other first augments), so that test should pass unmodified — if it does not, tune the Common values inside the band, never the test's floor. A 3-leap zap being strong against packed waves is the point: that is its role, like Splash's burst.

- **16-cap (the augments module):** the pool caps at 16 augments — after registering, if the pool has more than 16, also remove the first of **Frost, then Rally, then Mint** that is still in the AUGMENTS index (a mechanical deletion, T0192's pattern; the full protocol is in T0064's task) and say which in the result.

## Acceptance criteria
- [ ] The draft can roll Chain as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's damage and cadence; the added line reads "Each attack leaps to 1 more enemy."
- [ ] A lone Common Chain tower zaps the enemy furthest along, then leaps to the nearest other enemy, then the next: three white zigzag flashes, three hit flashes, 15 damage each.
- [ ] With only two enemies in reach the attack makes two leaps and stops; an enemy already struck by this attack is never struck again by it.
- [ ] A Bolt tower with Chain in a later slot strikes one more enemy beyond its target per shot; with two added Chains it strikes two more.
- [ ] A Rare Chain tower deals 18 damage per leap and attacks every 1.05 s — visibly faster and harder than the Common one.
- [ ] The tower shows the unused shape/color body, the short white barrel and one zigzag tick per Chain copy, visible at 1x zoom at 412x915 and 1280x720.
- [ ] Each leap plays the soft zap sound (no louder than the hit blip), and a first-time player can read exactly whom the chain hit from the flashes alone.

## Design (architect, desktop)

### Files
- create `src/content/augments/chain.ts` - the augment def + `export const LEAP_REACH = 2.5`
- create `src/core/chain.ts` - pure leap rule: `pickChain`, `pickLeaps`
- create `src/systems/attacks/chain.ts` - the attack kind
- create `tests/core/chain.test.ts` - leap-rule unit tests
- edit `src/content/types.ts` - `AttackKind` gains `| 'chain'`; `FirstForm` gains `leaps?: number`; `AddedForm` gains `leaps?: number; leapDamage?: number`; `TierValues` gains `leapDamage?: number; asTower?: string`
- edit `src/content/augments/index.ts` - import + one registry line, both after `bolt`
- edit `src/core/augments.ts` - `TowerSpec` + `EMPTY` + `towerSpec()` + `describeSpec()` + import of `LEAP_REACH` (next to the bolt import)
- edit `src/core/tiers.ts` - `tierAdded()`: one line replacing `leapDamage`
- edit `src/systems/attacks/attack.ts` - `AttackContext`: two new fields
- edit `src/systems/attacks/shot.ts`, `pulse.ts` - append their struck indexes
- edit `src/systems/attacks/index.ts` - `chain` line after `shot`
- edit `src/systems/TowerSystem.ts` - `attack()` gains `struck`/`hit` wiring + new private `leap()`
- edit `src/systems/FxSystem.ts` - `zap()` method (after `wave()`)
- edit `src/audio/Sfx.ts` - `zap()` method (after `pulse()`, with the attack sounds)
- edit `src/entities/towerLook.ts` - `barrelCount`/`barrelLook` chain cases, one `DECORATIONS` entry
- edit `src/art/barrels.ts` - `BarrelLook.white`, key + fill
- edit `src/scenes/DraftScene.ts` - tier's first card line
- edit `src/debug/runChecks.ts` - one invariant line next to `towers.valid`
- edit `tests/core/augments.test.ts`, `tests/content.test.ts` - small additions

### Interfaces
```ts
// content/types.ts
export type AttackKind = 'shot' | 'pulse'
  /** A zap that strikes, then leaps between unstruck enemies. */
  | 'chain';
// FirstForm:  /** For 'chain': strikes per attack (first strike plus its leaps). */ leaps?: number;
// AddedForm:  /** Each attack leaps this many further enemies after its normal hits. */ leaps?: number;
//             /** Damage of those leaps. */ leapDamage?: number;
// TierValues: leapDamage?: number;  /** This tier's card first line (Chain shows its own numbers). */ asTower?: string;

// content/augments/chain.ts  (verify no other augment in the folder uses square or pink first; if one does, take the next free shape/color)
export const chain: AugmentDef = {
  id: 'chain', name: 'Chain',
  description: 'A zap that leaps between enemies. Added: each attack leaps to 1 more enemy.',
  asTower: 'A zap that leaps: 15 damage, 3 leaps, every 1.2s.',
  asAdded: 'Each attack leaps to 1 more enemy.',
  look: { shape: 'square', color: 'pink', size: 0.22 },
  first: { kind: 'chain', damage: 15, range: 2.8, rate: 1 / 1.2, leaps: 3 },
  added: { leaps: 1, leapDamage: 15 },
  tiers: {
    rare: { damageMul: 1.2, cooldownMul: 0.875, leapDamage: 18, asTower: 'A zap that leaps: 18 damage, 3 leaps, every 1.05s.', asAdded: 'Each attack leaps to 1 more enemy.' },
    epic: { damageMul: 4 / 3, cooldownMul: 0.75, leapDamage: 20, asTower: 'A zap that leaps: 20 damage, 3 leaps, every 0.9s.', asAdded: 'Each attack leaps to 1 more enemy.' },
  },
};
// 15*1.2=18, (1/1.2)/0.875=1/1.05; 15*4/3=20, (1/1.2)/0.75=1/0.9.

// core/chain.ts (index-based, like core/targeting.ts; TargetCandidate from './targeting')
export function pickChain(x: number, y: number, range: number, reach: number, enemies: readonly TargetCandidate[], count: number): number[]
export function pickLeaps(from: number, reach: number, enemies: readonly TargetCandidate[], struck: readonly number[], count: number): number[]
// pickLeaps: nearest unstruck+active within reach of the previous pick, repeat; stop early; never returns `from` or a struck index.
// pickChain: first = pickTarget(x, y, range, enemies); if < 0 return []; else [first, ...pickLeaps(first, reach, enemies, [first], count - 1)].

// systems/attacks/attack.ts — add to AttackContext:
/** Hits one enemy right away, with the payload's splash (a burst ring where it lands). */
hit(target: Enemy, payload: HitPayload): void;
/** Indexes (into `enemies`) of the enemies this attack struck; attacks append, so added Chain leaps know whom to skip. */
struck: number[];

// core/augments.ts — TowerSpec (after `splash`): chainLeaps (chain towers: strikes per attack), leaps (added Chain copies), leapDamage, leapReach.
// towerSpec(): chainLeaps: f.kind === 'chain' ? f.leaps ?? 0 : 0, leaps: 0, leapDamage: 0, leapReach: LEAP_REACH; EMPTY: all 0 (leapReach 0).
// added loop, after `spec.splash += e.splash ?? 0;`:
//   if (e.leaps) { spec.leaps += e.leaps; spec.leapDamage = Math.max(spec.leapDamage, e.leapDamage ?? 0); }
// core/tiers.ts tierAdded(): `leapDamage: t.leapDamage ?? a.leapDamage,` after the splash line.
// describeSpec(): new branch after the shot one: line = 'Zaps the enemy furthest along, then leaps'; if spec.leaps > 0 append ' to 1 more enemy' / ` to ${spec.leaps} more enemies`; then the slow note.
```

### Steps
1. `content/types.ts` (four small additive edits, one line each).
2. `content/augments/chain.ts`, then `content/augments/index.ts`.
3. `core/chain.ts`, then `tests/core/chain.test.ts` (below) + the test additions in `tests/core/augments.test.ts` and `tests/content.test.ts`. Run `npm run check`.
4. `core/augments.ts` and `core/tiers.ts` (spec + combine + describe).
5. `systems/attacks/attack.ts` (`hit`, `struck`), then `shot.ts`/`pulse.ts`: destructure `struck`; shot: `struck.push(...targets)` after the empty check; pulse: `struck.push(...hits)` after the empty check.
6. `systems/attacks/chain.ts` + `index.ts`. The attack: `strikes = pickChain(tower.x, tower.y, range, tower.spec.leapReach * CELL, enemies, tower.spec.chainLeaps)`; if empty return false; `struck.push(...strikes)`; `aimAt(first)`, `kick()`; bolt 1 = `fx.zap(tower.muzzle(0).x, ..., first.x, first.y)`, then `fx.zap(prev.x, prev.y, next.x, next.y)` per further strike; each strike: `hit(e, payload)` + `sfx?.zap()`; return true. (3 strikes = 3 zigzags + 3 white flashes — the hit flash is `Enemy.hit`'s existing tint.)
7. `systems/TowerSystem.ts`: in `attack()` build `const payload = {...}` once, `const struck: number[] = []`, pass `hit: (t, p) => this.enemies.hit(t, p)` and `struck` to the ctx; after the call, `if (attacked && spec.leaps > 0)` run new private `leap(t, enemies, struck, payload)`: start = struck index with the greatest `distance`; `pickLeaps(start, spec.leapReach * CELL, enemies, struck, spec.leaps)`; per leap: `this.fx.zap(prev→next)`, `this.enemies.hit(e, { ...payload, damage: spec.leapDamage })`, `this.sfx?.zap()`. Import `pickLeaps`, `HitPayload`, `Enemy`.
8. `systems/FxSystem.ts`: `zap(x1, y1, x2, y2)` — one tracked Graphics (`track(g, 110, { alpha: 0 })`, respects `MAX`): zigzag = line from (x1,y1) to (x2,y2), 5 segments, interior points offset ±4 (clamped to len/4) perpendicular to the line, `lineStyle(3.5, 0xffffff, 1)`; plus `fillCircle(x2, y2, 6)` white 0.9. If `Math.hypot(dx,dy) < 1` draw only the circle.
9. `audio/Sfx.ts`: `zap(): void { this.tone(1500, 0.04, 'square', 0.1, 700); }` (quieter than `kill`'s 0.18).
10. `entities/towerLook.ts`: `barrelCount`: `spec.kind === 'chain' ? 1 : ...`; `barrelLook`: chain first returns `{ length: 0.5, width: 1.25, bulb: false, bands: 0, white: true }` (short stubby); new `DECORATIONS` entry (after the Rapid one): n = `(spec.firstId === 'chain' ? 1 : 0) + spec.leaps` white zigzag ticks at radius `BODY * 1.8` like Rapid's: 4-point polyline, 10 units long, 2.5 wide, tangent to the circle, `i/n` spread.
11. `art/barrels.ts`: `BarrelLook.white?: boolean`; key gains `:${look.white ? 'w' : 'c'}`; when white: fill a `cardDeep` rounded rect 2 units lower first, then the rect in `PALETTE.card`.
12. `scenes/DraftScene.ts`: `const towerLine = this.add.text(textX, -2, copy.tier === 'common' || !b.tiers[copy.tier].asTower ? b.asTower : b.tiers[copy.tier].asTower!, ...)`.
13. `debug/runChecks.ts`: one line next to `towers.valid`: attacking tower with NaN damage/rate, `kind === 'chain'` with `chainLeaps < 1` or `leapReach <= 0`, or `leaps > 0` with `leapDamage <= 0` → report.
14. `npm run check`, then `npm run smoke`.

### Pitfalls
- "3 leaps" = 3 strikes: the first strike is one of them. With only 2 enemies the attack makes 2 strikes and stops — `pickChain`'s early stop gives this for free; never "waste" a zigzag on air.
- Added leaps start at the struck enemy furthest along (`max distance`), not the muzzle, and skip exactly `struck` — a 2-shot Bolt tower's second target is struck too.
- Host damage multipliers do NOT scale `leapDamage` (it's the zap's own damage, highest added copy wins, slow-style). `Frost + Chain` deals 15 via leaps — intended.
- `chain + chain` tower: 3 base strikes plus 1 added leap (the TowerSystem mechanism handles it); don't fold added copies into `chainLeaps`.
- Barrel texture key must distinguish white or it collides with the colored one; never rotate the barrel (the cardDeep underlay is its side face).
- `content/types.ts`, `core/augments.ts` are touched by T0004/T0012/T0021/T0023 too — keep every edit a single line next to the related one; T0004 (desktop) shares the `towerSpec` loop and the `AttackKind` union.
- Draft cards: all lines ≤ 56 chars (checked by `tests/content.test.ts`); T0026 (yoga) will edit the name line of the same scene later — don't touch it.
- DPS band: 15 × (1/1.2) = 12.5 keeps min > 12 and max/min < 2 unmodified — if red, tune Common numbers inside the band, never the test's floor.

### Tests
- `tests/core/chain.test.ts`, fixture `[{x:10,d:1},{x:25,d:2},{x:40,d:3},{x:100,d:9}]` (y=0, active): `pickChain(0,0,45,20,e,3)` → `[2,1,0]`; `count 5` → `[2,1,0]` (early stop); range 5 → `[]`; with index 1 inactive → `[2]`. `pickLeaps(2,20,e,[2,1],2)` → `[0]`; `pickLeaps(0,20,e,[],3)` → `[1,2]`.
- `tests/core/augments.test.ts`: `spec('chain')` → kind 'chain', chainLeaps 3, damage 15; `spec('bolt','chain')` → leaps 1, leapDamage 15; `spec('bolt','chain','chain')` → leaps 2; epic added → leapDamage 20; rare first → damage ≈ 18, rate ≈ 1/1.05.
- `tests/content.test.ts`: validate `t.asTower` with the same rules as `t.asAdded` when present; `kind === 'chain'` requires `first.leaps >= 1`.

## Attempt 1 failed (inet-racing)

Could not merge into main (conflict). The work was saved to projects/chokepoint/tasks/salvage/T0025.diff; the next attempt re-applies it on the latest code.
- Conflicts in: projects/chokepoint/game/src/art/barrels.ts, projects/chokepoint/game/src/audio/Sfx.ts, projects/chokepoint/game/src/content/augments/index.ts, projects/chokepoint/game/src/content/types.ts, projects/chokepoint/game/src/entities/towerLook.ts, projects/chokepoint/game/src/systems/TowerSystem.ts, projects/chokepoint/game/src/systems/attacks/index.ts, projects/chokepoint/game/tests/core/augments.test.ts
- Auto-resolved 3 spot(s) where both sides only added lines (clean: projects/chokepoint/game/src/audio/Sfx.ts, projects/chokepoint/game/src/content/augments/index.ts, projects/chokepoint/game/src/systems/attacks/index.ts).
- Could not resolve them: git could not continue the rebase after 3 rounds.

## Attempt 2 failed (inet-racing)

Could not merge into main (broken-after-rebase). The work was saved to projects/chokepoint/tasks/salvage/T0025.diff; the next attempt re-applies it on the latest code.
- Self-review made fixes (kept; checks pass).
- Conflicts in: projects/chokepoint/game/src/systems/TowerSystem.ts
- The conflict agent resolved them.
- After rebasing onto newer main the gate failed at "smoke".

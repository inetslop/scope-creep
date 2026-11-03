---
id: T0478
title: "Bloom: the augment that bursts where a kill lands"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T07:13:15Z
design_attempts: 1
---

## Goal
The draft's queue lands its third augment, Bloom: a shot whose second strike is the kill itself — when it kills, a burst pops at the kill spot and hits the neighbours, so holding a crowd snowballs instead of just surviving it. Its registration keeps the draft at the 16-cap: Bloom retires Rapid (the seventh removal, after Herd's Anchor and Chill's Toll).

## Details
- **First form (asTower):** kind `shot` — shoots the enemy furthest along; when that shot kills, a burst at the kill spot deals damage to the N nearest enemies within 1 cell of it.
  - Common: 10 damage per shot, range 2.6, rate 1.5/s, projectile speed 10; burst: 10 damage to the 2 nearest.
  - Rare: 13 damage, cooldown ×0.85; burst: 15 damage to the 2 nearest.
  - Epic: 17 damage, cooldown ×0.7; burst: 20 damage to the 3 nearest.
- **Added form (asAdded):** every kill this tower caused — its own shots, a beam it held to death, a burn it set (the same kill attribution Mint's "this tower's kills" uses) — pops a burst at the kill spot:
  - Common: +1 enemy, +5 burst damage.
  - Rare: +1 enemy, +10 burst damage.
  - Epic: +2 enemies, +10 burst damage.
  - By attack kind: shot, spray, pulse and beam kills all pop the burst; a burn kill pops it at the burning enemy's death; on a 0-damage tower (a Rally, Haste, Mark, Mint, Toll, Feast, Anchor or Push first) it does nothing — the card says "kills burst" and the tower never kills; that is the read, not a bug.
- **Card lines:**
  - asTower: "Shoots the furthest. When it kills, it bursts: 10 to the 2 nearest within 1 cell." (Rare: 15 to the 2 nearest. Epic: 20 to the 3 nearest.)
  - asAdded: "This tower's kills burst: +1 enemy, +5 damage." (Rare: +1 enemy, +10 damage. Epic: +2 enemies, +10 damage.)
- **Look:** icon hexagon, pink, size 0.22 (a shape-and-color pair no augment has). On the tower the first augment's mark wears it on its barrel (T0469's vocabulary); when a burst pops, one soft ring in Bloom's pink at the kill spot, ~1 cell radius, quick fade (the FxSystem ring, the working-aura's class) — the only board mark the augment adds.
- **The burst goes through the normal damage path:** Mark's +25% applies to it, Spray's added crit can double it, and a kill the burst causes is a normal kill (its gold, the combo chain, Mint's auras and the tower's milestones all apply) — the snowball is the point.
- **The 16-cap:** Rapid leaves the draft's index (codex shows 16 cards, Bloom in, Rapid out); a save holding a Rapid tower loads (the Lead-removal's save path).

## Compared with what exists
| Existing | What it shares | What Bloom does that it can't |
| --- | --- | --- |
| Bolt | first `kind shot`, targets the furthest | Bolt's damage lands on hit, on its own target only; Bloom's second strike lands on kill, at the kill spot, on the neighbours |
| Lance | first `kind shot` | Lance's line pierces on hit; Bloom pops a radius only when its target dies — Lance never hits the crowd around a kill |
| Rapid | first `kind shot` | Rapid trades per-hit damage for hit frequency on every hit; Bloom's burst exists only when the hit kills, and its size grows with copies Rapid's rate swap can't |
| Reach | first `kind shot` | Reach is one heavy shot on its target; Bloom adds a kill-triggered pop on top of a shot heavy or light |
| Splash | a burst around its hits | Splash bursts every hit, on hit, capped at 3; Bloom bursts only on kill, at the kill spot, with a count that grows per copy — on a target that survives, Bloom is a plain shot |
| Mint | "this tower's kills" attribution | Mint turns kills into gold; Bloom turns kills into a damage burst on the survivors |
| Ember | an on-death effect (the burn leap, T0059) | the leap copies one burn to one neighbour on a burning death; Bloom pops a radius on any kill the tower caused, for damage |

## Acceptance criteria
- [ ] The draft can offer Bloom at the pool's tier odds (Common/Rare/Epic), never twice in one offer; the owned dot, the ×N count and the tier chime treat it like every card.
- [ ] A Common Bloom tower shoots the furthest at 10 per shot (range 2.6, 1.5/s); when that shot kills, a pink ring pops at the kill spot and the 2 nearest enemies within 1 cell take 10.
- [ ] The Rare and Epic firsts read 13 (burst 15) and 17 (burst 20 to 3).
- [ ] Bloom added to a damage tower: every kill it causes pops the burst at +1 enemy/+5 (Common), +1/+10 (Rare), +2/+10 (Epic); on a Beam tower the burst pops when the beamed enemy dies; on a pure support tower it does nothing.
- [ ] A burst kill is a normal kill: it pays its gold, extends the combo chain, pays Mint auras and counts for the tower's milestones.
- [ ] Rapid is out of the draft, the hand and the codex; the codex shows 16 cards; a save holding a Rapid tower loads; a full run plays end to end on the new 16.

## Design (architect, cachyos-x8664)

Bloom is the draft pool's third augment, replacing Rapid (the 16-cap). Two forms, same mechanic: first form is a shot that bursts on kill; added form makes the tower's kills burst. The burst goes through the normal damage path (Mark's +25% applies, Spray's crit can double it, a burst kill is a normal kill). The 16-cap: Rapid out of draft/hand/codex; codex shows 16 cards; a save holding a Rapid tower still loads.

### Files

**NEW** `src/content/augments/bloom.ts`:
- `id: 'bloom'`, `name: 'Bloom'`, `look: { shape: 'hexagon', color: 'pink', size: 0.22 }`.
- `first`: `{ kind: 'shot', damage: 10, range: 2.6, rate: 1.5, projectileSpeed: 10, killBurst: { count: 2, damage: 10 } }`.
- `added`: `{ killBurst: { count: 1, damage: 5 } }`.
- `tiers.rare`: `{ damageMul: 1.3, cooldownMul: 0.85, killBurstCount: 2, killBurstDamage: 15, addedKillBurstCount: 1, addedKillBurstDamage: 10, asTower: 'When it kills: 15 to the 2 nearest within 1 cell.', asAdded: "This tower's kills burst: +1 enemy, +10 damage." }`.
- `tiers.epic`: `{ damageMul: 1.7, cooldownMul: 0.7, killBurstCount: 3, killBurstDamage: 20, addedKillBurstCount: 2, addedKillBurstDamage: 10, asTower: 'When it kills: 20 to the 3 nearest within 1 cell.', asAdded: "This tower's kills burst: +2 enemies, +10 damage." }`.
- `description`: 'Shoots the furthest, and every kill it makes bursts at the spot.'
- `asTower`: 'Shoots the furthest. When it kills: 10 to the 2 nearest within 1 cell.'
- `asAdded`: "This tower's kills burst: +1 enemy, +5 damage."

**`src/content/augments/index.ts`**:
- Remove `rapid` from `AUGMENTS` (the import and the array entry).
- Add `bloom` to `AUGMENTS` (the import and the array entry).
- Add `const RETIRED: readonly AugmentDef[] = [rapid];`.
- Update `getAugment`:
```ts
export function getAugment(id: string): AugmentDef {
  const def = byId.get(id) ?? RETIRED.find((a) => a.id === id);
  if (!def) throw new Error(`unknown augment "${id}"`);
  return def;
}
```

**`src/core/saveRun.ts`**:
- Import `getAugment` from `../content/augments`.
- Update `isCopy`:
```ts
function isCopy(v: unknown): v is AugmentCopy {
  if (!v || typeof v !== 'object') return false;
  const { id, tier } = v as { id?: unknown; tier?: unknown };
  if (typeof id !== 'string' || typeof tier !== 'string') return false;
  try { getAugment(id); return TIER_ORDER.includes(tier as Tier); } catch { return false; }
}
```

**`src/content/types.ts`**:
- `FirstForm`: add `killBurst?: { count: number; damage: number }`.
- `AddedForm`: add `killBurst?: { count: number; damage: number }`.
- `TierValues`: add `killBurstCount?`, `killBurstDamage?`, `addedKillBurstCount?`, `addedKillBurstDamage?`.

**`src/core/tiers.ts`**:
- `tierFirst`: add `killBurst: f.killBurst ? { ...f.killBurst, damage: t.killBurstDamage ?? f.killBurst.damage, count: t.killBurstCount ?? f.killBurst.count } : undefined,`.
- `tierAdded`: add `killBurst: a.killBurst ? { ...a.killBurst, damage: t.addedKillBurstDamage ?? a.killBurst.damage, count: t.addedKillBurstCount ?? a.killBurst.count } : undefined,`.

**`src/core/augments.ts`**:
- `TowerSpec`: add `killBurstCount: number` and `killBurstDamage: number`.
- `EMPTY`: add `killBurstCount: 0` and `killBurstDamage: 0`.
- `towerSpec`: add `spec.killBurstCount = f.killBurst?.count ?? 0;` and `spec.killBurstDamage = f.killBurst?.damage ?? 0;`.
- In the loop: add `spec.killBurstCount += e.killBurst?.count ?? 0;` and `spec.killBurstDamage += e.killBurst?.damage ?? 0;`.

**NEW** `src/systems/enemyHooks/bloomBurst.ts`:
```ts
import { CELL } from '../../config';
import { PALETTE } from '../../content/palette';
import { pickNearest } from '../../core/targeting';
import type { EnemyHookContext, KillEvent, MakeEnemyHook } from './hook';

export const bloomBurst: MakeEnemyHook = (ctx): EnemyHook => {
  const onKill = (kill: KillEvent): void => {
    const spec = kill.source.spec;
    if (!spec.killBurstCount || !spec.killBurstDamage) return;
    const targets = pickNearest(kill.enemy, 1 * CELL, ctx.enemies.all, spec.killBurstCount);
    for (const t of targets) {
      ctx.enemies.strike(t, { damage: spec.killBurstDamage * kill.source.cellMul, source: kill.source });
    }
    ctx.fx.ring(kill.enemy.x, kill.enemy.y, CELL, PALETTE.pink);
  };
  return { onKill };
};
```

**`src/systems/enemyHooks/index.ts`**:
- Add `import { bloomBurst } from './bloomBurst';`.
- Add `bloomBurst` to `ENEMY_HOOKS`.

**`src/art/barrelMarks.ts`**:
- Remove `rapid: 'square'` from `BARREL_MARKS`.
- Add `bloom: 'square'` to `BARREL_MARKS`.

**`tests/core/augments.test.ts`**, **`tests/core/saveRun.test.ts`**, **`tests/core/towerDps.test.ts`**, **`tests/core/ember.test.ts`**:
- Swap `rapid` for `bloom` in the imports and the tests.
- Update the tests' expected values to match Bloom's behavior.

**`debug/runChecks.ts`**:
- Add the invariant: `if (spec.damage === 0 && (spec.killBurstCount > 0 || spec.killBurstDamage > 0)) throw new Error('...')`.

### Pitfalls
- The first copy's added form does NOT add to its own base (a Common Bloom tower is 2/10, not 3/15).
- The burst damage (10/15/20) does NOT equal `shot damage × damageMul` (10/13/17).
- A 0-damage tower never deals the killing blow, so "on a pure support tower it does nothing" holds naturally.
- Removing `rapid` from `AUGMENTS` makes a save holding a Rapid tower fail; the `RETIRED` fallback in `getAugment` handles this.
- `isCopy` must use try/catch because `getAugment` throws on unknown ids.

### Tests
- `npm run check` must pass.
- `npm run smoke` must pass.

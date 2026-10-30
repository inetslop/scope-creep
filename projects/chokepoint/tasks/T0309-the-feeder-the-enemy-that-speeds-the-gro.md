---
id: T0309
title: "The Feeder: the enemy that speeds the group around it"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T21:36:17Z
---

## Goal
The enemy queue's next: from wave 13, a slow orange shape that makes every enemy within two cells of it walk 25% faster while it lives — the first enemy that changes the pace of other enemies, so slows and stops start to get outrun and the focus decision lands on it.

## Details
- **The enemy:** id `feeder`; behavior `walk`; hp 120; speed 0.9 (the slow norm); gold 10; livesCost 1; threat 1 (the reserved-special norm: the Hauler's, the Mute's, the Bulwark's, the Ward's); fromWave 13; a regular type — it brings the 10-regular cap to 10 of 10. Description: "Feeds the group: everything within two cells walks 25% faster while it lives."
- **How often:** one on waves 13, 17, 21, 25, … (every 4th from 13), added to the wave's plan by the reserved pattern the Hauler (9+), Mute (11+) and Bulwark (12+) use. The sequence never lands on a quiet wave (multiple of 4) or a boss wave (multiple of 10), so no re-add or boss interplay is needed.
- **The feed (the new mechanic):** while a Feeder is alive, every other enemy whose center is within 2 cells of the Feeder's center walks 1.25× the speed it would walk without the feed. It multiplies with everything that already changes speed: a Frost slow (×0.6) inside the feed walks at ×0.75 of base; a Sprinter's ramp and a Haste buff apply first and the feed sits on top of them. Per-frame: the moment an enemy leaves the radius its speed is back. The Feeder is never fed by its own feed. Two overlapping feeds can't happen (one per wave) — and the feed applies once, never twice, if ever they did.
- **A hook, not a field:** the feed runs on the per-frame enemy-hook pattern the Mute's silence uses — the def carries only its numbers and look, no new field on the enemy type (the Mute has none).
- **The tell:** while at least one other enemy is being fed, a thin ring in the Feeder's own color blooms from its token out to the 2-cell radius and fades over 1 s, once per second (the working-aura language, T0055 and the Mute's T0219). Nothing in range, no ring.
- **Look:** a new `ripple` silhouette — a filled circle with one thin concentric ring at ~1.35× its radius (the only enemy wearing a ring on its token; the Mute is a hollow ring, nothing inside) — orange (the family color of speed, the Sprinter's), size 0.26.
- **What it punishes and what answers it:** slows and stops — a group inside the feed outruns a 40% slow (0.6 × 1.25 = 0.75), and the waves from 13 on are the bigger, tighter ones. The answers: kill it early (120 hp, mid-pack); control it (unlike the Ward it is fully controllable — slow, root and push all hold it, and the feed multiplies with those slows); or clear it out of the pack (Splash, Spray up close, the beam).
- **The reference (no new screen):** the wave preview shows its token ×1 on its waves; the name tag says "Feeder" on its first spawn (T0085); the enemies reference grows its row from the def (T0252), in fromWave order between the Bulwark (12) and the Ward (15).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | `walk`, the basic walker | the Feeder changes the pace of the group around it; a Dot only walks |
| Block | `walk`, slow and tough | the Feeder's slow walk feeds the enemies beside it; a Block only takes damage |
| Colossus | `walk`, the whole wave in one boss shape | the Colossus leaves the fight on a clock; the Feeder stays in it and feeds the wave around it |
| Guard | `walk`, a boss escort | the Guard shields one other shape; the Feeder quickens every enemy within 2 cells |
| Titan | `walk`, a boss whose state follows another enemy | the Titan's damage turns on the Guard; the Feeder's feed is its own, on while it lives |
| Orb | `walk`, a boss that makes more enemies | the Orb turns itself into two Shards once, at half hp; the Feeder stays whole and feeds instead of splitting |
| Shard | `walk`, a piece of a split | a piece: it takes the feed, never gives it |
| Sprinter | `walk`, a shape that changes under fire | the Sprinter speeds itself up when it is hit; the Feeder is never faster itself — it speeds the enemies around it |
| Splitter | `walk`, a death that makes more enemies | the Splitter's split is its death, once; the Feeder's feed is on while it lives, and it keeps walking |
| Hauler | `walk`, big and slow | the Hauler's fortune rides on its own leak; it never changes the group's pace |
| Mute | `walk`, a 2-cell aura that works on something else | the Mute's aura stills towers; the Feeder's aura quickens enemies — the other direction, the other side of the board |
| Ward | `walk`, ignores all control | the Ward shrugs off slow, root and push; the Feeder is fully controllable, and its feed multiplies with tower slows |
| Bulwark | `walk`, a plate that faces the road | the Bulwark halves the hits it faces; the Feeder changes no hit, only the pace of the group |
| Splinter | `walk`, a fast piece | a piece that only takes the feed; it never feeds |

## Acceptance criteria
- [ ] Wave plans 13, 17, 21, 25, … each carry exactly one Feeder (the reserved pattern); every other wave plan is unchanged; no Feeder on a boss wave or a quiet wave.
- [ ] An enemy within 2 cells of a live Feeder walks 1.25× the speed it would walk without it; a Frost slow and a Sprinter ramp multiply into it (a ×0.6 slow inside the feed walks at ×0.75 of base); the moment it leaves the radius its speed is back; the Feeder is never faster itself; the feed never applies twice to one enemy.
- [ ] The ring blooms from the token out to the 2-cell radius and fades over 1 s, once per second, only while at least one other enemy is being fed.
- [ ] The Feeder is a regular enemy in every way: it takes Tough's hp factor (T0285), slow, root, push and silence; a kill pays 10 gold (combo, Mint and "stopped" count); a leak costs 1 life; the next-wave button's count includes it.
- [ ] Its first spawn of a run wears the name tag "Feeder"; the enemies reference lists it between the Bulwark and the Ward.
- [ ] New unit tests pin the feed (the radius cut-in and cut-out, the 1.25×, the slow and ramp composition, the no-stack) and the wave-mix waves; npm run check and the 1280×720 / 412×915 smoke pass.

## Design (architect, desktop)

### Files
- create `src/content/enemies/feeder.ts` - the Feeder def (model on `mute.ts`)
- create `src/core/feed.ts` - the feed rule: `FEED_REACH`, `FEED_MUL`, `Feedable`, `applyFeed()`, `speedFactor()` (pure, unit-tested)
- create `src/systems/enemyHooks/feed.ts` - the per-frame hook: sets each enemy's `feedMul` via `applyFeed`, blooms the working ring (model on `muteJam.ts`)
- create `tests/core/feed.test.ts` - feed rule tests
- create `tests/systems/feed.test.ts` - hook ring tests (fake context, model on `tests/systems/nameTag.test.ts`)
- edit `src/content/types.ts` - `'ripple'` added to the `Shape` union (line 4)
- edit `src/content/enemies/index.ts` - `import { feeder } from './feeder';` after the `dot` import; `feeder,` in `ENEMIES` between `mute,` and `ward,`
- edit `src/core/waves.ts` - line 137: add `&& e.id !== 'feeder'` between `bulwark` and `ward` in the walkers filter; after line 175 (the Bulwark push) add the reserved line
- edit `src/entities/Enemy.ts` - two new fields, spawn resets, the walk speed line, one import
- edit `src/systems/enemyHooks/index.ts` - `import { feed } from './feed';` after the `muteJam` import; `feed,` after `muteJam,` in `ENEMY_HOOKS`
- edit `src/art/paint.ts` - a `ripple` block in `shapePath` (after the `ring` block)
- edit `src/art/shapes.ts` - `ripple: 0` in the `sides` record
- edit `src/art/entities.ts` - texture room for the Feeder's ring (lines 13-15)
- edit `src/debug/runChecks.ts` - one invariant after `'mute.jam'`
- edit `tests/core/waves.test.ts` - three filter/test edits (below)

### Interfaces
```ts
// src/content/enemies/feeder.ts
export const feeder: EnemyDef = {
  id: 'feeder', name: 'Feeder',
  description: 'Feeds the group: everything within two cells walks 25% faster while it lives.',
  behavior: 'walk', hp: 120, speed: 0.9, gold: 10, livesCost: 1,
  threat: 1, // placeholder: the Feeder never gets drawn from the budget
  fromWave: 13,
  look: { shape: 'ripple', color: 'orange', size: 0.26 }, // Block's size; the ring is the new silhouette
};

// src/core/feed.ts
export const FEED_REACH = 2;          // cells; the Mute's silence has the same reach
export const FEED_MUL = 1.25;
export interface Feedable { x: number; y: number; feeder: boolean; feedMul: number; }
export function applyFeed(enemies: readonly Feedable[]): boolean; // resets every feedMul to 1, sets FEED_MUL on every non-feeder within FEED_REACH cells (squared distance <= (FEED_REACH*CELL)^2) of a feeder; returns true when at least one non-feeder is fed
export function speedFactor(slowPct: number, hastePct: number, feedMul: number): number; // (1-slowPct)*(1+hastePct)*feedMul
```
`src/core/waves.ts` reserved line (after the Bulwark one, before the Ward comment):
```ts
  // The Feeder: one on 13, 17, 21, ... (it never comes from the budget; its threat is a placeholder).
  if (wave >= 13 && (wave - 13) % 4 === 0) reserved.push('feeder');
```
`src/entities/Enemy.ts`: fields after `hastePct` (line 50): `/** Whether it is a Feeder: it feeds the group around it and is never fed itself (core/feed.ts). */ feeder = false;` and `/** The feed's factor its walk takes this frame (1: unfed); set by the feed hook (systems/enemyHooks/feed.ts). */ feedMul = 1;`. In `spawn()` after `this.hastePct = 0;`: `this.feeder = def.id === 'feeder'; this.feedMul = 1;`. Replace line 166 with (import `speedFactor` from `../core/feed`, next to the `../core/root` import):
```ts
    const speed = this.rootLeft > 0 ? 0 : this.speed * speedFactor(this.slowPct, this.hastePct, this.feedMul);
```
`src/art/paint.ts` `shapePath`, after the `ring` block:
```ts
  // A ripple: a solid circle with one thin concentric ring beyond its edge (the Feeder). The ring is
  // an annulus — the outer circle, then the inner one traced the other way — so the usual fill keeps
  // the ring solid and the gap between token and ring open.
  if (shape === 'ripple') {
    const mid = radius * 1.35;
    const w = Math.max(1, radius * 0.16);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.arc(x, y, mid + w / 2, 0, Math.PI * 2);
    ctx.arc(x, y, mid - w / 2, 0, Math.PI * 2, true);
    return;
  }
```
`src/art/entities.ts` lines 13-15 become:
```ts
    const r = e.look.size * CELL;
    const depth = tokenDepth(r);
    // The Feeder's ripple ring reaches past its token: the texture's room must cover it.
    const size = (e.id === 'feeder' ? tokenRoom(r * 1.4, depth) : tokenRoom(r, depth)) * 2;
```
`src/systems/enemyHooks/feed.ts`: export `feed: MakeEnemyHook` — `update()`: `const active = enemies.all.filter((e) => e.active); const feeding = applyFeed(active); const f = active.find((e) => e.def.id === 'feeder'); if (f === undefined) return;` then, exactly like `muteJam.ts` lines 43-66 but for one feeder: keep one `{ g, tw }` (a `let ring`, `drop()` helper), move the ring with `r.g.setPosition(f.x, f.y)`, and pulse only `if (feeding && scene.time.now - lastPulse >= BEAT_MS)`: `fillRing(g, 0, 0, FEED_REACH * CELL, 3, 0, Math.PI * 2, PALETTE.orange, 0.9)`, start scale `(0.26 * CELL) / (FEED_REACH * CELL)`, tween to `scale: 1, alpha: 0` over `BEAT_MS = 1000` `Quad.easeOut`, `onComplete` deletes the ring and `g.destroy()` guarded by `if (ring?.g === g)`. `onKill`/`onLeak`: `if (enemy.def.id === 'feeder') drop();`.
`src/debug/runChecks.ts` after `'mute.jam'`:
```ts
  ['feed.active', (g) => {
    const fed = g.enemies.all.some((e) => e.active && e.feedMul > 1);
    if (!fed) return null;
    return g.enemies.all.some((e) => e.active && e.def.id === 'feeder') ? null : 'an enemy is fed with no Feeder on the road';
  }],
```

### Steps
1. Create `src/content/enemies/feeder.ts` exactly as above.
2. Add `'ripple'` to `Shape` in `src/content/types.ts` (after `'ring'`); add `ripple: 0` to the `sides` record in `src/art/shapes.ts`; add the `ripple` block to `shapePath` in `src/art/paint.ts`; add the texture-room line in `src/art/entities.ts`; register the def in `src/content/enemies/index.ts`.
3. Create `src/core/feed.ts` (`import { CELL } from '../config'`).
4. Edit `src/entities/Enemy.ts`: fields, spawn resets, the speed line, the import.
5. Edit `src/core/waves.ts`: walkers filter + reserved line (keep it after the Bulwark line — the splitter count is computed before it and must not change).
6. Create `src/systems/enemyHooks/feed.ts`; register it in `src/systems/enemyHooks/index.ts`; add the invariant in `src/debug/runChecks.ts`.
7. Write `tests/core/feed.test.ts`: (a) an enemy exactly at `FEED_REACH * CELL` is fed (`<=`), at `1.01 *` it is not; (b) the Feeder's own `feedMul` stays 1, and `applyFeed([e])` with the Feeder gone returns false and leaves `feedMul` 1; (c) two feeders covering one enemy leave it at `FEED_MUL`, never `FEED_MUL * FEED_MUL`; (d) `speedFactor(0.4, 0, 1.25)` is 0.75, `speedFactor(0, 0.3, 1.25)` is 1.375, and `(2.52 + 0.28) * CELL * speedFactor(0, 0, FEED_MUL)` is `3.5 * CELL` (the ramp raises the base, the feed sits on top).
8. Write `tests/systems/feed.test.ts` with a fake context (fake `scene.time.now` via a getter, `add.graphics()` returning a chainable object with `destroy()`, `tweens.add()` counting pulses and returning `{ remove() {} }`): (a) feeder + one enemy in range: pulses at t=1000, none at t=1500, one more at t=2000; make the fed enemy inactive — no pulse at t=3000; (b) after a pulse, `hook.onKill` with the feeder destroys the ring (`destroy()` called once) and no further pulses.
9. Edit `tests/core/waves.test.ts`: line 17 and line 83 filters — add `&& s.enemy !== 'feeder'` (line 83 also gains `&& s.enemy !== 'mute' && s.enemy !== 'bulwark' && s.enemy !== 'ward'` so it matches the real rule); insert a new `it` between the Bulwark and Ward tests:
```ts
  it('sends exactly one Feeder on 13, 17, 21, ... — its slot is never a quiet or a boss wave', () => {
    for (let wave = 1; wave <= 40; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const expected = wave >= 13 && (wave - 13) % 4 === 0 ? 1 : 0; // 13 + 4k is never a multiple of 4 or of 10
      expect(plan.spawns.filter((s) => s.enemy === 'feeder').length).toBe(expected);
      if (expected === 1) {
        expect(isQuietWave(wave)).toBe(false);
        expect(plan.spawns.some((s) => s.enemy !== 'feeder')).toBe(true); // never a Feeder-only wave
      }
    }
  });
```
10. `npm run check`, then `npm run smoke`. The wave preview, name tag, enemy reference row and next-wave count all read the def/plan and need no changes.

### Pitfalls
- `shapePath` winding: the inner annulus arc MUST be traced with `anticlockwise = true`, or the nonzero fill eats the ring or fills the gap.
- Texture room: without the `tokenRoom(r * 1.4, depth)` special case the ring is clipped at a hard texture edge.
- Seeded plans: the Feeder must stay out of the `walkers` filter, or every wave's draws shift and all seeded plans change; other waves must stay byte-identical to today.
- No re-add line: the Mute/Bulwark/Ward "always sends its one" halving guards do NOT get a Feeder copy — its slot never lands on a quiet wave.
- Pooling: `feedMul` and `feeder` reset in `spawn()`; the hook's `update` must run `applyFeed` even when no Feeder is alive (it is what resets factors), and the early return comes after it.
- Feed the shared `speed` only, not the Dasher's surge line (line 192) — slow "only affects the crawl", the feed is in the same family.
- The ring beat runs on `scene.time.now` (real ms), not `dt`, so it reads the same at 1x and 2x speed; kill/leak must `drop()` the ring even mid-pulse, and `onComplete` must guard against a replaced ring.

### Tests
- `tests/core/feed.test.ts` and `tests/systems/feed.test.ts` (new, as in steps 7-8); edits to `tests/core/waves.test.ts` (step 9).

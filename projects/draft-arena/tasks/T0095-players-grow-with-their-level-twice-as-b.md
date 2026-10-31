---
id: T0095
title: "Players grow with their level: twice as big by level 18"
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T15:20:51Z
claimed_at: 2026-10-31T17:34:04Z
---

## Goal
A strong player looks strong: the critter grows as it levels up, so everyone can read who is ahead at a glance, and the leader is a bigger target.

## Details
- A director (src/content/directors/growth.ts) sets every living player's radius each tick from their level: `rules.player.radius * (1 + (level - 1) / 17)`. Level 1 stays as today (18), level 10 is about 27.5, level 17 about 34.9, and level 18 would be 36; a prestige (level 18 sends a player back to level 1) and a knockout make them small again.
- Smooth: the radius moves toward that size over about 0.5 s (a level-up never pops it in one frame), and a prestige shrinks it the same way.
- The engine follows a player's radius everywhere (hits, contact with monsters, pickups, the walls, the name and the hp bar), so nothing else needs changing. Check the content for anything that assumes `rules.player.radius` as the size of a player (an area or effect sized to a player) and use the player's own radius there.
- Hats and other accessories already scale with the radius.

## Acceptance criteria
- [ ] A level 1 player is the size it is today; a level 17 player is almost twice as wide.
- [ ] Growing and shrinking (after a prestige or a knockout) are smooth, never a jump.
- [ ] Monsters, shots and pickups touch a grown player at its new edge.

## Design (architect, desktop)

### Files
- create `src/content/directors/growth.ts` - the director: every tick eases each living player's `p.radius` toward `RULES.player.radius * (1 + (p.level - 1) / 17)` over 0.5 s
- edit `src/content/directors/index.ts` - one import + one registry line for `growth`
- edit `src/content/areas/mark.ts` - the mark's ring follows the marked player's real head via a slot (its pulse is a no-op today; draw hard-codes `RULES.player.radius`)
- edit `src/content/areas/crown.ts` - same fix for the top scorer's crown
- edit `src/content/areas/prestige-stars.ts` - same fix for the prestige stars fan
- edit `src/content/directors/mark.ts` - `spot()` (pop/burst position) uses the player's own radius; then the `RULES` import goes unused and must be removed
- create `tests/growth.test.ts` - pins the size formula and the 0.5 s smoothing through `growth.tick`

Nothing else assumes the player's size: `areas/wound.ts` already hugs `a.owner.radius` via a slot, accessories/patterns use `w.radius`, and the engine already reads `p.radius` for hits, contact, pickups, walls, grid lookups and the network (the protocol sends a radius that differs from the kind default — `engine/sim/match.ts:371` says content may grow players).

### Interfaces
No new types. Exact contents:

`src/content/directors/growth.ts`:
```ts
import type { DirectorDef } from '../../../engine/api.ts';
import { RULES } from '../rules.ts';

const SMOOTH = 0.5; // seconds for the radius to reach its level's size

/** The radius a player has at a level: level 1 is the base, level 18 would be twice it. */
function sizeAt(level: number): number {
  return RULES.player.radius * (1 + (level - 1) / 17);
}

/**
 * Players grow with their level: a level 17 player is almost twice as wide as a level 1 one, so
 * the leader reads at a glance (and is a bigger target). The radius eases toward the level's size
 * over 0.5 s, so a level-up never pops in one frame; a prestige or a knockout puts the player
 * back at level 1 and shrinks it the same way (respawn keeps the same object and its radius).
 */
export const growth: DirectorDef = {
  id: 'growth',
  name: 'Growth',
  description: 'Players grow with their level: twice as wide at the top, smoothed over half a second.',
  tick(ctx, _mem, dt) {
    const f = Math.min(1, dt / SMOOTH);
    for (const p of ctx.players()) {
      const target = sizeAt(p.level);
      p.radius += (target - p.radius) * f;
    }
  },
};
```

`src/content/directors/index.ts`: add `import { growth } from './growth.ts';` right after the `wound` import (line 9), and `growth,` right after `wound,` in `DIRECTORS` (line 26).

`src/content/areas/mark.ts`: replace line 20 `const y0 = -(RULES.player.radius + 12); // ...` with `const y0 = -((e.slots[0] || RULES.player.radius * 100) / 100 + 12); // 12 units above the marked player's actual head`, and replace `pulse() { /* a marker: no damage */ },` with `pulse(_ctx, a) { a.slots[0] = Math.round(a.owner.radius * 100); },`.

`src/content/areas/crown.ts`: same two changes — line 20 becomes `const y0 = -((e.slots[0] || RULES.player.radius * 100) / 100 + 12);` and the no-op pulse becomes `pulse(_ctx, a) { a.slots[0] = Math.round(a.owner.radius * 100); },`.

`src/content/areas/prestige-stars.ts`: in `pulse`, add the line `a.slots[1] = Math.round(a.owner.radius * 100);` after the existing `a.slots[0] = ...` line; in `draw`, replace line 22 `const r = RULES.player.radius; // ...` with `const r = (e.slots[1] || RULES.player.radius * 100) / 100; // top of the head is y = -r`.

`src/content/directors/mark.ts`: replace lines 62-64 with:
```ts
function spot(u: { x: number; y: number; radius: number }) {
  return { x: u.x, y: u.y - (u.radius + 12) };
}
```
(all three call sites pass a `Player`, which has `radius`), and delete line 2 `import { RULES } from '../rules.ts';` (unused after this).

### Steps
1. Create `src/content/directors/growth.ts` exactly as above.
2. Add its import and registry line in `src/content/directors/index.ts`.
3. Apply the two-line change to `src/content/areas/mark.ts`.
4. Apply the two-line change to `src/content/areas/crown.ts`.
5. Apply the two-line change to `src/content/areas/prestige-stars.ts`.
6. Apply the `spot()` change and the import removal in `src/content/directors/mark.ts`.
7. Create `tests/growth.test.ts`: stub `const players: Player[] = [{ type: 'player', level: 17, radius: 18 } as unknown as Player]; const ctx = { players: () => players } as unknown as Ctx;` (copy the `as unknown as Player`/`Ctx` stub style from `tests/kill-coins.test.ts`), then: level 1 at 18 stays 18 after `growth.tick(ctx, {}, 0.5)`; level 17 at 18 with `dt 0.5` reaches `18 * 33 / 17` (≈34.76, `toBeCloseTo`); level 1 at 36 with `dt 0.5` back to exactly 18 (knockout shrink); level 17 at 18 with `dt 1/30` moves to `18 + (18 * 33 / 17 - 18) / 30` (no pop); level 17 at 18 with `dt 1` lands exactly on the target, never past it (the `Math.min(1, ...)` clamp).
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Use `||`, not `??`, for the slot defaults in mark/crown/prestige-stars: slots start at 0 (the area's pulse fires on its first tick, one tick after birth), and `0` as a radius would park the ring inside the body. (`wound.ts` gets away with `??` only because it early-returns at 0.)
- The smoothing must be `dt / SMOOTH`-scaled, never a fixed per-frame amount: frame-rate independence, and `Math.min(1, ...)` stops an abnormal tick from overshooting the target.
- Never touch `RULES.player.radius` itself — it is the spawn/protocol default; the director only reads it.
- Do not sync the radius through `slots`: the network protocol already sends a player's radius when it differs from the kind default by ≥ 1 (grown players cost 2 bytes/tick, negligible).
- T0082 (in progress) and T0087 both edit `src/content/directors/mark.ts`: change only `spot()` and the RULES import there; no reformatting, no touching `tick`/`onKill`.
- `ctx.players()` lists only living players; that is correct — a dead player's object is reused on respawn with level 1, so its shrink starts on the first tick after respawn.

### Tests
`tests/growth.test.ts` as specified in step 7 (pins the formula and smoothing; everything else is covered by `engine/tests/`, including the 3-minute long match and the 60-player budget).

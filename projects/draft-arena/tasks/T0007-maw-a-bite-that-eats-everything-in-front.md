---
id: T0007
title: "Maw: a bite that eats everything in front of you"
size: L
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T02:37:00Z
epic: E1
---

## Goal
The Body tree gets its own weapon: a close-range bite that hits the whole crowd in front of you at once. Body stops being "stats for the Bolt" and becomes a playstyle: rush in (Swift), stand there (Vigor, Chill), eat the wave (Maw, Chomp).

## Details
- New weapon upgrade `src/content/upgrades/maw.ts` (closest example: `src/content/upgrades/bolt.ts`, a weapon). Text (shown on its talent row, must fit at 412x915): "Every 0.9 s, if an enemy is close, bites everything in front. Each rank: +6 bite damage." `maxLevel: 5`. Look: shape hexagon, color ice.
- The bite is not a projectile — it is a ground area, new file `src/content/areas/bite.ts` (closest example: the splash area T0003 is building, `src/content/areas/splash.ts`; if it is not built yet, read T0003's Design section). The zone: a circle of radius 75 centred 55 units in front of the player, aimed at the nearest enemy within 130 — if no enemy is within 130, Maw waits and never bites at air. Single strike: the zone lives 0.2 s and strikes once. 25 damage at rank 1, +6 per rank (49 at rank 5). It hits everything in the zone, monsters and players (players half damage, as usual).
- Look: a wide ice crescent — an open mouth in cool ice with an ink outline, told apart from the splash's full circle at a glance — flashes in the zone for 0.2 s.
- Talent line in the Body tree file (closest example: the `magnet` line in `src/content/talents/body.ts`): id `maw`, upgrade `maw`, max 5, needs `[["might", 2]]`.
- The tree as the panel will draw it (with the Chill and Chomp lines that T0004 and T0006 add):
  ```
  Swift (5)
  Vigor (3)
    Chill (3, needs Vigor 1)
    Chomp (1, needs Vigor 3, Swift 3)
  Might (5)
    Maw (5, needs Might 2)
  Magnet (3)
  ```
- What it gets and what it costs: Maw 5 costs 7 points of the Might line (Might 2 first). Those 7 points could instead buy full Might (+60% damage to the Bolt, the single-target line) or the stand-still line of Swift and Vigor. Maw is only close: its zone reaches 130 in front, so the Bolt's range is never threatened, and a kiting player or a far Puff is out of its reach — the body has to be in the crowd, which is exactly what Swift and Vigor pay for.
- With every mod: Haste (fires sooner) and Might (+12% bite damage per rank) apply; Wide (+20% area per rank) applies — the bite zone is a ground area, so Wide makes it visibly bigger per rank; Chill (slow on hit) applies — as with any area, the bite refreshes the slow on everything inside. Split does not apply: the bite is a ground area, not a projectile, so there is nothing to fan — and that is fine, Maw already hits a group. Lance (pierce), Quick (projectile speed) and Ricochet (bounce) do not apply: there is no projectile to fly, pierce or bounce.
- In a crowd: a Maw 2 Body player standing in a Dot wave bites every 0.9 s — a 31-damage bite (25 at rank 1, +24% from Might 2) lands on every Dot (12 hp) inside at once, so the wave dies faster than it bites back; with Chill 3 the wave is at 50% speed in the zone, and with Chomp each kill feeds back 5 hp. Against a player: the bite hits close for half damage, but the player's Bolt keeps its range — Maw makes the Body the one who closes, and closing is the Body's job.
- It lays one area every 0.9 s and nothing else: no projectiles to add to a crowd of 60.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a weapon that fires by itself | The Bolt aims one spinning star at one far enemy and stops there; the Maw bites a zone in front of you and everything inside at once — it trades range for a group, and it can only hit what you stand next to |
| Lob (T0003, in the pool) | a weapon that hits a group | The Lob throws a bubble that lands where the enemy was, at mid range, with no commitment — you can stand still and lob; the Maw is a ground bite in front of you: you have to be in the crowd you want to eat, and the crowd is in you |

## Acceptance criteria
- [ ] The Body tab in the talents panel has a line "Maw": "Every 0.9 s, if an enemy is close, bites everything in front. Each rank: +6 bite damage.", hexagon icon (ice), 5 ranks, "Needs Might 2" until taken — readable at 412x915.
- [ ] A player with Maw 1 and no enemy within 130 bites nothing; with a Dot within 130, an ice crescent flashes in front of them every 0.9 s, and a level-1 Dot (12 hp) dies to one bite (25 damage).
- [ ] The bite hits every monster in the zone at once: five Dots standing in the crescent all take the bite; a player in the zone takes half (12.5 at rank 1).
- [ ] With Might 2 the rank-1 bite is 31; at Maw 5 it is 49; with Haste the bites come visibly sooner per rank; with Wide the crescent is visibly bigger per rank.
- [ ] With full Split, Lance and Ricochet the bite is still one zone of the same size (Haste still makes it fire sooner, as with every weapon).
- [ ] The Gunner and Lobber trees are unchanged; the game starts and plays normally.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/maw.ts` - the Body's weapon: upgrade `maw` (`fire` + `cooldown: 0.9`) that lays the `bite` area
- create `src/content/areas/bite.ts` - area `bite`: radius 75, life 0.2 s, single strike, ice-crescent look
- edit `src/content/areas/index.ts` - add `bite` import and its one line in `AREAS` (the list is empty today)
- edit `src/content/upgrades/index.ts` - add `maw` import (between `magnet` and `might`, alphabetical) and its line in `UPGRADES` after `bolt,` (the weapons group)
- edit `src/content/talents/body.ts` - add one talent line after the `might` line

### Interfaces
No new types. Two new defs using existing `UpgradeDef` and `AreaDef` from `engine/api.ts`:

```ts
// src/content/upgrades/maw.ts
import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Body's weapon: a bite zone in front of the player (area 'bite'). */
export const maw: UpgradeDef = {
  id: 'maw',
  name: 'Maw',
  description: 'Every 0.9 s, if an enemy is close, bites everything in front. Each rank: +6 bite damage.',
  maxLevel: 5,
  look: { shape: 'hexagon', color: PALETTE.ice },
  cooldown: 0.9,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 130);
    if (!target) return;
    const p = v.fromAngle(v.angleTo(me, target), 55);
    ctx.area(me, 'bite', { x: me.x + p.x, y: me.y + p.y, damage: 25 + 6 * (level - 1) });
  },
};

// src/content/areas/bite.ts
import { v, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Maw's bite: a short zone that strikes everything inside once. */
export const bite: AreaDef = {
  id: 'bite',
  radius: 75,
  life: 0.2,
  interval: 0.3, // > life: exactly one pulse
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      const fade = e.hp; // 1 at birth -> 0 at death
      const r = e.radius;
      g.save();
      g.rotate((e.slots[0] ?? 0) / 100); // aim angle stored by pulse; gap of the jaw faces it
      g.beginPath(); // wide crescent: a 210 deg ring sector, 0.6r..r, open at +x
      g.arc(0, 0, r, 0.75, Math.PI * 2 - 0.75);
      g.arc(0, 0, r * 0.6, Math.PI * 2 - 0.75, 0.75, true);
      g.closePath();
      g.globalAlpha = 0.5 * fade;
      g.fillStyle = PALETTE.ice;
      g.fill();
      g.globalAlpha = 0.9 * fade;
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 3;
      g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    if (!a.owner.alive) return;
    const target = ctx.nearestEnemy({ x: a.x, y: a.y, team: a.team }, 240);
    a.slots[0] = target ? Math.round(v.angleTo(a, target) * 100) : 0;
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) ctx.strike(a, u);
  },
};
```

### Steps
1. Create `src/content/areas/bite.ts` exactly as above.
2. Create `src/content/upgrades/maw.ts` exactly as above.
3. In `src/content/areas/index.ts`: add `import { bite } from './bite.ts';` above the list, and `bite,` as the only line of `AREAS`.
4. In `src/content/upgrades/index.ts`: add `import { maw } from './maw.ts';` between the `magnet` and `might` imports; add `maw,` immediately after `bolt,` in the list.
5. In `src/content/talents/body.ts`: after `{ id: 'might', upgrade: 'might', max: 5 },` add `{ id: 'maw', upgrade: 'maw', max: 5, needs: [['might', 2]] },`. Do not touch any other line (Chill and Chomp lines come from T0004/T0006).
6. Run `npm run check`.

### Pitfalls
- Use `ctx.strike(a, u)`, never `ctx.damage`, in the pulse: strike is what applies the pvp half-damage, the owner's on-hit mods (Chill), and kill credit; `ctx.damage` skips the on-hit hooks.
- Pass base numbers to `ctx.area` (damage `25 + 6*(level-1)`, def radius): the engine already multiplies by the player's `stats.damage` and `stats.area`. Multiplying yourself would double-apply Might and Wide.
- Keep `interval` (0.3) above `life` (0.2): the first pulse comes on the area's first tick, and a shorter interval would strike twice.
- Do not write `a.dead` — the `Area` type in `engine/api.ts` has no such field; the engine expires the zone by `life`. If the owner dies mid-bite, just `return`.
- An area's `angle` is always 0; `slots[0]` (aim × 100, fits i16) is the only way the client learns which way the jaw opens. The first client frame may arrive before the pulse stores it (gap faces +x for one frame) — acceptable.
- Split/Lance/Quick/Ricochet must NOT be handled anywhere: they only exist on projectiles, and the engine fans only `ctx.fire`, so the bite is automatically immune.
- The talent row text is 88 chars — the same length as Bolt's existing row, so it wraps identically in the panel at 412x915; no panel or HUD file changes.

### Tests
- none (engine/tests cover the defs, registries, both items in a real match, talent reachability, and the 60-player budget).

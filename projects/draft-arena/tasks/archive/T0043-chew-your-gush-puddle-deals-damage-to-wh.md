---
id: T0043
title: "Chew: your Gush puddle deals damage to whatever stands in it"
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T08:05:11Z
claimed_at: 2026-10-31T10:06:11Z
finished_at: 2026-10-31T10:59:18Z
epic: E12
---

## Goal
The Goober tree gets its 6th talent, under Gush: a Goo kill lays a puddle that bites, so killing a monster on top of someone is a fight move. The tree's deepest branch becomes zone denial.

## Details
- New upgrade `chew` in src/content/upgrades/chew.ts (an on-kill upgrade, like Gush's file), registered in the upgrades index with the other Goober upgrades.
- Text (shown on the talent): "Whatever stands in your Gush puddle takes 6 damage every 0.5 s. Per rank: +6 damage."
- maxLevel 3. Damage per tick by rank: 6, 12, 18 per 0.5 s.
- Every Gush puddle (the one a Goo kill lays) deals that damage on top of its slow, to whatever stands in it: monsters at full, players at half, like the player's other weapons.
- The puddle is refreshed while something stands in it, so it keeps biting for as long as they stay; walking out of it stops the ticks.
- What it does with every weapon: with Bolt, Maw and Lob, nothing — no Goo kill, no Gush puddle, nothing to bite (like Gush itself). With the Goo: its kills lay the biting puddle.
- Look: a Chew puddle is the same blue puddle as a plain Gush puddle, with little ink bubbles squishing once per tick. A squishing puddle is a puddle that hurts; a still one only slows.
- Talent line in src/content/talents/goober.ts: id `chew`, upgrade `chew`, max 3, needs [["gush", 3]], the new line after the `gush` line. The tree as the panel draws it (Cling, if already built, stays where it is):
  ```
  Reap (3)
    Goo (3, needs Reap 1)
      Gush (3, needs Goo 1)
        Chew (3, needs Gush 3)
      Scatter (1, needs Goo 3)
  ```
- What a Goober gets and what it costs: 8 points to the first rank (Reap 1, Goo 1, Gush 3, Chew 1) — the deepest commitment in the tree; Chew 3 is an 11-point zone-denial life. It matters in play now: in a crowd, killing a monster on top of a player lays a biting puddle under their feet, and holding a gem geyser spot with Goo kills keeps the spot hostile.

## Acceptance criteria
- [ ] The Goober tab in the talents panel shows a new Chew row under Gush with the text above; before Gush is at rank 3 the row says what it still needs.
- [ ] Chew 3 costs 3 points and only unlocks at Gush 3; the panel draws it under Gush.
- [ ] With Chew, a Goo kill lays a Gush puddle whose bubbles squish once every 0.5 s and deal 6/12/18 damage per tick by rank to whatever stands in it; without Chew the puddle only slows, exactly as before.
- [ ] A monster standing in the puddle takes the full ticks and keeps the puddle alive while it stays; a player standing in it takes half.
- [ ] Bolt, Maw and Lob kills lay no biting puddle: no Goo kill, no puddle at all.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit effect | acts on a hit; Chew acts on the ground a Goo kill left behind |
| Chill | makes a target slower | slows one target for a few seconds; Chew slows and damages everything that stands in a puddle for as long as it stays |
| Reap | an on-hit damage bonus | adds to a hit; Chew is a damage tick on a zone, not on a hit |
| Chomp | an on-kill reaction | heals the killer on a kill; Chew marks the kill spot so the ground keeps biting |
| Fuse | an on-kill that pops the kill into something | pops the kill into one ring that strikes once; Chew's puddle keeps striking everything that stands in it, refreshed while occupied |
| Scatter | an on-kill on a Goo | spawns shots at other enemies; Chew leaves the ground behind the kill hostile |
| Gush | a Goo kill lays a slow puddle | the puddle only slows; Chew makes that same puddle deal damage on a timer |

## Design (architect, desktop)

### Files
- create `src/content/upgrades/chew.ts` — the `chew` on-kill upgrade: a Goo kill lays the biting puddle
- create `src/content/areas/chew-puddle.ts` — the `chew-puddle` area: Gush puddle + damage tick + squishy bubbles
- edit `src/content/upgrades/index.ts` — import `chew` (between `chill` and `chomp` imports) and one line `chew,` after `gush,`
- edit `src/content/areas/index.ts` — import `chewPuddle` (after the `puddle` import) and one line `chewPuddle,` after `puddle,`
- edit `src/content/talents/goober.ts` — one talent line after the `gush` line

Do NOT touch `gush.ts`, `puddle.ts`, `goo-slow.ts` or any HUD file: without Chew the puddle must slow exactly as before, and the talents panel renders new talent rows automatically from the tree.

### Interfaces
No new types. Two new defs using existing interfaces (`UpgradeDef`, `AreaDef` in `engine/api.ts`):

`src/content/upgrades/chew.ts`:
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Goo kill by a Chewer: the Gush puddle it lays bites whatever stands in it. */
export const chew: UpgradeDef = {
  id: 'chew',
  name: 'Chew',
  description: 'Whatever stands in your Gush puddle takes 6 damage every 0.5 s. Per rank: +6 damage.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.teal },
  onKill(ctx, me, level, victim) {
    if (ctx.time - (victim.mem.gooAt ?? -99) > 0.4) return; // only kills a Goo just struck
    ctx.area(me, 'chew-puddle', { x: victim.x, y: victim.y, damage: 6 * level });
  },
};
```

`src/content/areas/chew-puddle.ts` (copy `puddle.ts`'s look body, add bubbles, extend `pulse`):
```ts
import { noise, shade, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * The Gush puddle of a Chewer, laid at the same spot as the plain one: same slow, and every 0.5 s
 * whatever stands in it takes a tick (monsters full, players half, like the player's other weapons).
 * Standing in it keeps it alive. Drawn over the plain puddle: the squishing bubbles say it hurts.
 */
export const chewPuddle: AreaDef = {
  id: 'chew-puddle', radius: 60, life: 3, interval: 0.5, follow: false,
  look: {
    shape: 'circle', color: shade(PALETTE.teal, -0.2),
    draw(g, e) {
      const a = (e.slots[0] ?? 100) / 100 * Math.min(1, e.hp * 4); // fade in, then out
      if (a <= 0) return;
      g.save(); g.globalAlpha = a;
      g.fillStyle = shade(PALETTE.teal, -0.2);
      g.beginPath(); g.arc(0, 0, e.radius, 0, Math.PI * 2); g.fill();
      g.lineWidth = 3; g.lineCap = 'round'; g.strokeStyle = PALETTE.ink; g.stroke();
      g.beginPath(); g.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
      g.setLineDash([4, 6]); g.lineWidth = 1.5; g.stroke();
      const s = Math.sin(((e.time % 0.5) / 0.5) * Math.PI); // 0->1->0: one squish per 0.5 s tick
      g.setLineDash([]);
      for (let i = 0; i < 3; i++) {
        const ang = noise(e.seed, i) * Math.PI * 2;
        const d = (0.2 + 0.45 * noise(e.seed, i + 3)) * e.radius;
        const r = e.radius * (0.08 + 0.05 * noise(e.seed, i + 6));
        g.beginPath();
        g.ellipse(Math.cos(ang) * d, Math.sin(ang) * d, r * (1 + 0.6 * s), r * (1 - 0.45 * s), 0, 0, Math.PI * 2);
        g.fillStyle = shade(PALETTE.teal, 0.35); g.fill();
        g.lineWidth = 1.5; g.strokeStyle = PALETTE.ink; g.stroke();
      }
      g.restore();
    },
  },
  pulse(ctx, a) {
    a.slots[0] = Math.min(100, Math.round((a.age / 0.3) * 100));
    const inIt = ctx.unitsNear(a.x, a.y, a.radius);
    if (inIt.length > 0) a.life = a.age + 3; // refreshed while something stands in it
    for (const u of inIt) {
      ctx.addStatus(u, 'goo-slow', 1.5);
      ctx.damage(u, a.damage, a.owner);
    }
  },
};
```

Talent line in `goober.ts`, between the `gush` and `scatter` lines:
```ts
    { id: 'chew', upgrade: 'chew', max: 3, needs: [['gush', 3]] },
```

### Steps
1. Create `src/content/upgrades/chew.ts` exactly as above.
2. Create `src/content/areas/chew-puddle.ts` exactly as above.
3. Add the two lines to `src/content/upgrades/index.ts` (import after the `chill` import; `chew,` after `gush,`).
4. Add the two lines to `src/content/areas/index.ts` (import after the `puddle` import; `chewPuddle,` after `puddle,`).
5. Add the talent line in `src/content/talents/goober.ts` after the `gush` line.
6. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Use `ctx.damage`, never `ctx.strike`, for the tick: `strike` fires on-hit hooks (Reap would double-dip); the task's table says Chew is a zone tick, not a hit. `ctx.damage(u, a.damage, a.owner)` already gives monsters full and players half (`rules.pvp.damageMul` 0.5) plus armor.
- `radius: 60` in the def is Gush rank 3's puddle radius (`40 + 10 * (3 - 1)` in `gush.ts`); Chew requires Gush 3, so it always matches the slow puddle under it. The engine scales both radii by the player's `area` stat, so they stay matched.
- A Chewer's Goo kill lays two areas at one spot (gush's plain puddle + this one). The chew-puddle is always spawned second (Gush's upgrade is always held before Chew's, and `onKillHooks` iterates the upgrades map in order), so it is always drawn on top and its bubbles stay visible. The duplicated slow is a harmless refresh of the same status.
- `a.life` is writable (not `readonly` on `Area`): that is what implements "refreshed while occupied". Do not reset `a.age`.
- The draw must stay pure of server state: positions from `noise(e.seed, i)`, the squish phase from `e.time` only. No `Math.random`. Reset `g.setLineDash([])` before stroking the bubbles, or they come out dashed.
- Description text must be verbatim; the talents panel shows it on the row, and the panel's "Needs Gush 3" line comes from the engine off `needs` — no HUD work.

### Tests
- none (no pure helpers added; content items are tested automatically by engine/tests/).

Panel fullest state (auto-rendered, no layout change): Goober tab rows Reap (indent 0) / Goo (24 px, "Needs Reap 1") / Gush (48 px, "Needs Goo 1") / Chew (72 px, "Needs Gush 3") / Scatter (24 px, "Needs Goo 3"). Fullest Chew row: icon + "Chew" + 3 pips + "Whatever stands in your Gush puddle takes 6 damage every 0.5 s. Per rank: +6 damage." wrapping to ~3 lines + "Needs Gush 3"; on 412x915 the card sits in the lower half (top ≤ 50 % − 90 px, ends below the critter) and scrolls internally (`overflow-y: auto`), so the extra row scrolls out of reach of the screen middle; desktop 1280x720: right column 360 px wide, same scroll.

## Result (attempt 1, desktop-4070)

Added the Chew upgrade and its chewing Gush puddle area to the Goober tree, registered both in their registries, and hung the new talent off Gush 3 exactly as designed — no engine changes were needed, and gush.ts, puddle.ts, goo-slow.ts and all HUD files are untouched. A Goo kill now lays a biting puddle (on top of the plain slow one) whose bubbles squish once per 0.5 s tick, dealing 6/12/18 damage per tick by rank: full to monsters, half to players, with life refreshed while occupied and none laid on Bolt/Maw/Lob kills. `npm run check` and `npm run smoke` both pass; `git diff` could not be run because the command requires an approval this session doesn't have.

- Self-review: APPROVE
- Time: 53.1 min

```
.../game/src/content/areas/chew-puddle.ts          | 62 ++++++++++++++++++++++
 .../draft-arena/game/src/content/areas/index.ts    |  2 +
 .../draft-arena/game/src/content/talents/goober.ts |  1 +
 .../draft-arena/game/src/content/upgrades/chew.ts  | 15 ++++++
 .../draft-arena/game/src/content/upgrades/index.ts |  2 +
 5 files changed, 82 insertions(+)
```

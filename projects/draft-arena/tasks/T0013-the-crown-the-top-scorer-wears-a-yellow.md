---
id: T0013
title: "The Crown: the top scorer wears a yellow crown"
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T03:34:39Z
claimed_at: 2026-10-31T04:06:57Z
epic: E4
---

## Goal
Players always know who is on top and who is the prize: the match's top scorer wears a yellow crown on its head and the crown moves as scores change, so the field shows who to fight and knocking out the crown becomes the match's big moment.

## Details
- A new director, one file in src/content/directors/ next to gem-rain.ts. When: the whole match, checked every tick and after each player death. Where: on the leader, wherever they are. What it adds: one crown marker, and one ring per crown move.
- Leader: the living player or bot with the highest score. No crown while every score is 0; the first score takes it. The crown moves only when someone scores strictly higher than the current leader — a tie never moves it (it must not ping-pong between two equal scores).
- Look: a small yellow candy crown, 3 points, ink outline, about 26 units wide, shown on the leader's critter about 12 units above its head. It is an on-critter decoration (rendered the way a status marker or an accessory renders on a critter) so it follows the leader automatically and always faces up. It never changes the critter's face, size or hitbox.
- When the crown moves: the yellow ring from the level-up effect spreads from the new leader.
- It is a field marker, not a HUD element: no new card and no change to the scoreboard (the scoreboard keeps showing scores; the crown answers "where is the leader" on the field). No new input, no sound. Bots can wear it.
- With 6 players (mostly bots): the crown sits on a player or a bot and hunting it is the main fight. With 60: scores churn, and the strict-overtake rule keeps the crown from flickering between tied players.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a director that runs the whole match and marks something on the field | drops and spawns nothing: it changes who players target by marking the top scorer, instead of adding loot |

## Acceptance criteria
- [ ] In a running match, the highest-scoring critter has a yellow 3-point crown floating above its head and nobody else does; in a fresh match where all scores are 0, no crown.
- [ ] A player who scores strictly higher than the leader gets the crown, with the yellow ring on them; a player who only ties the leader's score never takes it.
- [ ] When the crowned critter is knocked out, the crown appears on the next-highest scorer.
- [ ] A bot can wear the crown; the crown never changes a critter's face, size or hitbox.
- [ ] The HUD is unchanged: no new card and no new line in any existing card.

## Design (architect, desktop)

### Files
- create `src/content/areas/crown.ts` - the crown marker: an `AreaDef` (`id: 'crown'`) that is a short-lived, `follow: true` area whose `look.draw` paints the yellow 3-point crown 12 units above the wearer's head
- edit `src/content/areas/index.ts` - one import line and one `crown,` line in `AREAS` (next to `bite`)
- create `src/content/directors/crown.ts` - the director: finds the top scorer, moves the crown only on a strict overtake or knockout, plays the level-up ring, re-fires the crown area every tick
- edit `src/content/directors/index.ts` - one import line and one `crown,` line in `DIRECTORS` (next to `gemRain`)

### Interfaces
Two new defs; no engine or shared-file changes.

`src/content/areas/crown.ts` (whole file):
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { RULES } from '../rules.ts';

/**
 * The crown the top scorer wears: a yellow 3-point crown, 12 units above their head. The crown
 * director (directors/crown.ts) fires it every tick as a short-lived area that follows the wearer.
 */
export const crown: AreaDef = {
  id: 'crown',
  radius: 1,
  life: 0.15, // 3 ticks; the director re-fires it every tick, so the crown never disappears
  interval: 1, // > life: the empty pulse fires once at birth, never again
  follow: true, // stays centred on the wearer; ends when they are knocked out
  look: {
    shape: 'circle',
    color: PALETTE.yellow,
    draw(g) {
      // The bottom of the crown sits 12 units above the head (top of the body is y = -radius). Always faces up.
      const y0 = -(RULES.player.radius + 12);
      const y1 = y0 - 12;
      g.beginPath();
      g.moveTo(-13, y0);
      g.lineTo(-13, y1);
      g.lineTo(-6.5, y0 - 4);
      g.lineTo(0, y1);
      g.lineTo(6.5, y0 - 4);
      g.lineTo(13, y1);
      g.lineTo(13, y0);
      g.closePath();
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineJoin = 'round';
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    },
  },
  pulse() { /* a marker: no damage */ },
};
```

`src/content/directors/crown.ts` (whole file):
```ts
import type { Ctx, DirectorDef, Player } from '../../../engine/api.ts';
import { RULES } from '../rules.ts';

/**
 * The crown: the top scorer wears a yellow crown above their head (areas/crown.ts). The crown
 * moves only on a strict overtake or when the crowned critter is knocked out - a tie keeps it
 * where it is - and each move spreads the level-up ring from the new leader. Bots can wear it.
 */
export const crown: DirectorDef = {
  id: 'crown',
  name: 'The crown',
  description: 'The top scorer wears a yellow crown; it moves on a strict overtake.',
  tick(ctx, mem) {
    check(ctx, mem);
  },
  onKill(ctx, mem, _killer, victim) {
    if (victim.type === 'player') check(ctx, mem);
  },
};

function check(ctx: Ctx, mem: Record<string, number>): void {
  let leader: Player | undefined;
  for (const p of ctx.players()) if (p.score > 0 && (!leader || p.score > leader.score)) leader = p;
  if (!leader) return; // every score is 0: no crown
  let wearer = mem.crown ? ctx.playerById(mem.crown) : undefined;
  if (!wearer || (leader.id !== wearer.id && leader.score > wearer.score)) {
    // First score, a strict overtake, or the crowned critter is gone: the crown moves.
    mem.crown = leader.id;
    ctx.effect(RULES.effects.levelUp, { x: leader.x, y: leader.y });
    wearer = leader;
  }
  ctx.area(wearer, 'crown');
}
```

Registry edits, each exactly one import plus one list line: in `areas/index.ts` add `import { crown } from './crown.ts';` after the bite import and `crown,` after the `bite,` line; in `directors/index.ts` add `import { crown } from './crown.ts';` after the gem-rain import and `crown,` after the `gemRain,` line.

### Steps
1. Create `src/content/areas/crown.ts` exactly as above.
2. Edit `src/content/areas/index.ts`: add the one import and one list line (next to bite).
3. Create `src/content/directors/crown.ts` exactly as above.
4. Edit `src/content/directors/index.ts`: add the one import and one list line (next to gemRain).
5. Run `npm run check`.

### Pitfalls
- Tie rule: the crown compares against the **current holder** (`mem.crown`) with strict `>`; a player who only ties never takes it (no ping-pong). A dead or unknown holder (via `ctx.playerById`, which returns `undefined` for the knocked out) hands the crown to the top living scorer.
- In the crown's `draw`: do NOT use `e.hp` (it is the area's remaining life - the crown would fade) and do NOT use `e.radius` (it is the area's radius times the wearer's `area` stat, not the body radius). Use `RULES.player.radius` for the offset.
- Keep `life: 0.15` (3 ticks): the director re-fires every tick, so at most 3 identical crowns overlap (they look like one), and after a move a stale crown follows the old leader for at most ~0.1 s before expiring. A shorter life (< 2 ticks) can die before its first snapshot; a longer one lags behind moves.
- All state in `mem` (`mem.crown`, a player id - ids start at 1 so a falsy value means "no crown yet"), never module variables; a new match starts fresh.
- A thrown hook disables the item for the whole match: `leader` and `wearer` can be `undefined` - the code above handles both; no `Math.random`/`Date`/`performance` (there is no randomness here).
- The crown is drawn in the area layer (below the critter, below the name label, which the frozen engine always draws last). It clears the body by 12 units; the name text sitting partly over it is inherent - do not move the crown higher, add a status ring, or touch any file in `src/hud/` (the HUD stays unchanged).
- File names must match ids exactly (`crown.ts` exporting `crown`, in both categories - ids only need to be unique per category); one item per file, each in its own registry.

### Tests
- none (the director runs in the engine's 3-minute match test, the area is validated and drawn automatically, and there are no pure helpers).

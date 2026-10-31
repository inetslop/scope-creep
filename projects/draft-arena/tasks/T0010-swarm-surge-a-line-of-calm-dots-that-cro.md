---
id: T0010
title: "Swarm surge: a line of calm Dots that crosses the field"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T03:16:43Z
epic: E3
design_attempts: 1
---

## Goal
The first threat event: a line of twelve red Dots walks across the field in a straight line toward the centre, and the reason to move is to get out of its way — or to fight through it for the gems it drops. The field gets a moving danger that no player can hide from.

## Details
- New director file `src/content/directors/swarm-surge.ts` (closest example: `src/content/directors/gem-rain.ts`, the only director). No new monster: it spawns Dots (`src/content/monsters/dot.ts`) with a temporary march state — a status on an existing unit, like the slow status T0004 puts on one, not a new kind of critter.
- When it comes: 60 s in, and every 90 s after. Where: 12 Dots spawn just off a random edge of the field, evenly spaced 30 units along about 330 units of boundary, facing in.
- What it adds: the 12 Dots walk in a single file (one behind the other, 30 apart), in a straight line from where they spawned toward the field's centre (2000, 2000), at 85 u/s (the Dot's normal speed). Each keeps its normal Dot numbers, no level scaling: hp 12, 85 u/s, radius 14, 12 damage per second on touch, a 1-xp gem on death.
- The march ends two ways: a Dot turns on a player when one is within 60 and becomes a normal Dot (chases the nearest player); or it reaches within 40 of the field's centre, where it also becomes a normal Dot. Two surges may overlap: at most 24 surge Dots on the field at once.
- What players see: a red line of twelve critters walking across the field. While marching each wears a calm face (mood calm, one eye, mouth o — the Puff's look on a red circle): a red Dot that is not chasing you reads as "walking, not hunting". The line is the warning — visible from the edge of the screen, seconds ahead — and the moment one Dot turns on you its face goes angry (the normal Dot face) and it is already on you.
- With 6 players (bots fill to 6): the line usually crosses open ground; a player who stands in its way can clear it (12 Dots, twelve 1-xp gems — a good share of a level — a bonus for a prepared build like Maw or a splash) or simply step aside.
- With 60 players: the line ploughs into a crowd; it separates groups and becomes a wall players fight through or around, and the gems it drops are contested.
- It doesn't swamp the field: 12 Dots per surge, every 90 s, and every one of them either dies or becomes a normal Dot that the existing spawn rules already manage.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a timed director that puts something on the field for players | Rain brings a reward to one player's spot to grab; the surge moves a threat across the whole field — the reason to move is to get out of a line's way or clear it, not to collect what lands near you |

## Acceptance criteria
- [ ] At 60 s (and every 90 s after), 12 red Dots spawn along about 330 units of one edge of the field, 30 apart, and walk in a single file in a straight line toward the field's centre at 85 u/s — readable as a red line crossing the mint field.
- [ ] While marching, each Dot wears a calm face (mood calm, one eye, mouth o, like the Puff's); a player can tell a marching Dot from a chasing one at a glance.
- [ ] A marching Dot within 60 of a player turns angry and chases that player like a normal Dot (85 u/s, 12 damage per second on touch); one that reaches within 40 of the centre stops marching and becomes a normal Dot.
- [ ] A player standing still where the line crosses gets touched (12 damage per second per Dot touching them); a player who runs perpendicular at 210 u/s easily gets out of the line's way.
- [ ] A killed surge Dot drops a 1-xp gem like any Dot.
- [ ] Gem rain still runs unchanged; the match starts and plays normally with 6 and with 60 players.

## Design (architect, desktop)

### Files
- create `src/content/directors/swarm-surge.ts` — director `swarm-surge`: at 60 s and every 90 s, spawns 12 Dots in a single file along one edge, centred on the player nearest that edge, each flagged to march (`m.mem.surge = 1`, `m.slots[1] = 1`)
- edit `src/content/directors/index.ts` — one import line `import { swarmSurge } from './swarm-surge.ts';` and one list line `swarmSurge,` after `gemRain,`
- edit `src/content/monsters/dot.ts` — `think` gains a march branch (walk to centre, turn when a player is within 60 or the centre within 40); `look.draw` gains the calm face while `e.slots[1] === 1`. Everything else in the file stays byte-identical.

### Interfaces
No new types. State contract (server sets, client reads):
- `m.mem.surge: number` — `1` while marching, `0` once it turns (server only).
- `m.slots[1]: number` — `1` while marching (calm face), `0` otherwise. `slots[0]` stays the chilled/scared face.
- `export const swarmSurge: DirectorDef` with `id: 'swarm-surge'`, `name: 'Swarm surge'`, one-line `description`.

### Steps
1. Create `src/content/directors/swarm-surge.ts` exactly:
```ts
import type { DirectorDef } from '../../../engine/api.ts';

const FIRST = 60;
const EVERY = 90;
const COUNT = 12;
const GAP = 30;
const SPAN = (COUNT - 1) * GAP;
/** Longest a Dot keeps marching: far corner of the edge to the centre at its speed. */
const MARCH_MAX = 40;

/** Every 90 s (first at 60 s), a line of twelve Dots walks in a single file from an edge toward the centre. */
export const swarmSurge: DirectorDef = {
  id: 'swarm-surge',
  name: 'Swarm surge',
  description: 'A line of twelve Dots walks from an edge toward the centre.',
  tick(ctx, mem) {
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    const players = ctx.players();
    if (players.length === 0) return;
    // At most 24 surge Dots: a surge's Dots stop marching within MARCH_MAX of spawning, and
    // surges come every 90 s, so this only guards a march running long.
    const marching =
      (ctx.time - (mem.s0 ?? -1e9) < MARCH_MAX ? COUNT : 0) +
      (ctx.time - (mem.s1 ?? -1e9) < MARCH_MAX ? COUNT : 0);
    if (marching + COUNT > 24) return;
    mem.s1 = mem.s0 ?? -1e9;
    mem.s0 = ctx.time;
    // The edge nearest a player, line centred on that player: it starts in sight of the fight.
    const { width, height } = ctx.rules.world;
    let best = Infinity, edge = 0, at = width / 2;
    for (const p of players) {
      if (p.x < best) { best = p.x; edge = 0; at = p.y; }
      if (p.y < best) { best = p.y; edge = 1; at = p.x; }
      if (width - p.x < best) { best = width - p.x; edge = 2; at = p.y; }
      if (height - p.y < best) { best = height - p.y; edge = 3; at = p.x; }
    }
    const long = edge === 0 || edge === 2 ? width : height;
    const a0 = Math.min(Math.max(at - SPAN / 2, 30), long - 30 - SPAN);
    for (let i = 0; i < COUNT; i++) {
      const along = a0 + i * GAP;
      const x = edge === 0 ? 30 : edge === 2 ? width - 30 : along;
      const y = edge === 1 ? 30 : edge === 3 ? height - 30 : along;
      const m = ctx.spawnMonster('dot', x, y);
      if (!m) continue;
      m.mem.surge = 1;
      m.slots[1] = 1;
    }
  },
};
```
2. Edit `src/content/directors/index.ts`: add the import line (next to `gemRain`) and the one list line.
3. Rewrite `src/content/monsters/dot.ts` `look.draw` and `think` (and extend the top comment to "…(scared while slowed, calm while marching)"); keep every other line identical:
```ts
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const face =
        e.slots[1] === 1 ? { mood: 'calm', eyes: 1, mouth: 'o' }
        : e.slots[0] === 1 ? { mood: 'scared', mouth: 'o' }
        : { mood: 'angry' };
      drawCritter(g, this, e, { ink: PALETTE.ink, face });
    },
  },
  think(ctx, m, _dt) {
    if (m.mem.surge === 1) {
      const { width, height } = ctx.rules.world;
      const dx = width / 2 - m.x;
      const dy = height / 2 - m.y;
      const d = Math.hypot(dx, dy);
      if (d <= 40 || ctx.nearestEnemy(m, 60)) {
        m.mem.surge = 0;
        m.slots[1] = 0;
      } else {
        m.vx = (dx / d) * m.speed;
        m.vy = (dy / d) * m.speed;
        m.angle = Math.atan2(dy, dx);
        m.slots[1] = 1;
      }
      return;
    }
    m.slots[0] = ctx.statusOf(m, 'chill-1') + ctx.statusOf(m, 'chill-2') + ctx.statusOf(m, 'chill-3') > 0 ? 1 : 0;
    m.slots[1] = 0;
    chase(m);
  },
```
4. Run `npm run check`.

### Pitfalls
- Do not "fix" the edge pick to `ctx.rng`: the engine relocates or removes any monster more than `relocateDistance` (1100) from the nearest player (`engine/sim/match.ts:435`); a purely random-edge line in open ground would teleport to players or vanish and stop reading as a line. The nearest-player edge is the workaround, and a turned Dot is just a normal Dot the spawn rules manage (as the task allows).
- No `StatusDef` for the march: `Ctx` has no remove-status (a status lingers to expiry) and status ticks run *after* the monster's think every tick, so they can't steer it. `mem`+`slots` is the pattern, same as the Dot's chilled face.
- Never divide by `d` before the `d <= 40` turn check (NaN fails the match).
- `slots[0]` is taken (chilled face) — march is `slots[1]`; calm face takes priority over scared.
- A turned Dot (`mem.surge = 0`) must never march again, even if it leaves 60 of the player.
- The engine's monster separation (SPACING 1.25) widens the 30-unit gaps to ~35 — that is fine, the line stays a line.
- `ctx.spawnMonster` clamps to `[radius, width-radius]`; keep the 30-off-edge positions positive.
- All director state in `mem` with `??` defaults — never module variables (fresh match must start clean).

### Tests
- none (content is tested automatically by `engine/tests/`; no pure helpers added).

---
id: T0076
title: "Hive, second slice: Nest (a kill heal that grows with the crowd) and the Sting capstone"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: [T0075]
attempts: 1
created: 2026-10-31T13:15:23Z
claimed_at: 2026-10-31T13:56:45Z
epic: E16
---

## Goal
The Hive tree gets its sustain branch and its capstone: kills in a packed crowd feed the killer back (Nest), and a kill made in a pile bursts the pile (Sting) — a Hive life that runs into the swarm stops bleeding and starts paying the crowd back.

## Details

**The tree** (in the Hive tree file T0075 creates, src/content/talents/hive.ts):
- Talent lines, exactly:
  - id `nest`, upgrade `nest`, max 3, needs `[["horn", 2]]`
  - id `sting`, upgrade `sting`, max 1, needs `[["horn", 3], ["nest", 2]]`
- The tree as the panel will draw it:
  ```
  Swarm (3)
    Horn (3, needs Swarm 1)
      Nest (3, needs Horn 2)
      Sting (1, needs Horn 3, Nest 2)
  ```
- The fork: under Horn, Nest pulls the life into kill-sustain that grows with the crowd; Sting is the capstone off the same Horn, so a committed Hive life chooses how deep to go before the burst.

**Nest** (a new file in src/content/upgrades/, on-kill):
- text: "On a kill: heal 2 hp per other critter within 100 of the corpse (up to 3). Per rank: +2 more per neighbor."
- maxLevel 3. look: shape hexagon, color green.
- On a kill (a monster, or a player knockout), heal the killer: 2 hp per neighbor at rank 1, 4 at rank 2, 6 at rank 3. A neighbor is any other living critter (monster or player, including the killer) within 100 units of the corpse, counted up to 3. A kill with no neighbors heals 0.
- It is an on-kill mod, so it runs on kills by every weapon: Bolt, Maw's bite, Lob's splash, Goo, Nerve's jab, Slush's puddle and Horn's dart — and on a player knockout, where the corpse is the downed player.

**Sting** (a new file in src/content/upgrades/, on-kill, the capstone):
- text: "On a kill with 2 or more other critters within 80 of the corpse: the corpse bursts (radius 80) for 12 damage."
- maxLevel 1. look: shape star, color purple, scale 1.1.
- On a kill (a monster, or a player knockout), if 2 or more other living critters (monsters and players, including the killer) stand within 80 units of the corpse, the corpse bursts once: radius 80 units, 12 damage to monsters, 6 to players (half, as every weapon's touch). A kill with 0 or 1 neighbors does nothing.
- It is an on-kill mod, so the burst can come from any weapon's kill: Bolt, Maw, Lob, Goo, Nerve, Slush, Horn — the crowd decides, not the weapon.
- How it looks: a teal ring with an ink rim blooms from the corpse out to 80 units over 0.3 s, with a few teal confetti — a new small effect, apart from the Popper's orange death puff (orange is a monster pop) and the ice splash and slush puddles (those leave a field; the burst strikes once and is gone).

**What a Hive player gets and what it costs:** Nest 1 is 4 points in (Swarm 1, Horn 3, Nest 1) — a kill in a pile feeds 6 hp back at rank 1, 18 at rank 3; the same 4 points could deepen any other tree instead. Sting asks 7 of the tree's 10 ranks (Swarm 1, Horn 3, Nest 2, plus Sting): the whole tree committed for a burst that only exists in a crowd — a kill alone is a kill, a kill in a pile is a bomb.

## Compared with what exists

**Nest, an on-kill** (one row for every on-kill upgrade):

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | heals on kill | heals a flat 5 anywhere (25 on a knockout); Nest heals 0 alone and more the more crowded the corpse stands — a feed for a life that runs into the swarm |
| Adrenaline | an on-kill payoff on yourself | a speed burst, only while below half hp; Nest is an hp heal that grows with the crowd, at any hp |
| Fang | an on-kill payoff while hurt | extra coins below half hp; Nest is a heal that grows with the crowd, at any hp |
| Fuse | a kill makes a field | a ring where your bubble kills; Nest makes no field — it heals the killer, scaled by what stands around the corpse |
| Scatter | a Goo kill spawns things | four mini-Goo that chase; Nest heals the killer and spawns nothing |
| Gush | a Goo kill marks the spot | a slow puddle that lingers and refreshes; Nest is an instant heal, no field on the ground |
| Chew | an on-kill that deals damage on a field | the Gush puddle bites on a tick; Nest heals the killer on the kill itself, no field |

**Sting, an on-kill** (one row for every on-kill upgrade):

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | an on-kill payoff | Chomp feeds the killer; Sting feeds the crowd around the corpse — a burst that hurts whoever stood in the pile |
| Adrenaline | an on-kill payoff on yourself | a speed burst while hurt; Sting is a one-shot burst on the field, at any hp, only when the kill is crowded |
| Fang | an on-kill payoff while hurt | coins; Sting is a conditional damage burst on the corpse |
| Fuse | a kill makes a damaging field | a ring on every bubble kill, wherever it is; Sting bursts only when 2+ critters stand within 80 of the corpse, and it can come from any weapon |
| Scatter | a Goo kill spawns seekers | four mini-Goo that chase enemies after the kill; Sting is a single one-shot burst at the spot, no followers |
| Gush | a Goo kill leaves a field | a slow puddle that stays and refreshes; Sting is one strike, gone in 0.3 s |
| Chew | an on-kill that keeps dealing damage | the puddle ticks every 0.5 s while it lasts; Sting strikes once where the kill was crowded |

## Acceptance criteria
- [ ] The Hive tab draws four talents: Swarm (3), Horn (3, needs Swarm 1), and under Horn a fork — Nest (3, needs Horn 2) and Sting (1, needs Horn 3 and Nest 2); Sting stays greyed until Horn 3 and Nest 2 are bought.
- [ ] With Nest 1, a kill by any weapon heals 2 hp per other living critter within 100 of the corpse, up to 3 neighbors (6 max); rank 2 heals 4 per neighbor (12 max), rank 3 heals 6 per neighbor (18 max); a kill with no neighbors heals 0.
- [ ] With Sting, a kill that leaves 2 or more critters within 80 of the corpse bursts: a teal ring with an ink rim blooms to 80 over 0.3 s with a few teal confetti, dealing 12 to monsters and 6 to players standing in it, one strike; a kill with fewer than 2 neighbors does not burst.
- [ ] The burst reads at a glance as a player payoff — teal, never the Popper's orange puff, and it leaves no field behind (unlike the splash or the slush puddle).
- [ ] Nest's and Sting's texts fit their rows in the panel at 412x915 and 1280x720 in one or two lines.

## Design (architect, inet-racing)

### Files
- create `src/content/upgrades/nest.ts` - Nest on-kill heal, export `nest`
- create `src/content/upgrades/sting.ts` - Sting on-kill burst (capstone), export `sting`
- create `src/content/effects/sting-burst.ts` - the teal ring + confetti visual, export `stingBurst`, `id: 'sting-burst'`
- edit `src/content/upgrades/index.ts` - two imports + two registry lines
- edit `src/content/effects/index.ts` - one import + one registry line
- edit `src/content/talents/hive.ts` - two talent lines after `horn`

### Interfaces
All three are existing types, no new types: `UpgradeDef` (with `onKill(ctx: Ctx, me: Player, level: number, victim: Unit)`), `EffectDef`. Key API facts (verified in `engine/api.ts` + `engine/sim/match.ts`):
- `ctx.unitsNear(x, y, radius): Unit[]` returns **all living** units (monsters and players, every team) — the dead victim is already excluded, and `me` is included when in range. Range is edge-based (`radius + u.radius`), the same convention `fuse.ts` uses.
- `ctx.damage(u, 12, me)` deals 12 to monsters; to players the engine auto-applies `pvp.damageMul` (0.5) → 6, plus their armor. Do not halve it yourself.
- `ctx.heal(me, n)` is capped at maxHp, no-op if dead.
- `ctx.effect(id, { x, y }, undefined, value)` → `fx.value` on clients; effects use `fx.t` (0→1), `noise(fx.seed, i)`, `PALETTE`.

### Steps
1. Create `src/content/upgrades/nest.ts`:
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive sustain: a kill in a crowd feeds back - 2 hp per critter standing by the corpse, up to 3. */
export const nest: UpgradeDef = {
  id: 'nest',
  name: 'Nest',
  description: 'On a kill: heal 2 hp per other critter within 100 of the corpse (up to 3). Per rank: +2 more per neighbor.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.green },
  onKill(ctx, me, level, victim) {
    const n = Math.min(3, ctx.unitsNear(victim.x, victim.y, 100).length);
    if (n > 0) ctx.heal(me, 2 * level * n);
  },
};
```
2. Create `src/content/effects/sting-burst.ts`:
```ts
import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Sting: a crowded corpse bursts - a teal ring with an ink rim blooms out to `value`, teal confetti with it. */
export const stingBurst: EffectDef = {
  id: 'sting-burst',
  duration: 0.3,
  draw(g, fx) {
    g.globalAlpha = 1 - fx.t;
    const r = fx.value * fx.t;
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.teal;
    g.stroke();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = r * (0.6 + 0.4 * noise(fx.seed, i + 7));
      g.fillStyle = PALETTE.teal;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    }
  },
};
```
3. Create `src/content/upgrades/sting.ts`:
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive capstone: a kill in a pile bursts the pile - 12 damage (6 to players) to all within 80 of the corpse. */
export const sting: UpgradeDef = {
  id: 'sting',
  name: 'Sting',
  description: 'On a kill with 2 or more other critters within 80 of the corpse: the corpse bursts (radius 80) for 12 damage.',
  maxLevel: 1,
  look: { shape: 'star', color: PALETTE.purple, scale: 1.1 },
  onKill(ctx, me, _level, victim) {
    const near = ctx.unitsNear(victim.x, victim.y, 80);
    if (near.length < 2) return;
    for (const u of near) ctx.damage(u, 12, me);
    ctx.effect('sting-burst', { x: victim.x, y: victim.y }, undefined, 80);
  },
};
```
4. Edit `src/content/upgrades/index.ts`: add `import { nest } from './nest.ts';` after the `might` import, `import { sting } from './sting.ts';` after the `split` import; in `UPGRADES` add `nest,` and `sting,` on the two lines after `chew,`.
5. Edit `src/content/effects/index.ts`: add `import { stingBurst } from './sting-burst.ts';` after the `splashRing` import; add `stingBurst,` after `puffBurst,`.
6. Edit `src/content/talents/hive.ts`: after the `horn` line add exactly:
```ts
    { id: 'nest', upgrade: 'nest', max: 3, needs: [['horn', 2]] },
    { id: 'sting', upgrade: 'sting', max: 1, needs: [['horn', 3], ['nest', 2]] },
```

### Pitfalls
- Don't write your own distance loop: `ctx.unitsNear` already filters dead units (the corpse is dead when `onKill` runs, so it is excluded — no `u !== victim` check needed) and already includes the killer, exactly as specified.
- Don't halve player damage yourself — `ctx.damage(u, 12, me)` does it via `pvp.damageMul`; writing `u.type === 'player' ? 6 : 12` double-halves players.
- Sting must use `unitsNear`, not `enemiesNear`: the burst also hits other players (for 6) and the killer if they stand in the pile.
- The burst's kills credit `me` and re-trigger `onKill` (Nest heals, Sting can chain on the new corpse) — intended, each chain step needs 2+ neighbors, so it is bounded by crowding.
- No sound: the task specifies only the visual; do not touch `src/audio/sfx.ts` (T0077 is working near it).
- No HUD/panel changes: the talents panel renders `TREES` automatically; the two description strings wrap in the existing row at 412x915 and 1280x720 (same length as existing rows like Fuse's).
- Effect draws must not reset `g.globalAlpha` (the engine restores it; match `ring.ts`/`pop.ts`).

### Tests
none

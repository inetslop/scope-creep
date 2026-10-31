---
id: T0067
title: "Cover: a Gunner talent that fires a fan of bolts behind you, open after a prestige"
size: M
priority: 2
status: todo
depends_on: [T0061]
attempts: 0
created: 2026-10-31T12:44:22Z
epic: E17
---

## Goal
A second-life build for the Gunner: Cover fires a fan of bolts behind you while you run, so a hunted player (the marked one, a crown hunter, Dots on its heels) fights back without turning around — a talent only a player who has prestiged this life can take, the Slush way.

## Details
- The talent line: in the Gunner tree, id cover, upgrade cover, max 3 ranks, needs [["bolt", 2]], points 3 (3 points spent in the Gunner tree first), prestige 1. Before a prestige it sits greyed in the panel with what it still needs, exactly like Slush does in the Lobber tree.
- The weapon: every 1.0 s, a fan of 3 bolts straight behind the player — 70 degrees wide, opposite its movement; if it stands still, opposite its last movement. 9 damage per bolt; rank 2: 12; rank 3: 15. The bolts look like Bolt's stars (small yellow stars), fly at 160 u/s and are gone after 0.6 s.
- Text on its row in the panel: "Every 1.0 s, a fan of 3 bolts behind you, at whatever chases. 9 damage each. Per rank: +3 damage."
- Which mods apply: it is a bolt, so everything that does to a Bolt does to a Cover bolt — Haste fires it sooner, Quick makes the bolts fly faster, Split fans one more bolt (all 12% weaker), Lance sends them through 1 more enemy, Ricochet bounces them, Might and Frenzy scale the damage, and the on-hit mods (Chill, Reap) and on-kill mods (Chomp, Adrenaline, Fang) run on its hits and kills. The Goo and bubble talents (Gush, Chew, Scatter, Cling, Fuse, Wide) do nothing to it: it is not a Goo or a bubble.
- On players: half damage, like every weapon — 4.5 per bolt at rank 1. The fleeing marked player's answer to its hunter.
- The prestige's numbers: the 1st prestige this life opens it (and banks the point to start spending it, with T0061); the 2nd and 3rd do not change the talent — they bank more points for it. Right after a 1st prestige the player is at level 1 with 1 banked point: Cover rank 1 is 4 levels away (Bolt 2, 2 more Gunner points, then Cover), and 27 damage in a 3-bolt fan sits far under a level 17 Gunner's volley — a direction for the second life, never the power the reset took.
- What it costs: 4 points minimum (Bolt 2, 2 more anywhere in the Gunner tree, then Cover 1) plus a prestige this life — the same points could buy Haste and a deeper forward volley.
- The tree as the panel will draw it:
  ```
  Haste (3)
    Bolt (5, free rank, needs Haste 1)
      Split (2, needs Bolt 2)
      Ricochet (1, needs Bolt 4)
      Cover (3, needs Bolt 2, 3 points, 1 prestige this life)
  ```

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | bolts at an enemy | Bolt aims at the enemy in front of you; Cover fires behind you, so you fight while running away |
| Maw | hits what is near without aiming | Maw bites everything in a crescent in front, up close; Cover throws a lane of bolts behind, at range |
| Lob | a thrown projectile that lands somewhere | Lob's bubble arcs and splashes the ground where it lands; Cover's bolts fly straight, hit what they touch, leave no field |
| Goo | a lobe at the nearest enemy | Goo turns in flight to catch its target; Cover never homes — it fires where you are going, not where an enemy is |
| Nerve | a short-range jab | Nerve hits the single nearest enemy, harder while you are hurt; Cover fans at everything behind in one shot, whatever your hp |
| Slush | a straight throw that does more than hit | Slush's blob flies past and leaves a slow puddle; Cover's bolts stop at the first hit and carry no field |

## Acceptance criteria
- [ ] The Gunner tree shows Cover under Bolt: 3 ranks, needs Bolt 2, 3 points, greyed with its prestige need until the player has 1 prestige this life (the T0061 bank), then buyable.
- [ ] With Cover 1, every 1.0 s a fan of 3 small yellow stars fires straight behind the moving player (70 degrees, opposite its movement), 9 damage each, gone after 0.6 s.
- [ ] Ranks 2 and 3 deal 12 and 15 damage per bolt; Haste, Quick, Split, Lance, Ricochet, Chill and Reap all work on the bolts exactly as they do on a Bolt.
- [ ] A Cover bolt into a player deals half damage, and knocking an enemy out with one pays the usual on-kill mods (Chomp heals, Fang coins, Adrenaline sprints while hurt).
- [ ] A player without a prestige this life sees the talent but cannot buy it, the same way Slush is gated today.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/cover.ts` — the Cover weapon: a `UpgradeDef` whose `fire()` throws a 70° fan of 3 bolts behind the player, reusing the existing `bolt` projectile (no new projectile file — its star look is exactly what the task wants)
- edit `src/content/upgrades/index.ts` — one import + one registry line
- edit `src/content/talents/gunner.ts` — one talent line

### Interfaces
No new types. New item:
```ts
export const cover: UpgradeDef; // src/content/upgrades/cover.ts, id 'cover', maxLevel 3, cooldown 1.0
```
Talent line (Gunner): `{ id: 'cover', upgrade: 'cover', max: 3, needs: [['bolt', 2]], points: 3, prestige: 1 }`

### Steps
1. Create `src/content/upgrades/cover.ts` with exactly:
```ts
import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Cover: the hunted player's answer. Every 1.0 s a 70-deg fan of 3 bolts straight behind the
 * player, opposite its movement (its last movement when it stands still). They are Bolt's bolts:
 * Haste, Quick, Split, Lance, Ricochet and the on-hit/on-kill mods all reach them through the
 * player's stats, so they are never coded here.
 */
export const cover: UpgradeDef = {
  id: 'cover',
  name: 'Cover',
  description: 'Every 1.0 s, a fan of 3 bolts behind you, at whatever chases. 9 damage each. Per rank: +3 damage.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.yellow },
  cooldown: 1.0,
  fire(ctx, me, level) {
    const moving = v.len({ x: me.vx, y: me.vy }) > 20;
    const dir = moving ? Math.atan2(me.vy, me.vx) : me.mem['coverDir'] ?? me.angle;
    if (moving) me.mem['coverDir'] = dir;
    const back = dir + Math.PI;
    const half = (70 * Math.PI) / 180 / 2; // outer bolts at +/-35 deg: the fan is 70 deg wide in total
    const damage = 9 + 3 * (level - 1);
    for (let i = -1; i <= 1; i++) {
      ctx.fire(me, 'bolt', { angle: back + i * half, speed: 160, damage, life: 0.6 });
    }
  },
};
```
2. In `src/content/upgrades/index.ts`: add `import { cover } from './cover.ts';` between the `cling` and `fang` imports (alphabetical), and `cover,` as the next line after `bolt,` in `UPGRADES`.
3. In `src/content/talents/gunner.ts`: append after the `ricochet` line: `{ id: 'cover', upgrade: 'cover', max: 3, needs: [['bolt', 2]], points: 3, prestige: 1 },`
4. Run `npm run check` and `npm run smoke`. Nothing else: no HUD, menu, director, projectile, or effect files — the panel already renders `def.prestige` gating (the engine puts `"Prestige 1"` in `HudTalent.missing`, exactly as it does for Slush in the Lobber tree today).

### Pitfalls
- Do not create a new projectile. `ctx.fire(me, 'bolt', …)` with `speed: 160` and `life: 0.6` overrides the def's defaults; the straight flight (no `path`/`step`) is cheap, same class as Bolt.
- Fan math: the 70° is the total width, so offsets are ±35° (`i * half`, `i` in −1..1). Using 70° per step would make a 140° spray.
- Track the last movement in `me.mem['coverDir']` (per-player, server only — no module variables). It is the first content to use a player's `mem`; the key is collision-free today. Fallback `me.angle` covers a fresh spawn that never moved.
- Judge movement from `me.vx`/`me.vy` (a slowed player still counts as moving), never from `me.input`.
- Do not divide `life` by `me.stats.projectileSpeed` (Slush does, to land its puddle at the aim point); Cover's lane should simply grow with Quick, like Bolt's does.
- No randomness, so no `ctx.rng`; `Math.random` is lint-forbidden anyway.
- Do not edit `src/hud/talentTree.ts` or its css — T0061 owns that file. Full panel state is one extra row in the Gunner tab: "Cover" + 3 pips + the description +, while locked, "Needs Bolt 2 and 3 pts in Gunner and Prestige 1" — the existing row layout already wraps this (Slush's row shows the same shape today); no style change at 412x915 or 1280x720.
- All mod behavior is automatic: stats upgrades (haste/quick/lance/split), onHit (ricochet/chill/reap) and onKill (chomp/adrenaline/fang) run on every projectile the player fires; Fuse does not, since it keys on the splash mark. Do not re-implement any of it.

### Tests
- none (content is tested automatically by engine/tests/, which will take a rank of Cover in a real match and check the tree, the registry and the data)

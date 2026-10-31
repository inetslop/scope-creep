---
id: T0096
title: "Twin: a bean that shudders at half hp, births a fast twin, and keeps living"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T15:53:22Z
claimed_at: 2026-10-31T16:59:45Z
epic: E20
---

## Goal
The menagerie's kill that doesn't kill: a bean that, the first time its hp drops to half, shudders and gives birth to a small fast twinling and keeps living — a half-kill is a two-kill, and killing it before the threshold (or during the shudder) is a real choice.

## Details
- Two new monsters in src/content/monsters/, each with one import and one registry line in the monsters index. No new projectile, no new area. Closest examples: brood.ts (it too births while alive), puff.ts (it too splits into little critters), and dot.ts for the twinling (a plain chaser with no behavior of its own).
- The bean ("Twin"): a squishy bean — a vertical oval with a small notch at its top, its own draw as the Brood's sac has one. Color: berry — a deep red-pink (#e64980); if T0071 or T0085 has claimed it for a monster, use the one remaining bright warm palette color no other monster uses and record the final hex in a design comment; no two monsters share a color. Rest face: mood calm, 2 eyes, mouth smile.
- The bean's behavior (its think): it chases the nearest player like a Dot. The first time its hp drops to half or below of its max, it stops for a 0.4 s shudder: its face turns scared (2 wide eyes, mouth o) and its body jitters, synced in a slot so every client sees it. If it is still alive after the 0.4 s, it gives birth; a bean killed during the shudder dies normally, with its gem and no twinling. The birth happens at most once per bean.
- The birth: the twinling appears 20 units beside the bean (perpendicular to the bean's line to its nearest player); the bean keeps living with whatever hp it has — the birth costs it nothing.
- The twinling ("Twinling", weight 0 — it only ever comes from a bean's birth): a small bean, the same shape, the bean's color lightened the way the Flee's light red is light, mood angry, 1 eye, mouth o. It chases the nearest player with no behavior of its own (the Dot's default) and can never give birth.
- Numbers — bean: hp 40, speed 70, radius 16, damage 10 per second while touching a player, xp 3, weight 4, fromLevel 4. Twinling: hp 8, speed 110, radius 10, damage 8 per second, xp 1, weight 0, fromLevel 1.
- What it adds to the crowd: at most one twinling per bean, ever — a crowd of beans chipped past half adds one small chaser per bean to the crowd of up to 60.
- What it punishes: the chip — a zone or tick (a Gush puddle, a Goo tick, a bubble splash) that drops a bean past half spawns a second chaser in the middle of the fight. What counters it: the burst — a Maw bite or a focused volley that kills a bean above half never births, and a twinling is 8 hp: any weapon finishes it in a hit or two.

## Acceptance criteria
- [ ] From a level 4 player up, a squishy bean (radius 16, its own warm color, a calm two-eyed smile) appears in the spawn crowds; no other monster shares its color.
- [ ] The bean chases the nearest player; the first time its hp hits half or below of its max it stops for a 0.4 s shudder (scared face, jittering body, visible to every player), then gives birth once and keeps the hp it has.
- [ ] A bean killed during the shudder dies with its normal gem and no twinling; a bean killed above half hp never shudders or births.
- [ ] The twinling appears 20 units beside the bean: a small bean, its color lightened, one angry eye, chasing the nearest player at 110 u/s — faster than any other chaser — and it never gives birth.
- [ ] The twinling is weight 0: it never spawns from the field, only from a bean's birth; a level 1–3 player never sees a bean.
- [ ] In a 60-player match, a crowd of chipped beans adds at most one twinling each, and bean and twinling still drop their gems and pop like any other monster.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | chases the nearest player | the Dot chases until it dies; the Twin keeps living when its own hp hits half — it gives birth once to a fast twin, so a half-kill is a two-kill and a burst before the threshold is a free choice |
| Puff | splits into little critters | the Puff splits into three Dots on its own death and is gone; the Twin's twin is born at half hp, the bean keeps living, and the child is one fast chaser that can never give birth |
| Brood | births while alive | the Brood's births are triggered by you staying close and repeat while you stay (up to 3 Dots); the Twin's birth is triggered by its own damage, happens exactly once, and the twin chases faster than a Dot |
| Sleeper | a face change before it acts | the Sleeper's face change is waking to chase, and it can doze back off; the Twin's shudder is a birth — it cannot be put back to sleep, only aborted by killing the bean in the 0.4 s |
| Zippy | a windup before it acts | the Zippy's windup ends with its own body dashing at you; the Twin does not move during its shudder — what arrives is a second critter beside it, not the bean |

## Design (architect, desktop)

### Files
- create `src/content/monsters/twin.ts` - the bean ("Twin"): berry bean look, chase, one-time half-hp shudder + birth
- create `src/content/monsters/twinling.ts` - the small fast bean ("Twinling"): same shape lightened, default chase, weight 0
- edit `src/content/palette.ts` - one line: add `berry: '#e64980'` to the warm group
- edit `src/content/monsters/index.ts` - two imports and two registry lines after `brood`

### Interfaces
No new types. Two `MonsterDef` exports; server-side state only in `m.mem` (`ss` 0/1 shudder state, `tt` seconds left, `born` 0/1) and `m.slots[0]` (0 = calm, 1 = shuddering — the only synced state; `twinling` uses none).

### Steps
1. `src/content/palette.ts`: after `violet: '#845ef7',` add `berry: '#e64980',`. First check T0085 (Toss) hasn't landed an `#e64980` line — if it has, skip this step; if its melon uses that color, use the one remaining palette color no monster uses and record the final hex in a comment in `twin.ts`. Today the palette has no berry, so the normal path applies.
2. Create `src/content/monsters/twin.ts` exactly:
```ts
import { chase, drawCritter, drawFace, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const SHUDDER = 0.4;
const BIRTH_OFFSET = 20;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const SHUDDER_F: Face = { mood: 'scared', eyes: 2, mouth: 'o' };

const look: Look = { shape: 'circle', color: PALETTE.berry, face: CALM };
look.draw = (g, e) => {
  const shudder = e.slots[0] === 1;
  const face = shudder ? SHUDDER_F : CALM;
  const r = e.radius;
  g.save();
  if (shudder) { // the shudder: a small shake around the centre, driven by e.time so every client sees it
    const j = r * 0.12;
    g.translate(Math.sin(e.time * 30 + e.seed * 3) * j, Math.cos(e.time * 26 + e.seed) * j * 0.5);
  }
  g.save();
  g.scale(0.84, 1.1); // bean: a tall oval, inside the 0.8..1.2 squash
  drawCritter(g, look, e, { ink: PALETTE.ink }); // no face: the face keeps its shape
  g.restore();
  g.beginPath();
  g.arc(0, -1.14 * r, 0.34 * r, 0.59, 2.55); // the notch: a short dip across the top, both ends inside the body
  g.strokeStyle = PALETTE.ink;
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2));
  g.stroke();
  drawFace(g, face, r, e.angle, PALETTE.ink);
  g.restore();
};

/** The kill that doesn't kill: at half hp it shudders, births one twinling, and keeps living. */
export const twin: MonsterDef = {
  id: 'twin',
  name: 'Twin',
  description: 'At half hp it shudders, births a twinling, and keeps living.',
  hp: 40,
  speed: 70,
  radius: 16,
  damage: 10,
  xp: 3,
  weight: 4,
  fromLevel: 4,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    if (mem.ss === 1) { // shuddering: stopped and shaking
      m.vx = 0;
      m.vy = 0;
      const left = (mem.tt ?? 0) - dt;
      if (left <= 0) { // still alive after 0.4 s: give birth once, off the line to its target
        const t = m.target;
        const a = t ? Math.atan2(t.y - m.y, t.x - m.x) : ctx.rng.range(0, Math.PI * 2);
        const side = ctx.rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2;
        const x = m.x + Math.cos(a + side) * BIRTH_OFFSET;
        const y = m.y + Math.sin(a + side) * BIRTH_OFFSET;
        ctx.spawnMonster('twinling', x, y);
        ctx.effect('pop', { x, y }, undefined, 10);
        mem.born = 1;
        mem.ss = 0;
        m.slots[0] = 0;
        return;
      }
      mem.tt = left;
      m.slots[0] = 1;
      return;
    }
    if (!mem.born && m.hp <= m.maxHp / 2) { // first dip to half: the shudder
      mem.ss = 1;
      mem.tt = SHUDDER;
      m.vx = 0;
      m.vy = 0;
      m.slots[0] = 1;
      return;
    }
    m.slots[0] = 0;
    chase(m);
  },
};
```
3. Create `src/content/monsters/twinling.ts` exactly:
```ts
import { drawCritter, drawFace, shade, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const ANGRY: Face = { mood: 'angry', eyes: 1, mouth: 'o' };

/** The bean's color lightened the way Flee's coral lightens the Dot's red. */
const look: Look = { shape: 'circle', color: shade(PALETTE.berry, 0.4), face: ANGRY };
/** A little bean: the same tall oval and notch, no shudder (it can never give birth). */
look.draw = (g, e) => {
  const r = e.radius;
  g.save();
  g.scale(0.84, 1.1);
  drawCritter(g, look, e, { ink: PALETTE.ink }); // no face: the face keeps its shape
  g.restore();
  g.beginPath();
  g.arc(0, -1.14 * r, 0.34 * r, 0.59, 2.55); // the notch
  g.strokeStyle = PALETTE.ink;
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2));
  g.stroke();
  drawFace(g, ANGRY, r, e.angle, PALETTE.ink);
};

/** Born from a wounded Twin; chases the nearest player and never gives birth. */
export const twinling: MonsterDef = {
  id: 'twinling',
  name: 'Twinling',
  description: 'A small, fast bean born from a wounded Twin.',
  hp: 8,
  speed: 110,
  radius: 10,
  damage: 8,
  xp: 1,
  weight: 0,
  fromLevel: 1,
  look,
};
```
No `think` on the twinling: the engine's default `chase()` is exactly what it wants (same as `puff`). No `onDeath` on either: the engine drops the gem and plays the `pop` death effect.
4. `src/content/monsters/index.ts`: after the `brood` import add `import { twin } from './twin.ts';` and `import { twinling } from './twinling.ts';`; in `MONSTERS`, after `brood,` add `twin,` and `twinling,` (next to the other birthing monster).
5. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Threshold: use `m.hp <= m.maxHp / 2`, never `def.hp / 2` — monster hp is scaled by the player's level, and `m.maxHp` carries that scale.
- `mem.born` is the once-only gate: after birth `mem.ss` returns to 0, and the `!mem.born` check keeps the shudder from ever starting again.
- Death during the shudder is handled for free: the birth line only runs after the timer expires on a live monster; the engine gives the gem and `pop`. Do not add an `onDeath`.
- No `Math.random`/`Date` in `think` — `ctx.rng` only. No module variables — `mem` and `slots` only.
- Draw is per-client: the jitter must come from `e.time`/`e.seed` (read-only), never written to `e.slots`.
- The notch arc numbers keep both ends inside the body (one outline per sticker); don't stroke a second full outline or move the endpoints. Body scale stays 0.84/1.1 — the engine's own wobble multiplies on top.
- `twinling` weight 0 means the field spawner never makes one; only `ctx.spawnMonster` inside the twin's `think` does.
- If T0085 lands between design and build and touches `palette.ts`, re-check before adding the `berry` line (step 1).

### Tests
- none (content is tested automatically by engine/tests/; no pure helper is added).

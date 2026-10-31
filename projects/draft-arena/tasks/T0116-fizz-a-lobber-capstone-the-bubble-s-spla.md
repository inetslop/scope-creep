---
id: T0116
title: "Fizz: a Lobber capstone, the bubble's splash lingers and strikes every 0.5 s"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T19:30:37Z
claimed_at: 2026-10-31T19:51:27Z
finished_at: 2026-10-31T20:21:51Z
epic: E23
---

## Goal
A committed Lobber's splash stops being a one-shot: where a bubble's splash lands, the ice stays 2.5 s and keeps striking, so kiting leaves a trail of popping ice and a held splash is a real zone.

## Details
- This supersedes T0109, the failed first draft of this same capstone (rejected only for an incomplete table). Everything below is the full spec.
- **Fizz is an on-hit upgrade** — it must be, because no server hook can ask a player for their upgrades: its one hook fires when your bubble's splash strikes, and when you have Fizz it lays a **fizz-puddle** at the splash's spot.
  - Radius: the splash's radius where it landed, so **Wide makes the puddle as big as the splash**.
  - Lasts 2.5 s and strikes everything inside (monsters and players alike) every 0.5 s for 3 damage (players at half, as with all your hits) — five strikes.
  - **No slow** (that is Slush).
  - One puddle per splash. A fizz-puddle's own strikes lay no new puddles. Split's fanned bubbles each leave their own puddle where they land.
  - If Bop (T0118) has landed by build time: a popped bubble leaves no splash, and so no fizz-puddle.
- **Look:** a shallow ice puddle with an ink rim — the splash's rim, flattened to the ground, in the splash's teal/ice colors. A small white tick (a 4-unit pop, no glow) where it strikes, each 0.5 s.
- **Talent line (Lobber tree, planning/modules/talents.md):** id `fizz`, upgrade `fizz`, max 1, needs `[["lob", 4]]` — the capstone beside Fuse, the same commitment as Fuse.
- **Text:** "When your bubble's splash lands, it lingers 2.5 s and strikes everything inside every 0.5 s for 3 damage. The puddle is as big as the splash."
- **With every weapon:** Fizz is the Lobber's capstone and reacts only to your bubble's splash. A player who cross-trained elsewhere (for example Split from the Gunner) gets a puddle per fanned bubble that lands; Fizz never touches any other tree's weapon.

## Compared with what exists
Fizz is an on-hit, so one row for every on-hit and on-kill upgrade that exists:

| Existing | What it shares | What Fizz does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | on-hit hook on your hits | sends one bolt on to another enemy; Fizz leaves ground where your splash landed |
| Reckless | on-hit that changes the hit | doubles your hits while you are hurt; Fizz adds strikes on the ground after the hit |
| Chill | on-hit that acts on the victim it hit | slows the one it hit; Fizz strikes whoever stands in the spot afterwards |
| Reap | on-hit extra damage | adds damage to a half-dead target it hits; Fizz keeps striking the spot on a timer |
| Swarm | on-hit scaled by the crowd | scales with the enemies around the target; Fizz strikes the spot no matter who is around |
| Leech | on-hit that pays the attacker | heals you while the crowd is on you; Fizz pays the ground, not you |
| Mend | on-hit that heals the attacker | heals you on a Nerve hit; Fizz never heals |
| Gore | on-hit that extends a shot | lets a Nerve jab pass through while you are hurt; Fizz extends a splash in time, not range |
| Cling | on-hit that lays a field | splats a riding field on the critter it hit; Fizz lays a field on the ground where the splash was |
| Snare | on-hit that marks the victim | saps the one it hit so your damage bites it harder; Fizz marks the spot, and it bites whoever stands there later |
| Chomp | on-kill | heals you when a kill happens; Fizz reacts to a splash's strike and it strikes back |
| Adrenaline | on-kill that buffs you | sprints you on a kill while hurt; Fizz leaves a hazard where you hit |
| Fang | on-kill coin | pays coins on a kill while hurt; Fizz pays damage over time on the ground |
| Fuse | a reaction to your bubble's kills | pops a one-shot ring where a bubble killed; Fizz makes the splash itself linger and strike again |
| Scatter | a kill that spawns more attacks | pops a Goo kill into 4 seekers; Fizz keeps the same splash striking where it landed |
| Gush | lays a puddle where a kill happens | a slow puddle at a Goo kill, refreshed while you stand in it; Fizz's puddle strikes (no slow) and is where the splash lands, not where a kill happened |
| Chew | a puddle that bites | bites whatever stands in your Gush puddle; Fizz's bite is on any splash that lands, with no puddle there before |
| Nest | on-kill scaled by the crowd | heals per neighbor of the corpse; Fizz's puddle is as big as the splash and strikes on a timer |
| Sting | on-kill burst | bursts the corpse when the crowd is on it; Fizz's field stays after everything is dead |
| Scavenge | on-kill xp | pays xp per neighbor of the corpse; Fizz pays damage per strike, with no kill needed |

## Acceptance criteria
- [ ] A player with Fizz: after a bubble's splash strikes, a puddle the size of the splash stays where it was for 2.5 s and strikes everything inside (monsters and players, players at half) every 0.5 s for 3 damage.
- [ ] A puddle from a rank-3 Wide splash is visibly bigger than one without Wide.
- [ ] A critter standing in a fizz-puddle moves at full speed (the puddle slows nothing).
- [ ] A fizz-puddle's strikes lay no further puddles.
- [ ] A player without Fizz is unchanged: the splash strikes once and is gone.
- [ ] Split's fanned bubbles each leave their own puddle where they land.
- [ ] A small white tick where the puddle strikes, each 0.5 s.
- [ ] Fizz is in the Lobber tab of the talents panel as a 1-rank capstone beside Fuse, needs Lob 4, with the text above.

## Design (architect, desktop)

### Files
- create `src/content/areas/fizz-puddle.ts` — `fizzPuddle: AreaDef`: the lingering ice puddle (life 2.5, interval 0.5, strikes via `ctx.strike`, no slow)
- create `src/content/effects/fizz-tick.ts` — `fizzTick: EffectDef`: the small white pop where the puddle strikes
- create `src/content/upgrades/fizz.ts` — `fizz: UpgradeDef`: on-hit that lays one fizz-puddle per bubble splash
- edit `src/content/areas/index.ts` — add `import { fizzPuddle } from './fizz-puddle.ts';` and `fizzPuddle,` in `AREAS` right after the `chewPuddle,` line
- edit `src/content/effects/index.ts` — add `import { fizzTick } from './fizz-tick.ts';` and `fizzTick,` in `EFFECTS` right after the `slowPop,` line
- edit `src/content/upgrades/index.ts` — add `import { fizz } from './fizz.ts';` and `fizz,` in `UPGRADES` right after the `fuse,` line
- edit `src/content/talents/lobber.ts` — add one talent line after the `fuse` line (line 14)

### Interfaces
No new types; three content defs, exact code:

`src/content/areas/fizz-puddle.ts` (copy the file shape of `chew-puddle.ts`):
```ts
import { noise, shade, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Fizz's puddle: where a bubble's splash lands, the ice stays 2.5 s and strikes everything inside
 * (monsters and players alike, players at half) every 0.5 s - five strikes. No slow (that is
 * Slush). Laid by the fizz upgrade at the splash's spot, as big as the splash.
 */
export const fizzPuddle: AreaDef = {
  id: 'fizz-puddle',
  radius: 70,
  life: 2.5,
  interval: 0.5,
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      const a = Math.min(1, (1 - e.hp) * 5, e.hp * 2.5); // fade in fast, out over the last second
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a;
      g.scale(1, 0.55); // the splash's rim, flattened to the ground
      g.fillStyle = shade(PALETTE.ice, 0.25);
      g.beginPath();
      g.arc(0, 0, e.radius, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.setLineDash([5, 7]);
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      for (let i = 0; i < 3; i++) {
        const ang = noise(e.seed, i) * Math.PI * 2;
        const d = 0.3 + 0.45 * noise(e.seed, i + 3);
        g.beginPath();
        g.arc(Math.cos(ang) * d * e.radius, Math.sin(ang) * d * e.radius, 2.5, 0, Math.PI * 2);
        g.fillStyle = PALETTE.white;
        g.fill();
      }
      g.restore();
    },
  },
  pulse(ctx, a) {
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) {
      ctx.effect('fizz-tick', { x: u.x, y: u.y });
      ctx.strike(a, u); // 3 damage (mine, before my damage stat), half vs players, no slow
    }
  },
};
```

`src/content/effects/fizz-tick.ts` (copy `slow-pop.ts`):
```ts
import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The fizz-puddle's strike: a small white pop where it lands. */
export const fizzTick: EffectDef = {
  id: 'fizz-tick',
  duration: 0.25,
  draw(g, fx) {
    g.globalAlpha = 1 - fx.t;
    const r = 4 + 8 * fx.t; // a 4-unit pop that grows as it fades
    g.fillStyle = PALETTE.white;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = PALETTE.ink;
    g.stroke();
  },
};
```

`src/content/upgrades/fizz.ts` (copy `fuse.ts`):
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Lobber capstone beside Fuse: the splash itself lingers. One fizz-puddle per splash, at the
 * splash's spot, as big as it; the puddle's own strikes (a different area) lay none.
 */
export const fizz: UpgradeDef = {
  id: 'fizz',
  name: 'Fizz',
  description: "When your bubble's splash lands, it lingers 2.5 s and strikes everything inside every 0.5 s for 3 damage. The puddle is as big as the splash.",
  maxLevel: 1,
  look: { shape: 'circle', color: PALETTE.ice },
  onHit(ctx, me, _level, hit) {
    const a = hit.area;
    if (!a || a.def.id !== 'splash') return; // only the bubble's splash; never the puddle's own strikes
    if (a.slots[0] === 1) return; // this splash already fizzed: one puddle per splash
    a.slots[0] = 1;
    // The engine multiplies the area's radius by my area stat, so divide to land on the splash's
    // final radius: a Wide splash leaves a puddle as big as it.
    ctx.area(me, 'fizz-puddle', { x: a.x, y: a.y, radius: a.radius / me.stats.area, damage: 3 });
  },
};
```

`src/content/talents/lobber.ts` — insert after the `fuse` line:
```ts
    { id: 'fizz', upgrade: 'fizz', max: 1, needs: [['lob', 4]] },
```

### Steps
1. Create `src/content/effects/fizz-tick.ts` exactly as above.
2. Create `src/content/areas/fizz-puddle.ts` exactly as above.
3. Create `src/content/upgrades/fizz.ts` exactly as above.
4. Add the three registry lines (areas, effects, upgrades) and the one talent line, each beside its related line as specified.
5. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **Double radius scaling:** the engine computes area radius as `(opts.radius ?? def.radius) * me.stats.area`. Passing `radius: a.radius` (already scaled) makes a rank-3 Wide puddle 1.6²× the splash, not 1.6×. Always pass `a.radius / me.stats.area` as written.
- **`hit.area.id` is a number** (entity id) — the splash check is `a.def.id !== 'splash'`, never `a.id`.
- **Self-laying:** `ctx.strike` fires the owner's on-hit hooks, so the puddle's own strikes re-enter Fizz's onHit. The `def.id` guard is what stops puddle-on-puddle chains; keep it before the slot check.
- The first puddle pulse is immediate (area `interval` pulses at once), so strikes land at 0, 0.5, 1, 1.5, 2 s — exactly five. Don't "fix" this by delaying.
- No `Math.random`/`Date` in draw (use `noise(e.seed, i)`); no status in the pulse (the puddle slows nothing); do not touch `splash.ts`, `bubble.ts` or `wide.ts`.
- If Bop (T0118) lands first, popped bubbles simply never lay a splash — Fizz needs no change and no import from it.

### Tests
none (no pure helpers in src/; engine/tests/ covers the new upgrade, area, effect and talent automatically).

## Result (attempt 1, asus)

Added Fizz, the Lobber capstone beside Fuse: a bubble's splash now leaves a fizz-puddle (new area `src/content/areas/fizz-puddle.ts`) that lingers 2.5 s and strikes everything inside every 0.5 s for 3 damage (players half, no slow), as big as the splash, with a small white pop effect (`src/content/effects/fizz-tick.ts`) on each strike. The on-hit upgrade (`src/content/upgrades/fizz.ts`) lays exactly one puddle per splash — the puddle's own strikes can't re-trigger it — so Split's fanned bubbles each leave their own. Registered all three items in their index files and added the 1-rank `fizz` talent (needs Lob 4) to the Lobber tree; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 30.4 min

```
.../game/src/content/areas/fizz-puddle.ts          | 53 ++++++++++++++++++++++
 .../draft-arena/game/src/content/areas/index.ts    |  2 +
 .../game/src/content/effects/fizz-tick.ts          | 19 ++++++++
 .../draft-arena/game/src/content/effects/index.ts  |  2 +
 .../draft-arena/game/src/content/talents/lobber.ts |  1 +
 .../draft-arena/game/src/content/upgrades/fizz.ts  | 23 ++++++++++
 .../draft-arena/game/src/content/upgrades/index.ts |  2 +
 7 files changed, 102 insertions(+)
```

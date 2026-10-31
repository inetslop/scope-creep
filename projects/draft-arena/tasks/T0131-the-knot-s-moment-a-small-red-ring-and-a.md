---
id: T0131
title: "The knot's moment: a small red ring and a soft pop where a grudge starts"
size: S
priority: 2
status: todo
depends_on: [T0130]
attempts: 0
created: 2026-10-31T22:29:04Z
epic: E30
---

## Goal
Starting a feud is a pvp moment the field should feel — right now the red knot just appears on top of the knockout burst, so a player near the fight cannot tell a plain knockout from the start of a personal feud.

## Details
- In `src/content/directors/grudge.ts`, in the branch where a feud forms (the `else if` that calls `setGrudge`), play the moment once, at the killer's critter: a small ring and a soft pop. Add it in that branch, not inside `setGrudge` (which runs once per side), so it fires once per feud, on a first formation and on any repeat.
- The ring: a new effect `src/content/effects/knot-ring.ts`, registered in `src/content/effects/index.ts` — a small candy-red ring with an ink rim (the game's threat color, like the knot and the wound) that blooms from the killer's critter out to radius 30 over 0.4 s, no confetti (this is not a death). Modeled on `src/content/effects/splash-ring.ts` (a small ink-rimmed ring that blooms to its value).
- The pop: a new sound in `src/audio/sfx.ts`, modeled on `bloop(seed, age)` (T0103) — a soft low pop (about 240 to 160 Hz over 0.1 s, peak 0.06), deduped per effect seed, one per feud. Lower and softer than the knockout bonk so it sits under the burst, not on top of it.
- What a player sees and hears: at the moment the second mutual knockout happens, a small red ring blooms off the killer's critter and a soft pop lands under the knockout burst — the field knows a feud has started. The victim's knot still arrives with its 3 s respawn, with no second ring: the moment belongs to the knockout that started the feud.
- No HUD element: the moment is on the field and in the ear only.

## Acceptance criteria
- [ ] When a grudge forms, a small red ink-rimmed ring blooms from the killer's critter (out to about 30 units over 0.4 s) and a soft pop plays — once per feud, on a first formation and on a repeat.
- [ ] The pop is clearly lower and softer than the knockout bonk and the monster pop, and plays only when a grudge forms — not on a plain knockout, and not when a feud ends (the ending keeps its own burst and coin).
- [ ] The ring reads at a glance in candy red against the mint field and the knockout burst, and no HUD element is added.

## Design (architect, yoga)

### Files
- create `src/content/effects/knot-ring.ts` — the grudge moment: small candy-red ring with an ink rim, id `knot-ring`, duration 0.4
- edit `src/content/effects/index.ts` — register `knotRing` (import + list line, both right after the `splashRing` lines)
- edit `src/audio/sfx.ts` — add the `knotPop` sound (one new function + one `last` variable)
- edit `src/content/directors/grudge.ts` — fire the effect once per feud in the formation branch

### Interfaces
```ts
// src/content/effects/knot-ring.ts
import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { knotPop } from '../../audio/sfx.ts';

/** A grudge forms: a small candy-red ring with an ink rim blooms out to its value (30). */
export const knotRing: EffectDef = {
  id: 'knot-ring',
  duration: 0.4,
  draw(g, fx) {
    knotPop(fx.seed, fx.age);
    const r = fx.value * fx.t;
    if (r <= 0) return;
    g.globalAlpha = 1 - fx.t;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.lineWidth = 3;
    g.strokeStyle = PALETTE.ink;
    g.stroke();
    if (r > 4) {
      g.beginPath();
      g.arc(fx.ax, fx.ay, r - 2, 0, Math.PI * 2);
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.red;
      g.stroke();
    }
  },
};
```
Copy this file exactly: it is `splash-ring.ts` with `PALETTE.ice` → `PALETTE.red` (the knot's threat color), `fx.value * fx.t` so the passed value is the bloom radius, no confetti. In `src/audio/sfx.ts`, add `let lastKnotPop = 0; // performance.now() of the last knot pop` after the `lastRumble` line, and after the `bloop` function (line 155) add, modeled on `bloop`, exactly:

```ts
export function knotPop(seed: number, age: number): void {
  if (!ctx) return;
  if (age > 0.25) return; // the ring's first frames only
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (now - lastKnotPop < 200) return;
  lastKnotPop = now;
  if (active >= 6) return;
  active += 1;
  blip(240, 0.06, 0.1, 160); // 240 -> 160 Hz over 0.1 s, peak 0.06
}
```
(plus the same doc comment as `bloop`'s, saying: one soft low pop when a grudge forms, lower and softer than the knockout bonk so it sits under the burst; called from the knot-ring effect's draw).

### Steps
1. Create `src/content/effects/knot-ring.ts` with the exact code above.
2. In `src/content/effects/index.ts`: `import { knotRing } from './knot-ring.ts';` after the `splashRing` import; `knotRing,` right after `splashRing,` in the list.
3. In `src/audio/sfx.ts`: add the `lastKnotPop` line and the `knotPop` function as above (do not touch any other sound).
4. In `src/content/directors/grudge.ts`, in the `onKill` branch where a feud forms — the `else if` that calls `setGrudge(...)` — add exactly this inside that branch (not inside `setGrudge`): `ctx.effect('knot-ring', { x: killer.x, y: killer.y }, undefined, 30);`

### Pitfalls
- The effect line goes in the formation branch only: `setGrudge` runs once per side, so a line inside it would bloom two rings.
- The 4th `ctx.effect` argument is the bloom radius (30), not a duration; `duration: 0.4` is the seconds.
- One pop per feud: the director fires the effect once, and `knotPop` dedupes per effect `seed` — no second pop for the victim's knot, none when a feud ends.
- No HUD part, no confetti, no second ring; `PALETTE` import only from `src/content/palette.ts`.

### Tests
- none

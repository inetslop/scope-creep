---
id: T0129
title: "The surge warns: a dust ring and a low rumble where the swarm line walks in"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T21:28:31Z
---

## Goal
The swarm surge starts at the edge of the field, where nobody is looking: a line of Dots is already walking before a player notices. A dust ring at the entry point and a low rumble show where the threat comes from and when it is coming.

## Details
- New effect `src/content/effects/surge-dust.ts`, modeled on `geyser-bubble.ts` (a ring that blooms, confetti, no glow): a small coral dust ring with an ink rim that blooms to radius 45 over 0.6 s, with 6 small coral confetti off it. Registered in `src/content/effects/index.ts`.
- In the swarm-surge director (`src/content/directors/swarm-surge.ts`), when a surge line spawns, create one `surge-dust` effect at the middle of the line's spawn edge — one per spawned line, not one per Dot.
- New sound in `src/audio/sfx.ts`, modeled on `bloop` (per-effect dedupe, one per 150 ms, gesture and match-on-screen gates): a low "rumble", a sine sweep from 110 Hz to 55 Hz over 0.5 s, peak 0.08, played the moment the dust ring blooms — clearly lower and longer than the Toss bloop and the monster pop.

## Acceptance criteria
- [ ] Every time a swarm surge line walks in from an edge, a small coral dust ring with 6 confetti blooms at the middle of the entry line and a low rumble plays, on desktop and mobile after the first gesture.
- [ ] The ring and the rumble happen once per spawned line and never on monster deaths, other events or pickups.
- [ ] The ring is a warm palette color (coral), ink-rimmed, no glow, and it is gone by the end of its 0.6 s bloom.
- [ ] A player standing off to the side hears the rumble before the line reaches the middle of the field.

## Design (architect, yoga)

### Files
- create `src/content/effects/surge-dust.ts` — the `surgeDust` effect: coral dust ring + 6 confetti + one rumble sound
- edit `src/content/effects/index.ts` — one import + one line in `EFFECTS`
- edit `src/content/directors/swarm-surge.ts` — one `ctx.effect` call per spawned line, at the line's middle
- edit `src/audio/sfx.ts` — `rumble(seed, age)` export, modeled on `bloop` (lines 140-154)

### Interfaces
```ts
// sfx.ts, after line 16 (lastBloop):
let lastRumble = 0; // performance.now() of the last rumble
export function rumble(seed: number, age: number): void; // copy bloop's body exactly, changing only:
//   its own map/dedupe stays `heard`, throttle `if (now - lastRumble < 150) return; lastRumble = now;`,
//   and the last line `blip(110, 0.08, 0.5, 55); // 110 -> 55 Hz over 0.5 s, peak 0.08`
//   keep: `if (!ctx) return; if (age > 0.25) return;` + the `now - lastHud > 1000` gate, `heard` dedupe (now+700, size>96 sweep), `if (active >= 6) return; active += 1;`
// surge-dust.ts:
export const surgeDust: EffectDef; // id 'surge-dust', duration 0.6
```

### Steps
1. `sfx.ts`: add `let lastRumble = 0;` after line 16. Add `rumble` as a copy of `bloop` (lines 140-154) with the changes above; doc comment: "One low rumble when a swarm-surge dust ring blooms at the edge: a 110 Hz sine falling to 55 Hz over 0.5 s, peak 0.08 — lower and longer than the bloop, so the incoming line is heard before it walks in. Called from the surge-dust effect's draw() on every client: at most once per ring (its seed), at most one rumble per 150 ms, under the same 6-voice cap as the pops."
2. `surge-dust.ts`, modeled on `sting-burst.ts`:
```ts
import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { rumble } from '../../audio/sfx.ts';

/** Swarm surge: at the middle of the edge a line walks in from, a coral dust ring with an ink rim blooms out to radius 45, 6 coral confetti off it. */
export const surgeDust: EffectDef = {
  id: 'surge-dust',
  duration: 0.6,
  draw(g, fx) {
    rumble(fx.seed, fx.age);
    g.globalAlpha = 1 - fx.t;
    const r = 45 * fx.t;
    g.lineWidth = 6;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 3;
    g.strokeStyle = PALETTE.coral;
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = r * (0.6 + 0.4 * noise(fx.seed, i + 6));
      g.fillStyle = PALETTE.coral;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 3.5 * (1 - fx.t) + 1, 0, Math.PI * 2);
      g.fill();
    }
  },
};
```
3. `swarm-surge.ts`: in the spawn loop add `let born = 0;` before it and `born++;` after the `m.slots[1] = 1;` line; after the loop add one call (one per spawned line, never per Dot):
```ts
    if (born > 0) {
      // The middle of the line's spawn edge: along = a0 + SPAN/2, at the edge.
      const mx = edge === 0 ? 30 : edge === 2 ? width - 30 : a0 + SPAN / 2;
      const my = edge === 1 ? 30 : edge === 3 ? height - 30 : a0 + SPAN / 2;
      ctx.effect('surge-dust', { x: mx, y: my });
    }
```
4. `effects/index.ts`: `import { surgeDust } from './surge-dust.ts';` and add `surgeDust,` after the `geyserBubble,` line.

### Pitfalls
- One `ctx.effect` per line (after the loop), never inside it — 12 effects per surge would stack rumbles (the 150 ms gate in `rumble` would also swallow them).
- `born` guard: a line whose Dots all fail to spawn (`spawnMonster` returns undefined) gets no ring/rumble.
- Sound goes out of the effect's `draw()` (like `pop.ts`/`sting-burst.ts`), not the director — the director runs server-side only; `draw` runs on every client and the `!ctx`/`age > 0.25`/`lastHud` gates handle unlock, first-frames-only, and match-on-screen.
- `r` is 0 on the first frame: `g.arc(..., 0, ...)` is fine (no NaN); no glow/gradients; only `PALETTE.coral`/`PALETTE.ink`.
- Do not touch `bloop` or other `sfx.ts` lines; only add the variable and the function.

### Tests
- none (content is tested automatically by engine/tests/: the effect must be in `EFFECTS` or the test fails).

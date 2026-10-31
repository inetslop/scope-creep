---
id: T0036
title: "Crown fall: the crown flies off and pops where the leader is knocked out"
assignee: asus
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T06:50:30Z
claimed_at: 2026-10-31T08:38:10Z
epic: E4
---

## Goal
Knocking out the leader becomes a moment the whole field sees: the crown flies off the fallen player's head and pops into confetti, and a ring marks where the crown — and its gem — landed.

## Details
- New effect file `src/content/effects/crown-fall.ts`, registered in `src/content/effects/index.ts`. Closest example: `src/content/effects/prestige-ring.ts` (T0023).
- What plays, at the spot where the crowned player is knocked out, on top of the normal knockout burst: a small yellow 3-point crown about 24 units wide (the same crown the leader wears) lifts off the body, spins slowly and rises about 60 units over 0.9 s, then pops into 20 yellow confetti stars; and a yellow ring with an ink rim spreads out to a radius of 120 over 0.8 s at the spot.
- Trigger: the crown director (`src/content/directors/crown.ts`) already tracks who wears the crown and runs `onKill`; when the player just knocked out wore it, play `crown-fall` at their spot. T0014's leader's gem can drop at the same spot at the same time — both are visible.
- Readable in a crowd: a yellow crown lifting off a body is unmissable in a fight, and the ring marks where the prize landed. It is smaller than the prestige ring (120 vs 220) and carries its own shape (the crown is the star), so it never reads as a level-up or a prestige.
- Works with 6 and with 60: one crown per match, so at most one crown fall per knockout, in a quiet match or a full one.

## Acceptance criteria
- [ ] Knocking out the crowned player plays the crown fall: the yellow crown lifts, spins up about 60 units, pops into 20 yellow stars, and a yellow ring (radius 120, 0.8 s) spreads at the spot — on top of the normal knockout burst.
- [ ] Knocking out a player who does not wear the crown plays only the normal knockout burst: no crown, no extra ring.
- [ ] The crown itself moves to the new top scorer exactly as before (strict overtake, unchanged).

## Design (architect, yoga)

### Files
- create `src/content/effects/crown-fall.ts` — `crownFall: EffectDef`: the lifting/spinning crown, the 20-star pop, the 120-radius ring
- edit `src/content/effects/index.ts` — one import line + one `EFFECTS` line
- edit `src/content/directors/crown.ts` — `onKill` plays the effect when the victim wore the crown (2 lines only)

### Interfaces
No new types. `export const crownFall: EffectDef` exactly:

```ts
import { traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Crown fall: the crown lifts off the fallen leader's head, spins up 60 units and pops into 20
 * stars at the top, while a ring spreads at the spot where the crown (and its gem) landed.
 */
export const crownFall: EffectDef = {
  id: 'crown-fall',
  duration: 1.3,
  draw(g, fx) {
    if (fx.age < 0.9) {
      const t = fx.age / 0.9;
      g.save();
      g.translate(fx.ax, fx.ay - t * 60);
      g.rotate(t * 2);
      crownPath(g);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineJoin = 'round';
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    } else if (fx.age < 1.3) {
      const s = (fx.age - 0.9) / 0.4;
      g.globalAlpha = 1 - s;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const d = 8 + s * 52;
        g.save();
        g.translate(fx.ax + Math.cos(a) * d, fx.ay - 60 + Math.sin(a) * d);
        g.beginPath();
        traceShape(g, 'star', 6, a);
        g.fillStyle = PALETTE.yellow;
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = PALETTE.ink;
        g.stroke();
        g.restore();
      }
    }
    if (fx.age < 0.8) {
      const t = fx.age / 0.8;
      const r = 10 + t * 110;
      g.globalAlpha = 1 - t;
      g.lineWidth = 9;
      g.strokeStyle = PALETTE.ink;
      g.beginPath();
      g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = PALETTE.yellow;
      g.stroke();
    }
  },
};

/** A 3-point crown 26 wide and 12 tall, centred on the origin: the crown the leader wears. */
function crownPath(g: CanvasRenderingContext2D): void {
  g.beginPath();
  g.moveTo(-13, 6);
  g.lineTo(-13, -6);
  g.lineTo(-6.5, 2);
  g.lineTo(0, -6);
  g.lineTo(6.5, 2);
  g.lineTo(13, -6);
  g.lineTo(13, 6);
  g.closePath();
}
```

Crown path = the same crown as `areas/crown.ts` (peaks ±13/0, valleys ±6.5 at +2, `lineJoin: 'round'`, ink 2.5).

### Steps
1. Create `src/content/effects/crown-fall.ts` with exactly the code above (model: `src/content/effects/prestige-ring.ts`).
2. In `src/content/effects/index.ts`: add `import { crownFall } from './crown-fall.ts';` after the `prestigeRing` import; add `crownFall,` as a line in `EFFECTS` after `prestigeRing,`.
3. In `src/content/directors/crown.ts`, replace the `onKill` body (lines 16-18) with:
   `if (victim.type === 'player') { if (victim.id === mem.crown) ctx.effect('crown-fall', { x: victim.x, y: victim.y }); check(ctx, mem); }`
   Do not touch `check()` — the crown must keep moving exactly as before.
4. Run `npm run check`.

### Pitfalls
- `draw` is client-only and must stay pure: no `Math.random`/`Date` — all angles come from `i`; lint fails otherwise.
- The effect id string must be exactly `'crown-fall'` in both the def and the `ctx.effect` call.
- `fx.ay - t * 60`: up is −y; do not flip it or the crown sinks through the ground.
- Keep the star burst centred on `fx.ay - 60` (the crown's top), not `fx.ay`.
- The engine already plays the `playerDeath` burst at this same spot; add nothing — crown-fall rides on top.
- T0014 also edits `crown.ts`'s `onKill`; keep this change to the 2 added lines to avoid the merge fight.
- One crown per match ⇒ at most one effect per knockout; no 60-player budget concern.

### Tests
- none (engine/tests/ runs every effect in a real match automatically).

---
id: T0023
title: "Prestige ring: a big confetti ring where a player prestiges"
size: S
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T04:59:35Z
epic: E7
---

## Goal
A prestige is a moment you can see: when a player reaches level 18 and goes back to level 1, everyone around them sees a big ring and confetti where they are, so a reset reads on the field instead of a quiet level-up.

## Details
- Two small files, both modeled on existing ones: a new effect in src/content/effects/ (one file, next to the level-up ring, `ring`, modeled on it but bigger), and a small director in src/content/directors/ (modeled on the gem-rain director) whose onPrestige hook plays it at the player's position.
- The effect: a yellow ring with an ink rim that blooms out to radius 220 over 0.8 s, with 24 yellow confetti stars flying off it. It plays 0.2 s after the level-up ring of the level-18 goes off, so the beat reads as "level up, then something bigger". The level-up ring itself stays exactly as it is.
- At a glance in a crowd, the prestige ring must read as clearly bigger than a level-up: it is the field's biggest ring.
- It plays for any player, including bots. No HUD element, card or text announces it: an effect on the field, no sound.
- One-off: it leaves no field, pickup, status or score behind.

## Acceptance criteria
- [ ] When a player (including a bot) reaches level 18 and prestiges, a yellow ring with an ink rim blooms to radius 220 over 0.8 s at their position, 0.2 s after the level-up ring, with 24 yellow confetti stars, clearly bigger than the level-up ring.
- [ ] Every player in the match can see it where it happens; no HUD element, card or text appears.
- [ ] The effect is one-off: nothing stays on the field after the 0.8 s.
- [ ] Leveling up below level 18 plays only the normal level-up ring, no prestige ring.

## Design (architect, yoga)

### Files
- create `src/content/effects/prestige-ring.ts` — the effect: big yellow ring + 24 stars, drawn 0.2 s into its own duration
- create `src/content/directors/prestige-ring.ts` — the director: plays the effect at the player in `onPrestige`
- edit `src/content/effects/index.ts` — import `prestigeRing` (between the `pop` and `ring` imports) and one list line after `ring,`
- edit `src/content/directors/index.ts` — import (after the `gem-rain` import) and one list line after `gemRain,`

### Interfaces
None — both files are plain data of the existing types `EffectDef` and `DirectorDef`; no signatures change.

### Steps
1. Create `src/content/effects/prestige-ring.ts` exactly (a `ring.ts` with the delay gate, `duration: 1`, `r` to 220, 24 stars):

```ts
import { traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Prestige: the field's biggest ring, 0.2 s after the level-up ring, with 24 stars off it. */
export const prestigeRing: EffectDef = {
  id: 'prestige-ring',
  duration: 1,
  draw(g, fx) {
    if (fx.t < 0.2) return;
    const t = (fx.t - 0.2) / 0.8;
    const r = 26 + t * 194;
    g.globalAlpha = 1 - t;
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.yellow;
    g.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + t * 2;
      g.save();
      g.translate(fx.ax + Math.cos(a) * (r + 14), fx.ay + Math.sin(a) * (r + 14));
      g.beginPath();
      traceShape(g, 'star', 7, t * 5);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    }
  },
};
```

2. Create `src/content/directors/prestige-ring.ts` exactly (gem-rain reduced to its `onPrestige`):

```ts
import type { DirectorDef } from '../../../engine/api.ts';

/** Prestige: the field's biggest ring and 24 stars, where a player goes back to level 1. */
export const prestigeRing: DirectorDef = {
  id: 'prestige-ring',
  name: 'Prestige ring',
  description: 'The biggest ring on the field and 24 stars, where a player prestiges.',
  onPrestige(ctx, _mem, player, _count) {
    ctx.effect('prestige-ring', player);
  },
};
```

3. Add the two registry lines named in ## Files. Do not touch `rules.ts` or `effects/ring.ts`.
4. `npm run check` then `npm run smoke`.

### Pitfalls
- Do NOT add `prestige:` to `rules.effects`: that slot *replaces* the level-up ring at level 18 (engine/sim/match.ts:331, `effects.prestige ?? effects.levelUp`). It must stay unset, so the normal `ring` plays first and the big one follows.
- The 0.2 s offset lives only in the effect (`if (fx.t < 0.2) return;` + `duration: 1`): `onPrestige` runs the same instant as the engine's level-up ring, so no other delay exists.
- `draw` stays a pure function of `fx` (formulas only, no `Math.random`/`Date`); drawing nothing for the first 0.2 s is legal.
- Director keeps no state (`_mem`/`_count`, the `_` prefix convention from `crown.ts`); `ctx.effect('prestige-ring', player)` mirrors gem-rain's `ctx.effect('ring', p)`.

### Tests
None (engine/tests/ runs every effect's draw and the prestige match fires this director's `onPrestige` automatically).

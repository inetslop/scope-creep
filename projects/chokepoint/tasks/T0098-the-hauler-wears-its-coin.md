---
id: T0098
title: The Hauler wears its coin
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
---

## Goal
A first-time player sees the Hauler pays a small fortune before the first kill: the Hauler's token wears the game's coin.

## Details
- On the Hauler's token (T0057 — the big red hexagon at 1.3× Block's size) draw one small flat gold coin on the token's face: the HUD's own coin shape (the stats card's "+N coins" icon, T0013), scaled to about a third of the token's width, flat on the face (no side face, no shadow of its own, no pop), in the coin's own yellow.
- The coin is part of the Hauler's draw: it appears at spawn, sits under the hit flash and the death burst, and moves with the token. It is decoration on the token — not a new entity, effect or HUD element.
- The Hauler's numbers are untouched: hp, speed, size, 10 gold on a kill, 1 life plus 5 gold on a leak (the red "−5" pop), and its wave schedule (waves 9, 13, 17, …). No other enemy changes.
- No input, no sound, no rule change.
- Closest example: the Hauler's own token draw (T0057) for where it goes; the stats card's coin icon (T0013) for the shape. Each enemy now draws from its own content file — the coin lands in the Hauler's, the way the Mute's jam lives in its own files (T0074's pattern).

## Acceptance criteria
- [ ] Every Hauler on the board shows exactly one small flat yellow coin, centred on its hexagon's face, from spawn to death.
- [ ] The coin is the HUD's coin shape at about a third of the token's width, flat (no shadow, no bounce); every other enemy renders byte-identically.
- [ ] The Hauler's kill gold, leak cost and wave schedule are unchanged; desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, narcissus)

### Files
- edit `src/art/entities.ts` — inside `paintEntityTextures`, in the `for (const e of ENEMIES)` loop, after the `if (e.splitsInto !== undefined)` crack block and before the closing `})` of the `paintTexture(...)` callback: add the coin draw. One file total; nothing else changes.

### Interfaces
No new types, exports, or signatures. This is a few lines in one existing painter callback. All imports already exist in `src/art/entities.ts` (`PALETTE`, `rgba` from line 5; `shapePath` from line 7).

### Steps
1. In `src/art/entities.ts`, at the end of the enemy loop's paint callback (after the `splitsInto` crack block, lines 18-30), add exactly:
```ts
      if (e.id === 'hauler') {
        // The Hauler wears its coin: the HUD's own coin shape, flat on the face, a third of the width.
        shapePath(ctx, 'circle', size / 2, size / 2 - depth / 2, r / 3);
        ctx.fillStyle = rgba(PALETTE.yellow, 1);
        ctx.fill();
      }
```
2. Do not touch `src/content/enemies/hauler.ts` (numbers stay: hp 360, speed 0.9, gold 10, livesCost 1, fromWave 9), no new file, no registry, no test.

Why this meets the spec: enemy textures are per-id canvases (`enemyTexture(e.id)`), so only the Hauler's texture gets the coin — every other enemy renders identically. The coin is painted at `r / 3` radius (diameter = one third of the token width `2r`), centred on the face at `(size/2, size/2 - depth/2)` — the same centre `paintToken` used — flat fill in `PALETTE.yellow` (the HUD coin's color from `COIN_TEXTURE` in `src/art/icons.ts`), no side face, no shadow. Being part of the texture means it appears at spawn, moves with the token, and sits under the hit flash (`Enemy` whites out by `setTintFill`, which tints the whole texture) and under the death burst (separate fx objects).

### Pitfalls
- Use `r / 3`, not a hardcoded pixel size: `r` is already in scope (`e.look.size * CELL`) and the token texture scales with it.
- No `setShadow`/no extra canvas calls — any shadow would break "flat, no shadow of its own".
- Don't key anything on screen pixels or add a Phaser sprite: this must stay canvas code inside the one `paintTexture` callback.
- No pooling, layout, input, or shared-file changes, so nothing to clean up; `npm run check` and `npm run smoke` (1280x720 + 412x915) verify.

### Tests
none (art task; numbers untouched).

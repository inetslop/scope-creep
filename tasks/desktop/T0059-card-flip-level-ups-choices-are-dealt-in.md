---
id: T0059
title: Card-flip level-ups — choices are dealt in like cards
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T02:15:10Z
---

## Goal
Level-up choices are no longer three cards that pop into existence: they are dealt in one by one with a card flip, so every level-up lands as a small moment instead of a menu.

## Details
- When the LevelUp scene opens, the three choice cards start face-down: a plain card back — a flat ink rectangle with a thick paper-light border, same size as the finished card, with no name, description, color band or level pips.
- The deal: card 1 begins flipping at 0 ms, card 2 at +150 ms, card 3 at +300 ms. Each flip takes 200 ms (a scale-x from 0 to 1, with the face visible from the flip's midpoint on). Each card's flip plays one short card-flip SFX — a snappy tick plus a soft thump, ~120 ms, built from the existing Sfx primitives, with its own throttle so it can never overlap itself.
- The last flip finishes at ~500 ms. Until that moment, pointer/tap input and the 1/2/3 keys are ignored for card selection. No skip button — the deal is half a second.
- Card faces are unchanged: same name, description, color band, level pips, and the same hover/tap/keyboard selection behavior as today once the deal is done. The run stays paused behind the cards exactly as it does now.

## Acceptance criteria
- [ ] On every level-up the three cards flip in sequence (150 ms apart) with one flip SFX per card, and the whole deal finishes in under 0.7 s.
- [ ] Tapping a card or pressing 1/2/3 during the deal selects nothing; once the deal is done, selecting behaves exactly as before.
- [ ] The finished card faces are identical to today (name, description, color, level pips) and the face-down state never lingers on screen.
- [ ] The run remains paused during and after the deal, as before.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/audio/Sfx.ts` - add `cardFlip()` sound (tick + thump) with its own throttle
- edit `src/scenes/GameScene.ts` - share the existing `Sfx` instance via the registry (set in `create()`, remove in the `SHUTDOWN` handler)
- edit `src/scenes/keys.ts` - add `getSfx()` typed registry getter
- edit `src/scenes/LevelUpScene.ts` - deal the three cards face-down, flip them in sequence, arm input at 500 ms

### Interfaces
```ts
// Sfx.ts
private lastCardFlipAt = 0;                       // field, next to lastPickupCallAt
const CARD_FLIP_THROTTLE_MS = 120;                // module const, next to THROTTLE_MS
cardFlip(): void;                                 // snappy tick + soft thump, ~120 ms

// keys.ts
export function getSfx(scene: Phaser.Scene): Sfx | undefined;  // scene.registry.get('sfx')

// LevelUpScene.ts
private flipCard(back: Phaser.GameObjects.Container, face: Phaser.GameObjects.Container, sfx: Sfx | undefined): void;
private makeCardBack(x: number, y: number, w: number, h: number): Phaser.GameObjects.Container;
// makeCard's return type changes from void to Phaser.GameObjects.Container
```
`cardFlip()` body (follows the existing `hit()` throttle idiom):
```ts
if (!this.canPlay()) return;
const now = performance.now();
if (now - this.lastCardFlipAt < CARD_FLIP_THROTTLE_MS) return;
this.lastCardFlipAt = now;
this.noise(0.05, 0.25, 3500, 'highpass');          // tick
this.tone('sine', 180, 80, 0.12, 0.22, 0.03);      // thump
```

### Steps
1. `Sfx.ts`: add the const, the field, and `cardFlip()` (place it right after `levelUp()`).
2. `GameScene.ts`: after `this.sfx = new Sfx(this);` (line 90) add `this.registry.set('sfx', this.sfx);`; inside the `SHUTDOWN` handler add `this.registry.remove('sfx');` beside the other `registry.remove` calls.
3. `keys.ts`: add `import type { Sfx } from '../audio/Sfx';` and `getSfx()` following `getStillLife()`.
4. `LevelUpScene.ts` `create()`: get `const sfx = getSfx(this);`. In the `defs.forEach`, compute `x`/`y` as today, then: `const back = this.makeCardBack(x, y, cardW, cardH);` and `const face = this.makeCard(def, x, y, cardW, cardH, run.upgradeLevel(def.id), i + 1);` then `face.setScaleX(0); face.setVisible(false); this.time.delayedCall(i * 150, () => this.flipCard(back, face, sfx));`
5. `LevelUpScene.ts`: add `flipCard()` — `if (this.chosen) return; sfx?.cardFlip();` then `this.tweens.add({ targets: back, scaleX: 0, duration: 100, ease: 'Linear', onComplete: () => { back.setVisible(false); face.setVisible(true); this.tweens.add({ targets: face, scaleX: 1, duration: 100, ease: 'Linear' }); } });` (matches the `onComplete`-in-config idiom in `HudScene`/`ArcSystem`).
6. `LevelUpScene.ts`: add `makeCardBack()` — graphics with `g.fillStyle(PALETTE.ink, 1); g.fillRect(-w / 2, -h / 2, w, h); g.lineStyle(8, PALETTE.paperLight, 1); g.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);` returned in `this.add.container(x, y, [g])` (no `setSize`, no `setInteractive`).
7. `LevelUpScene.ts` `makeCard()`: `return card;` at the end; gate hover with the arm: `card.on('pointerover', () => { if (this.armed) card.setScale(1.04); });` and same `if (this.armed)` guard in `pointerout`. `pointerup` is already gated by `armed` in `choose()`.
8. `LevelUpScene.ts`: change the arm timer from 300 to 500 ms (`// input unlocks only after the last flip lands (300 + 200 ms)`) and the smoke pick from 250 to 700 ms (keep `force = true`).

### Pitfalls
- Timing is exact and clock-shared: tweens and `delayedCall` both run on the scene clock (only GameScene is paused), so the deal is deterministically 0/150/300 ms start, 500 ms finish, arm at 500 ms. Do not use `dt` or `Math.random()` here.
- The face must start with BOTH `scaleX = 0` and `setVisible(false)` — invisible containers don't take pointer events, but `armed` gates `choose()` anyway. Never let a back linger: hide it in the first tween's `onComplete`.
- Keep the keyboard bindings as `.once(...)` exactly as today — a keypress during the deal consumes the binding just like today's 300 ms arm window does; "behaves exactly as before" means not touching those lines.
- Don't create a new `Sfx` in LevelUpScene: it would double-connect a master gain. Reuse GameScene's via the registry; `getSfx(this)` is `Sfx | undefined` so use `sfx?.cardFlip()`.
- `Sfx.ts` is also touched by T0058 (boss sting) — this change is purely additive (one const, one field, one method), so it won't collide; apply T0058 and T0059 in either order. GameScene edits are two isolated lines (T0040 also touches that file).
- No new system or pool, so no `hook.addInvariant()` needed. Resize restart (`scene.restart(data)`) re-runs `create()` and shutdown clears all delayedCalls/tweens, so no leaks.

### Tests
- none (no `core/` logic changes; `npm run check` and `npm run smoke` are the gates — smoke auto-picks the first card at 700 ms, after the deal, so its shortcut path is preserved)

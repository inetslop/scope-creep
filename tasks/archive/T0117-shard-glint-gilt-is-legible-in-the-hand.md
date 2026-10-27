---
id: T0117
title: Shard glint — gilt is legible in the hand
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T15:11:35Z
claimed_at: 2026-10-27T16:28:34Z
finished_at: 2026-10-27T16:50:52Z
---

## Goal
The moment a gilt shard (T0112) is picked up, the player hears and sees it was gilt — the 3× payoff lands in the hand, not just on the page.

## Details
- Sound: the existing shard-pickup pluck (the pickup SFX in `src/audio/Sfx.ts`, the one with the combo pitch-rise) plays one semitone (~×1.06 pitch) higher for a gilt shard than for a normal shard at the same pickup-combo position. Normal shards sound exactly as they do today. No new tone.
- Color: the moment a gilt shard is collected, a small yellow (PALETTE.yellow) "+N" pop prints at the pickup point, where N is the XP actually granted by that pickup (gilt 3×, existing multipliers on top). It rises and fades over ~0.6 s in the style of the kill feed (T0106) — same rise/fade timing, and the ink-text pool idiom in `src/systems/ScoreFeed.ts` is the closest example to copy; the pop is pooled and capped like that one.
- The gilt flag is already known at pickup: `Shard` carries the `gilt` field and both collect paths in `src/systems/PickupSystem.ts` already apply the gilt XP (T0112) — hook the sound and the pop there.
- Normal shards: unchanged sound, no pop. Gilt XP values are unchanged (3× normal, existing pickup multipliers on top).
- No HUD element, no input, no scene, no enemy, no number changes.

## Acceptance criteria
- [ ] Picking up a gilt shard plays the pickup pluck one semitone higher than a normal shard at the same combo position, and a small yellow "+N" pop (N = XP actually granted) rises and fades over ~0.6 s at the pickup point.
- [ ] Picking up a normal shard sounds exactly as before and prints no pop.
- [ ] Gilt shards are still worth exactly 3× a normal shard's XP with the existing multipliers on top; the existing gilt tests stay green.
- [ ] No new HUD element, key, scene or enemy is added; `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- create `src/systems/GiltPop.ts` - pooled yellow "+N" XP pop for gilt pickups (copy of the `ScoreFeed.ts` idiom)
- edit `src/audio/Sfx.ts` - `pickup(gilt = false)`: gilt pluck one more semitone
- edit `src/systems/PickupSystem.ts` - take a `GiltPop`; play gilt pluck and print pop in both collect paths
- edit `src/scenes/GameScene.ts` - construct `GiltPop`, pass to `PickupSystem`, register invariant
### Interfaces
```ts
// GiltPop.ts: exact shape of ScoreFeed with MAX_POPS = 16, LIFE_MS = 600, RISE = 24
export class GiltPop {
  constructor(scene: Phaser.Scene);
  get activeCount(): number;
  show(x: number, y: number, xp: number): void; // text `+${xp}`, one fixed style
}
// Sfx.ts
pickup(gilt = false): void;
// PickupSystem.ts (new last constructor param)
constructor(scene: Phaser.Scene, run: RunState, player: Player, fx: FxSystem, sfx: Sfx, giltPop: GiltPop);
```
### Steps
1. Create `src/systems/GiltPop.ts`: copy `src/systems/ScoreFeed.ts` and change — no `KillClass`/`style()`; the style is fixed and set once at construction: `textStyle(16, PALETTE.yellow, { stroke: cssColor(PALETTE.ink), strokeThickness: 3 })` (import `cssColor, PALETTE` from `../content/palette`); drop the `t.setStyle(...)` line from `show()`; `show(x, y, xp)` does `t.setText(`+${xp}`)`; class name `GiltPop`, doc: "Gilt shard pickup: a pooled yellow "+N" (the XP actually granted) rises above the pickup point and fades. Cosmetic only." Everything else (pool of texts, `cursor` round-robin, `if (t.active) this.scene.tweens.killTweensOf(t)`, tween to `y: y - RISE, alpha: 0, duration: LIFE_MS, ease: 'Cubic.Out'`, depth `DEPTH.fx + 1`, origin 0.5) stays byte-identical to ScoreFeed.
2. `src/audio/Sfx.ts`: `pickup(gilt = false)`; replace its last line with: `const hz = 523.25 * 2 ** ((this.comboStep + (gilt ? 1 : 0)) / 12);` then `this.tone('triangle', hz, hz, 0.12, 0.16);`. `gilt=false` must be bit-identical to today; gilt multiplies frequency by exactly 2^(1/12) (≈×1.06) at the same `comboStep`.
3. `src/systems/PickupSystem.ts`: add `import type { GiltPop } from './GiltPop';` after the `FxSystem` import; field `private readonly giltPop: GiltPop;` after `sfx`; last constructor param `giltPop: GiltPop` with `this.giltPop = giltPop;`. Then both collect paths — `update()` block becomes: `const xp = shardXp(s.value, s.gilt); this.collect(xp); this.fx.pickup(s.x, s.y); this.sfx.pickup(s.gilt); if (s.gilt) this.giltPop.show(s.x, s.y, Math.round(xp * this.run.stats.xpMul)); s.despawn(); continue;` — and the pool-full branch of `drop()` replaces `this.collect(shardXp(value, gilt));` with `const xp = shardXp(value, gilt); this.collect(xp); this.sfx.pickup(gilt); if (gilt) this.giltPop.show(x, y, Math.round(xp * this.run.stats.xpMul));` then `return;` (no `fx.pickup` there, as today).
4. `src/scenes/GameScene.ts`: `import { GiltPop } from '../systems/GiltPop';` after the `CropSystem` import; field `private giltPop!: GiltPop;` after `private feed`; `this.giltPop = new GiltPop(this);` after `this.feed = new ScoreFeed(this);` (line 102); change line 109 to `this.pickups = new PickupSystem(this, this.run, this.player, this.fx, this.sfx, this.giltPop);`; add `hook.addInvariant('gilt-pop-pool', () => (this.giltPop.activeCount <= 16 ? null : `${this.giltPop.activeCount} gilt pops active`));` after the `score-feed` invariant and add `'gilt-pop-pool'` to the `INVARIANTS` array.
### Pitfalls
- N must be `Math.round(xp * this.run.stats.xpMul)` — gilt 3× with the run's xpMul on top (that is what `run.addXp` actually grants); without the round a 1.15 xpMul would print "+1.15". Never touch `core/gilt.ts` or `addXp` — the gilt tests pin them and they stay green.
- Pop only for gilt; normal shards keep today's exact tone (`pickup(s.gilt)` with `false`) and print no pop.
- Recycle an active pooled text only after `killTweensOf(t)` (as ScoreFeed does); cap 16 is what the invariant checks.
- Pop is world-space text at the pickup point (like the kill feed), depth `DEPTH.fx + 1` — no HUD/input/scene, so 412x915 and 1280x720 work for free; XP values are finite, no NaN.
### Tests
none

## Result (attempt 1, yoga)

Gilt shards now announce themselves in the hand: `Sfx.pickup(gilt=false)` plays the existing pickup pluck exactly one semitone (×2^(1/12)) higher for gilt and bit-identically the same for normal shards, and a new `GiltPop` (pooled yellow "+N" text, 16-cap, 24 px rise / 0.6 s fade copied from the ScoreFeed idiom) prints at the pickup point with N = the XP actually granted (`Math.round(xp * xpMul)`) — both collect paths in `PickupSystem` feed it, gilt-only; `GameScene` constructs it and registers the `gilt-pop-pool` invariant (the design's "INVARIANTS array" doesn't exist in this codebase, so it lives in `registerInvariants()` with the rest). Normal shards keep today's exact sound and print no pop; gilt values and `core/gilt.ts`/`addXp` are untouched, all 256 unit tests, `npm run check` and `npm run smoke` (desktop + mobile) pass, and no HUD element, key, scene or enemy was added.

- Self-review: APPROVE
- Time: 22.3 min

```
game/src/audio/Sfx.ts            |  7 ++++---
 game/src/scenes/GameScene.ts     |  6 +++++-
 game/src/systems/GiltPop.ts      | 39 +++++++++++++++++++++++++++++++++++++++
 game/src/systems/PickupSystem.ts | 16 ++++++++++++----
 4 files changed, 60 insertions(+), 8 deletions(-)
```

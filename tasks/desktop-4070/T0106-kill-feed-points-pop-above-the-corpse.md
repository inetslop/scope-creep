---
id: T0106
title: Kill feed — points pop above the corpse
assignee: desktop-4070
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T11:41:58Z
---

## Goal
The score (T0054) now has a number to show: the moment any kill lands, a small ink "+1", "+5" or "+50" pops above the corpse, matching the points the HUD score just gained — so a first-time player sees, kill by kill, exactly why the number is climbing.

## Details
- Purely additive to T0054: at the same instant a kill is registered (the shared kill path that already calls `addScore()`), spawn a small ink text above the killed enemy's center, clear of its outline.
- Closest example: the floating damage numbers (T0004) — same pooled, rising, fading ink text. This feed shows the *score value* of the kill instead of the *hit value*; hits keep showing their own damage numbers, the feed only appears on kills.
- Values match `SCORE_POINTS` exactly — read the same constant from `config.ts`, never retype the numbers:
  - normal (non-elite) kill: "+1", small ink text in the damage-number style
  - elite kill: "+5", same style but visibly larger and bolder
  - boss kill: "+50", the largest of the three, plus a small expanding ink ring at the corpse — reuse the existing crit-ring look from T0019
- Motion: rise ~24 world units over ~0.6 s and fade to gone, same rhythm as the damage numbers. No new SFX, no new art, no new HUD element; the HUD `SCORE` readout and the game-over lines are untouched.
- Pool the texts with a cap of about 32; when a swarm kill exhausts the pool, recycle the oldest text — never an error, never a dropped frame.
- No score values, XP, shard drops or kill-streak behavior change. Elite and boss kills keep working exactly as they do today.

## Acceptance criteria
- [ ] Killing a normal enemy shows a small ink "+1" rising above the corpse and fading in ~0.6 s
- [ ] Killing an elite shows a "+5" that is visibly larger than a "+1"
- [ ] Killing The Frame or The Grid shows a "+50" with a small ink ring — once per boss death, at the boss's position
- [ ] The HUD score still gains exactly 1 / 5 / 50 per kill class; the feed changes no score values, XP, shards or streaks
- [ ] A burst of 10+ kills in one second stays smooth — pooled texts recycle, nothing in the console
- [ ] No feed text appears at run start or while nothing is killed
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/systems/ScoreFeed.ts` - pooled kill-feed text ("+1"/"+5"/"+50") rising above corpses; mirrors `DamageNumbers.ts`
- edit `src/systems/CombatSystem.ts` - add `feed` dependency; call `showKill` in `killEnemy()`
- edit `src/systems/BossSystem.ts` - add `feed` dependency; call `showKill` + `critRing` in `killBoss()`
- edit `src/scenes/GameScene.ts` - construct `ScoreFeed`, pass it to the two systems, register a pool invariant

### Interfaces
```ts
// src/systems/ScoreFeed.ts
export type KillClass = 'enemy' | 'elite' | 'boss';
export class ScoreFeed {
  constructor(scene: Phaser.Scene);                 // pre-creates a fixed ring of 32 inactive Texts at depth DEPTH.fx + 1
  get activeCount(): number;                        // how many pooled texts are active (for the invariant)
  showKill(x: number, y: number, cls: KillClass): void;
}
// CombatSystem / BossSystem constructors: insert `feed: ScoreFeed` immediately after the `damageNumbers: DamageNumbers` parameter
// (CombatSystem: ..., sfx, damageNumbers, feed, spawns.  BossSystem: ..., music, damageNumbers, feed, pickups.)
```
Full body of `ScoreFeed` (copy verbatim): imports `SCORE_POINTS, DEPTH` from `'../config'`, `cssColor, PALETTE` from `'../content/palette'`, `textStyle` from `'../ui/text'`; consts `MAX_FEED = 32`, `LIFE_MS = 600`, `RISE = 24`; field `private cursor = 0`. `showKill` does, in order: `const t = this.pool[this.cursor];` then `this.cursor = (this.cursor + 1) % MAX_FEED;`; `if (t.active) this.scene.tweens.killTweensOf(t);`; `t.setText(`+${SCORE_POINTS[cls]}`);`; `t.setStyle(this.style(cls));`; `t.setPosition(x, y);`; `t.setAlpha(1).setActive(true).setVisible(true);`; `this.scene.tweens.add({ targets: t, y: y - RISE, alpha: 0, duration: LIFE_MS, ease: 'Cubic.Out', onComplete: () => { t.setActive(false).setVisible(false); } });`. `style(cls)`: base `{ stroke: cssColor(PALETTE.paperLight), strokeThickness: 3 }`; boss -> `textStyle(30, PALETTE.ink, { fontStyle: 'bold', ...base })`; elite -> `textStyle(22, PALETTE.ink, { fontStyle: 'bold', ...base })`; enemy -> `textStyle(16, PALETTE.ink, base)`. Constructor loop: `this.pool.push(scene.add.text(0, 0, '', textStyle(16, PALETTE.ink)).setOrigin(0.5).setDepth(DEPTH.fx + 1).setActive(false).setVisible(false));`

### Steps
1. Create `src/systems/ScoreFeed.ts` exactly as above.
2. `CombatSystem.ts`: `import type { ScoreFeed } from './ScoreFeed';`; add `private readonly feed: ScoreFeed;` + constructor param/assignment after `damageNumbers`. In `killEnemy()`, directly after `this.run.addScore(...)` (line 115): `this.feed.showKill(e.x, e.y - size - 10, e.elite ? 'elite' : 'enemy');` (`size` is already the radius incl. elite scale).
3. `BossSystem.ts`: same import/field/param. In `killBoss()`, directly after `this.run.addScore(SCORE_POINTS.boss)` (line 320): `this.feed.showKill(x, y - def.bodyRadius - 12, 'boss');` then `this.fx.critRing(x, y);` (`x`, `y`, `def` are already in scope; bodyRadius is 80 for Frame, 46 for Grid).
4. `GameScene.ts`: import `ScoreFeed`; add `private feed!: ScoreFeed;`; in `create()` add `this.feed = new ScoreFeed(this);` after line 94; update the `CombatSystem` and `BossSystem` construction lines (104–105) to pass `this.feed` in the new position; add invariant `hook.addInvariant('score-feed', () => (this.feed.activeCount <= 32 ? null : `${this.feed.activeCount} score feed texts active`));` and add `'score-feed'` to the `INVARIANTS` array.
5. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Recycle order: round-robin over the fixed ring recycles the *oldest* text only because every text has the same `LIFE_MS` — do not give any class its own duration.
- Always `killTweensOf(t)` before reusing an active slot, or two tweens fight over `y`/`alpha` and the text never deactivates.
- Never type the numbers 1/5/50; the `+${SCORE_POINTS[cls]}` template reads the constant. Feed is spawned only from the two kill paths — nothing at run start.
- Insert `feed` at the stated constructor positions and update both call sites in the same edit; do not reorder existing parameters.
- Other open tasks (T0070, T0090, T0094, T0100, T0102, T0105) also touch `GameScene.ts`, `BossSystem.ts`, `CombatSystem.ts` — keep edits to exactly the lines above, no reformatting.
- Texts are world-space (zoom-scaled, like damage numbers): nothing to do for 412x915; no HUD/input changes. Texts are destroyed with the scene on shutdown, same as `DamageNumbers` — no tween cleanup needed.

### Tests
- none

---
id: T0057
title: "Hauler: the enemy whose leak costs gold"
size: M
priority: 2
status: todo
depends_on: [T0046]
attempts: 0
created: 2026-10-28T13:04:03Z
---

## Goal
A big slow walker with a small fortune inside: killing it pays a few slots' worth in one pop, and letting it through costs gold as well as a life — the first enemy worth more dead than alive, and the first whose leak costs gold.

## Details
- **Closest existing enemy:** Block (a plain slow walker). **What is new:** the economy — no enemy today costs anything but a life when it leaks, and none pays more than a few gold when killed; the Hauler makes a wave's gold a two-way risk.
- **Look:** a fat round token — a round shape no current enemy has — about 1.3× Block's size (the Mute's size class, a different silhouette), with the usual darker side face and soft shadow. Color: deep purple (check the content folder; if purple is taken by a landed enemy — the Dasher, T0046 — take the next free warm color, preferring a darker shade of it so the Hauler reads as its own token next to the Sprinter's orange; the Hauler stays warm: red, orange or purple).
- **Stats:** Block's speed, 3× Block's hp. Kills pay 10 gold (a few slots' worth for one kill) in the normal gold pop. It takes everything that works today — shots, beams, roots, pushes, marks, burns — including Mark's bonus damage.
- **Leak:** a leaking Hauler costs 1 life and 5 gold (gold never goes below 0), and the cost is seen where it happens: a small red "−5" pops at the exit with the usual leak jolt, next to the life-loss feedback.
- **Waves:** the Hauler enters the mix from wave 9 — one Hauler on waves 9, 13, 17, 21, … (one every 4 waves), added to the wave's existing spawns and walking in with the wave's normal groups; no wave is made of only Haulers. When the wave preview (T0015) shows the next wave's enemies, the Hauler appears in it by shape and count, like any other enemy.
- Otherwise plain: it does not dash, split, heal, jam or speed up — it just walks, is tough, and is worth more dead than alive.

## Acceptance criteria
- [ ] A new "Hauler" enemy exists (a big round token, distinct from the other six enemy shapes) and walks the road at Block's speed.
- [ ] From wave 9, waves 9, 13, 17, … each include exactly one Hauler in addition to the wave's usual enemies.
- [ ] The Hauler has 3× Block's hp, and killing it pays 10 gold in the gold pop.
- [ ] A leaking Hauler costs 1 life and 5 gold (gold floors at 0), with a red "−5" pop at the exit alongside the usual leak feedback.
- [ ] The existing enemies, the wave preview's layout, sounds and the HUD are otherwise unchanged; works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/content/enemies/hauler.ts` - Hauler enemy data (full file below)
- edit `src/content/types.ts` - add `'ellipse'` to `Shape` (next to `'circle'`); add `leakGold?` to `EnemyDef`
- edit `src/content/enemies/index.ts` - import line + one `ENEMIES` entry
- edit `src/art/paint.ts` - `ellipse` case in `shapePath()`
- edit `src/art/shapes.ts` - `ellipse: 0` in the `sides` record
- edit `src/core/waves.ts` - `leakGoldCount()` + one reserved-spawn block + walkers filter
- edit `src/core/run.ts` - `leak()` also takes gold (floored at 0)
- edit `src/systems/EnemySystem.ts` - `leak()`: pass leakGold, small red "−5" pop
- edit `src/systems/FxSystem.ts` - `popText()` gains a size param (default keeps all callers identical)
- edit `src/debug/runChecks.ts` - one invariant line
- edit `tests/core/waves.test.ts`, `tests/core/run.test.ts` - new tests (below)

Color/shape decision (verify before coding): purple is taken (Block AND Dasher), red and orange are taken too — so take **red** (the darker of the remaining warm colors, reads beside Sprinter's orange) with a **new `ellipse` shape** (fat round token, wider than tall; distinct from the red *circles* Dot/Splitter/Splinter). Texture, draft/preview, health bars, targeting and all damage kinds flow from the data — no other code.

### Interfaces
```ts
// src/content/types.ts
export type Shape = 'circle' | 'ellipse' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'hexagon' | 'pillar' | 'chevron';
// EnemyDef, right after `livesCost`:
  /** Gold also lost when it reaches the exit (floored at 0 in core/run.ts); reserved in waves, never in the random mix. */
  leakGold?: number;
```
```ts
// src/content/enemies/hauler.ts (whole new file)
import type { EnemyDef } from '../types';

export const hauler: EnemyDef = {
  id: 'hauler',
  name: 'Hauler',
  description: 'A big slow walker carrying a fortune: pays 10 gold when killed, a leak costs 5 gold and a life.',
  behavior: 'walk',
  hp: 360, // 3x Block's 120
  speed: 0.9, // Block's speed
  gold: 10,
  livesCost: 1,
  leakGold: 5,
  threat: 4, // Block's threat
  fromWave: 9,
  look: { shape: 'ellipse', color: 'red', size: 0.338 }, // 1.3x Block's 0.26
};
```
```ts
// src/core/waves.ts — after dashCount():
export function leakGoldCount(wave: number): number {
  return wave >= 9 && (wave - 9) % 4 === 0 ? 1 : 0;
}
```
```ts
// src/core/run.ts — replace leak():
  /** An enemy got through: its lives, and if it carries gold, that too (never below 0). Returns true when that ended the run. */
  leak(livesCost: number, leakGold: number = 0): boolean {
    if (this.phase === 'over') return true;
    this.lives = Math.max(0, this.lives - livesCost);
    this.gold = Math.max(0, this.gold - leakGold);
    this.leaksThisWave += 1;
    if (this.lives === 0) this.phase = 'over';
    return this.phase === 'over';
  }
```
```ts
// src/systems/FxSystem.ts — replace popText():
  popText(x: number, y: number, text: string, color: number = PALETTE.goldText, size: number = 22): void {
    if (this.live >= FxSystem.MAX) return;
    const t = this.scene.add
      .text(x, y, text, textStyle(size, color, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: size >= 20 ? 6 : 4 }))
      .setOrigin(0.5)
      .setDepth(DEPTH.fx);
    this.track(t, 750, { y: y - 34, alpha: 0, ease: 'Quad.easeOut' });
  }
```
```ts
// src/systems/EnemySystem.ts — replace leak():
  private leak(e: Enemy): void {
    this.run.leak(e.def.livesCost, e.def.leakGold ?? 0);
    hook.stats.enemiesLeaked += 1;
    this.fx.ring(e.x, e.y, 30, PALETTE.red);
    this.fx.popText(e.x, e.y - 20, `-${e.def.livesCost}`, PALETTE.red);
    if (e.def.leakGold) this.fx.popText(e.x, e.y + 10, `-${e.def.leakGold}`, PALETTE.red, 14);
    this.sfx?.leak();
    this.scene.cameras.main.shake(140, 0.005);
    e.despawn();
  }
```

### Steps
1. `src/content/types.ts`: the `Shape` line and the `leakGold` field (exact above).
2. Create `src/content/enemies/hauler.ts` exactly as above.
3. `src/content/enemies/index.ts`: `import { hauler } from './hauler';` between the `dot` and `splinter` imports; in `ENEMIES` add `hauler,` between `splitter,` and `splinter,` (wave-9 neighbors).
4. `src/art/paint.ts`, in `shapePath()` right after the `circle` case:
   `if (shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(x, y, radius * 1.25, radius * 0.8, 0, 0, Math.PI * 2); return; }`
5. `src/art/shapes.ts`: in the `sides` record add `ellipse: 0,` right after `circle: 0,` (it's `Record<Shape, number>` — the build fails without it).
6. `src/core/waves.ts`: add `leakGoldCount()` after `dashCount()`; in `planWave()` append `&& e.leakGold === undefined` to the `walkers` filter line; after the dashing-reserved block add, one line per existing style: `const leakSpawns: string[] = [];` then `for (const e of unlocked) if (e.leakGold !== undefined) { const n = Math.min(leakGoldCount(wave), Math.floor(budget / e.threat)); for (let i = 0; i < n; i++) leakSpawns.push(e.id); budget -= n * e.threat; }` and change `const reserved = [...rampSpawns, ...dashSpawns];` to `[...rampSpawns, ...dashSpawns, ...leakSpawns]`.
7. `src/core/run.ts`: replace `leak()` (exact above).
8. `src/systems/FxSystem.ts`: replace `popText()` (exact above).
9. `src/systems/EnemySystem.ts`: replace `leak()` (exact above).
10. `src/debug/runChecks.ts`: after the `['enemies.push', …]` line add `['enemies.leakGold', (g) => (g.enemies.all.filter((e) => e.active && e.def.leakGold !== undefined).length > 1 ? 'two leak-gold enemies at once' : null)],`.
11. Tests (exact below). Run `npm run check` and `npm run smoke`.

### Pitfalls
- The `walkers` filter MUST exclude `leakGold` enemies, or the random mix can spawn groups of 2–4 Haulers ("exactly one" breaks).
- The Hauler's threat MUST be deducted from the budget (`budget -= n * e.threat`): `waves.test.ts` sums every non-splitter spawn's threat against `waveBudget`.
- `ctx.ellipse` needs `ctx.beginPath()` first — `paintToken` only ever does `shapePath()` + `fill()`.
- No `Enemy` class fields, no pooling/reset changes, no Sfx, no HUD changes: the wave preview shows the Hauler from `nextPlan` with no edit, and existing enemies' leak feedback stays byte-identical (the "−5" pop is guarded by `if (e.def.leakGold)`).
- The run may end on that same leak (lives → 0): the gold floor `Math.max(0, …)` makes the order safe; don't skip the gold when over.
- Texture room is fine as-is (`tokenRoom(r, depth)*2` leaves ≥ depth+shadow+2 px beyond the 1.25r ellipse half-width); don't resize or recenter the paint.

### Tests
- `tests/core/waves.test.ts`: add `leakGoldCount` to the import; two `it`s after the dashing ones:
```ts
  it('leakGoldCount: none before 9, one on 9, 13, 17, …', () => {
    expect([8, 9, 12, 13, 16, 17, 20, 21, 25].map((w) => leakGoldCount(w))).toEqual([0, 1, 0, 1, 0, 1, 0, 1, 0]);
  });

  it('mixes in the leak-gold enemy exactly as leakGoldCount says, never alone', () => {
    for (let wave = 1; wave <= 24; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns.filter((s) => s.enemy === 'hauler').length).toBe(leakGoldCount(wave));
      expect(plan.spawns.some((s) => s.enemy !== 'hauler')).toBe(true);
    }
  });
```
- `tests/core/run.test.ts`: after the 'ends the run when the lives run out' test:
```ts
  it('a leak-gold leak costs gold, floored at zero', () => {
    const run = new RunState(1);
    run.startWave();
    run.gold = 12;
    expect(run.leak(1, 5)).toBe(false);
    expect(run.gold).toBe(7);
    run.gold = 3;
    expect(run.leak(1, 5)).toBe(false);
    expect(run.gold).toBe(0);
  });
```
`tests/content.test.ts` validates the new enemy automatically; smoke covers 412x915 + 1280x720.

## Note (by hand, 2026-10-28)

No longer waits on T0053, T0071: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

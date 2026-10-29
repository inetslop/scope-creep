---
id: T0074
title: "Mute: the enemy that silences your towers"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T21:24:45Z
design_attempts: 1
---

## Goal
A new enemy with a behavior no enemy has: it fights back. While a Mute is alive, every tower within 2 cells of it holds still and never attacks.

## Details
- **Closest existing enemy:** Block (a plain slow walker). **New:** it disables towers — the first enemy that fights back, and the one that makes cluster placement a real decision against Rally and Mint.
- **Look:** a hollow round shape — a chunky ring with a flat hole in the middle, the only enemy with a hole in it — in a deeper purple than the Dasher's if the content folder has one, otherwise the Dasher's purple; about Block's size; the usual darker side face and soft shadow. (The hexagon is the Hauler's now (T0057) and every warm color is used by a landed enemy, so the hole — a new silhouette — carries the meaning; the family color repeats.)
- **Move:** walks at Block's speed, plain — no dash, no ramp, no telegraph. The hole is the tell.
- **The silence (the new behavior):** while a Mute is alive, every tower whose center is inside the Mute's 2-cell circle (the same reach Rally's range ring shows) is jammed: the tower performs no actions — no shot, no gust, no root pulse, no own burn tick, no beam (a beam drops and re-locks later). Two passive rules keep working while jammed: a jammed Rally tower still speeds its neighbours, and a kill within 2 cells of a jammed Mint tower still pays its +1. A Push tower's windup ring (T0058) freezes where it is while jammed and resumes from where it stopped when the Mute dies — the charge waits, it does not reset.
- **The jam is readable:** a jammed tower dims to 50% and shows one small muted-gray dot above its barrel (the tier pips are unchanged); the dim and the dot clear the instant the Mute dies. No card, no sound — the dimming happens as the Mute walks in, so a first-time player sees cause and effect on the board.
- **Waves:** from wave 11, one Mute on waves 11, 14, 17, 20, … — exactly one per such wave, reserved in the wave plan the way the Hauler is (T0057), outside the budget picks. (When E5's wave-20 boss lands, the boss takes that slot.)
- **Economy:** a leak costs 1 life like any enemy; a kill pays the normal kill gold for its hp — no special economy, the point is its silence.
- **Landing pattern:** its own content file and its own enemy hook, registered next to its kin, the way the Hauler landed (T0057); its icon, wave preview, sounds and HUD are picked up automatically.

## Acceptance criteria
- [ ] From wave 11, waves 11, 14, 17, 20, … each carry exactly one Mute, shown in the wave preview as the hollow-ring token; the other enemies' mix and the wave's budget are unchanged.
- [ ] While a Mute is alive, every tower inside its 2-cell circle holds still — no shot, gust, root, beam or own burn tick — the tower is dimmed to 50% with one small muted-gray dot above its barrel; the dim and dot clear the instant the Mute dies.
- [ ] A jammed Rally tower still speeds its neighbours, and a kill within 2 cells of a jammed Mint tower still pays +1; a Push tower's windup ring freezes while jammed and resumes from where it stopped.
- [ ] The Mute walks at Block's speed, costs 1 life on a leak, and its kill pays the normal kill gold.
- [ ] The art is a chunky hollow ring in deep purple with the usual darker side face and soft shadow; it lands in its own content and hook files (the Hauler's pattern).
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, inet-racing)

### Files
- create `src/content/enemies/mute.ts` - the Mute's EnemyDef (walker data only)
- edit `src/content/enemies/index.ts` - `import { mute } from './mute';` (after the hauler import) and `mute,` after `hauler,` in `ENEMIES`
- edit `src/content/types.ts` - add `| 'ring'` to the `Shape` union (line 4)
- edit `src/art/shapes.ts` - add `ring: 0` to the `sides` record (line 15) or it won't compile
- edit `src/art/paint.ts` - a `ring` branch in `shapePath()` (see Interfaces)
- create `src/systems/enemyHooks/muteJam.ts` - the per-frame hook that sets `tower.jammed`
- edit `src/systems/enemyHooks/index.ts` - add `muteJam,` after `burnLeap,` in `ENEMY_HOOKS`
- edit `src/core/waves.ts` - reserve one Mute on 11, 14, 17, … and keep it through quiet halving
- edit `src/entities/Tower.ts` - `jammed` flag, the gray dot, `setJammed()`
- edit `src/systems/TowerSystem.ts` - skip jammed towers in `update()`
- edit `src/debug/runChecks.ts` - one invariant line
- edit `tests/core/waves.test.ts` - Mute test + exclude `'mute'` in two existing assertions

### Interfaces
`src/content/enemies/mute.ts` (model on `block.ts`):
```ts
export const mute: EnemyDef = {
  id: 'mute',
  name: 'Mute',
  description: 'Holds the road in silence: while it lives, every tower within two cells of it holds still.',
  behavior: 'walk',
  hp: 120, // Block's
  speed: 0.9, // Block's speed
  gold: 10,
  livesCost: 1,
  threat: 1, // placeholder: the Mute never gets drawn from the budget
  fromWave: 11,
  look: { shape: 'ring', color: 'purple', size: 0.26 }, // Block's size; the hole is the new silhouette
};
```
In `src/art/paint.ts` `shapePath()`, after the `'pillar'` branch:
```ts
  // A ring: a circle with a flat hole through the middle (the Mute). The inner circle is traced
  // the other way, so the usual fill keeps the hole open.
  if (shape === 'ring') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2, true);
    return;
  }
```
`src/entities/Tower.ts`: add field `jammed = false;` (next to `rallyRateMul`, doc: `Held by a Mute: no attacks; systems/enemyHooks/muteJam.ts`), `private readonly jamDot: Phaser.GameObjects.Graphics;`, and in the constructor after `this.pips = ...`:
```ts
    this.jamDot = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);
    this.jamDot.fillStyle(PALETTE.muted, 1);
    this.jamDot.fillCircle(0, -32, 3); // above the body, same float as the rally chevron
    this.jamDot.setVisible(false);
```
plus:
```ts
  /** A Mute holds this tower still: dimmed, one gray dot over the barrels. The pips are untouched. */
  setJammed(on: boolean): void {
    if (this.jammed === on) return;
    this.jammed = on;
    this.setAlpha(on ? 0.5 : 1);
    this.gun.setAlpha(on ? 0.5 : 1);
    this.base.setAlpha(on ? 0.5 : 1);
    this.jamDot.setVisible(on);
  }
```
and `this.jamDot.destroy();` in `destroy()` next to the other parts.

`src/systems/enemyHooks/muteJam.ts`:
```ts
import { CELL } from '../../config';
import type { MakeEnemyHook } from './hook';

/** Cells of road a Mute silences: the same reach Rally's range ring shows. */
const MUTE_REACH = 2;

/**
 * The Mute's silence: while a Mute is alive, every tower whose center is inside its two-cell
 * circle holds still. Sets `jammed` on each tower (entities/Tower.ts); TowerSystem skips jammed
 * towers, so no shot, gust, root, burn or tick leaves them, and the Push windup (its ring reads
 * the tower's own cooldown) freezes and resumes with it.
 */
export const muteJam: MakeEnemyHook = ({ enemies, towers }) => ({
  update() {
    const mutes = enemies.all.filter((e) => e.active && e.def.id === 'mute');
    const r2 = MUTE_REACH * MUTE_REACH * CELL * CELL;
    for (const t of towers()) t.setJammed(mutes.some((m) => (m.x - t.x) ** 2 + (m.y - t.y) ** 2 <= r2));
  },
});
```
`TowerSystem.update()` loop, first line of the body: `if (t.jammed) continue;` (before `if (!t.spec.attacks) continue;`).
`runChecks.ts`, after the `rally.valid` entry:
```ts
  ['mute.jam', (g) => {
    const muted = g.enemies.all.some((e) => e.active && e.def.id === 'mute');
    if (!muted && g.towers.towers.some((t) => t.jammed)) return 'a tower is jammed with no Mute on the road';
    return null;
  }],
```

### Steps
1. `mute.ts` + register in `ENEMIES` (texture, wave preview icon, menu demo all pick it up automatically).
2. Add `'ring'` to `Shape`, `ring: 0` in `shapes.ts`, the `shapePath` branch.
3. `Tower.ts`: flag, dot, `setJammed()`, destroy line.
4. `TowerSystem.update()`: the one-line jam skip.
5. `muteJam.ts` + register in `ENEMY_HOOKS` (EnemySystem already drives hook `update` every wave frame, before `towers.update` — no wiring in GameScene/EnemySystem/RunFlow).
6. `waves.ts`: (a) in the `walkers` filter (line 96) add `&& e.id !== 'mute'`; (b) after the Hauler line (130) add `// The Mute: one on 11, 14, 17, ... (it never comes from the budget; its threat is a placeholder).` and `if (wave >= 11 && (wave - 11) % 3 === 0) reserved.push('mute');`; (c) after the `quietHalve` line (147) add `// A Mute wave always sends its Mute, even when the halving would drop it: it walks in first.` and `if (wave >= 11 && (wave - 11) % 3 === 0 && !finalSpawns.some((s) => s.enemy === 'mute')) finalSpawns = [{ enemy: 'mute', delaySec: 0 }, ...finalSpawns];`
7. `runChecks.ts` invariant line.
8. Update and extend `tests/core/waves.test.ts` (see Tests).
9. `npm run check`, then `npm run smoke`.

### Pitfalls
- `quietHalve` (every 4th wave: 20, 32, …) would drop a lone reserved Mute — the step-6c re-add is required by the acceptance criteria, and it means two existing wave-test assertions must exclude `'mute'` (see Tests) or they fail on wave 20.
- If `'mute'` is not excluded from `walkers`, it gets drawn from the budget and the "budget unchanged" criterion breaks.
- `sides` is `Record<Shape, number>`: omitting `ring: 0` is a compile error — add it in the same step as the union.
- The ring hole works by reverse winding (the `true` in the inner `arc`); do not switch to `fill('evenodd')` or touch `paintToken` — the same path fills both the deep side face and the top face and both keep the hole.
- Keep the `if (this.jammed === on) return;` guard so `setJammed` called every frame for every tower is cheap; never dim `this.pips` (tier pips stay).
- Rally's buff (RallySystem) and Mint's +1 (kill-time, position-based) run outside `TowerSystem.update`, so they keep working while jammed with zero changes — do not "help" them.
- No beam attack exists yet (T0073): nothing to wire; the jam skip in `TowerSystem.update` covers any tower-driven attack that lands later, and `Tower.jammed` is public for that.
- Push windup needs no change: it reads `t.cooldown` each frame, and the jam skip freezes the cooldown (charge waits, never resets).

### Tests
In `tests/core/waves.test.ts`: (1) line 17 of the budget test becomes `if (s.enemy !== 'splitter' && s.enemy !== 'hauler' && s.enemy !== 'mute') spent += def.threat;`; (2) in the quiet-wave count test, `expect(a.spawns.filter((s) => s.enemy !== 'mute').length).toBeLessThanOrEqual(Math.ceil(waveBudget(wave) / 2));`; (3) after the Hauler test add:
```ts
  it('sends exactly one Mute on 11, 14, 17, ... — a quiet wave keeps it', () => {
    for (let wave = 1; wave <= 30; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const expected = wave >= 11 && (wave - 11) % 3 === 0 ? 1 : 0;
      expect(plan.spawns.filter((s) => s.enemy === 'mute').length).toBe(expected);
      if (expected === 1) expect(plan.spawns.some((s) => s.enemy !== 'mute')).toBe(true); // never a Mute-only wave
    }
  });
```

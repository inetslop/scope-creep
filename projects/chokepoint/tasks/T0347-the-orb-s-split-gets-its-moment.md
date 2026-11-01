---
id: T0347
title: "The Orb's split gets its moment"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T08:02:39Z
claimed_at: 2026-11-01T10:16:08Z
---

## Goal
The wave-30 boss's signature move — splitting into two Shards at half health — is readable before it lands: the Orb's crack counts down with the damage it takes, and the split is telegraphed with a white flash, the way the Dasher's dash and the Colossus's phase already are.

## Details
- The Orb's token (the cracked purple hexagon, T0266) carries a static baked-in crack. It becomes live: one muted-ink line on the token's face, 25% alpha at full hp, deepening with the damage it takes — alpha = 0.25 + 0.75 × (hp lost / max hp), re-derived per frame. Closest example: the Splitter's live crack (the `crackDeep` enemy hook, T0344) — same look, same math.
- The moment a hit first drops the Orb to its half-hp split line: a 0.4 s telegraph. The Orb flashes white for the whole window (the Dasher's dash-telegraph tint, T0046) while it keeps walking at its own speed — no pause, no untargetable beat — and its crack reads fully opaque. The window runs on the simulation clock, so it lasts half as long in real time at 2x.
- When the window ends, the Orb vanishes into its two Shards exactly as it does today — no kill: no gold, no combo, no Toll, no "stopped", the BossCard's hp bar and the boss-death moment unchanged — plus one new burst: 12 chips in the Orb's own purple at the split spot (the milestone count, T0034). No sound.
- While the Orb is below half hp (from the first crossing until the split) it cannot be killed: hits deal damage, but the split fires at the end of the telegraph even if its hp reaches 0 inside the window. The Orb was never a kill before either.
- The Shards (count, spawn spot, speed, hp, gold), the wave-10 Colossus, the wave-20 Titan and the Splitter's live crack are untouched.
- Nothing shown twice: the BossCard's bar stays the precise hp readout; the crack is the token's own look (the owner's own rule when the status chips were removed, T0179).
- The display rides a new enemy hook in the `crackDeep` pattern (a new file in `src/systems/enemyHooks/`, registered in `enemyHooks/index.ts`; closest examples T0344's crack and T0293's shield-break burst). The 0.4 s clock rides the existing `splitsAt` handling (the `split` hook's path, T0059) — no new system, and no changes to the enemy pool's walking or spawning.

## Compared with what exists
| Existing | What it shares | What this does that it can't (not numbers) |
| --- | --- | --- |
| Splitter (live crack, T0344) | a crack that deepens with the damage it takes | its crack reads its own death and pays out on the kill; the Orb's crack reads a half-hp phase line and ends in a flash-telegraphed break into two, with no kill |
| Dasher | a white flash that warns of a sudden move | its flash warns of its own dash while it stops; the Orb's flash warns of a shape change (one becomes two) while the Orb keeps walking and taking hits |
| Colossus | a telegraphed half-hp phase (outOfReach's 0.5 s telegraph) | its phase makes it untargetable (a beat to survive); the Orb's phase keeps it hittable and moving and ends in a guaranteed split (a beat to pre-aim the Shards) |
| Titan's shield break (T0293) | a chip burst at the moment a state flips | that flip is instant; the Orb's split is a 0.4 s beat the player can read before the two Shards are on the road |

## Acceptance criteria
- [ ] The Orb's crack reads faint (25% alpha) at full hp and deepens continuously as it takes damage, fully opaque at the half-hp line; the static baked-in crack is replaced, not doubled.
- [ ] The first hit that drops the Orb to half hp starts a 0.4 s white flash (the Dasher's telegraph tint); the Orb keeps walking at its own speed through the window.
- [ ] At the end of the window the Orb vanishes into its two Shards with one 12-chip purple burst at the split spot and no sound; no gold, no combo, no Toll, no "stopped" — the Shards spawn, walk and pay exactly as today.
- [ ] A hit that would bring the Orb to 0 hp during the window does not kill it; the split still fires at the end of the telegraph.
- [ ] The window runs on the simulation clock: at 2x fast-forward it lasts half as long in real time.
- [ ] The Colossus (wave 10), the Titan (wave 20), the Splitter's live crack and every regular enemy behave byte-identically to before.
- [ ] The BossCard still shows the Orb's live hp while it is alive; the crack and the bar do not compete (the bar is the precise readout, the crack is the token's own look).

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/orbSplit.ts` - display hook: the Orb's live crack line, the 0.4 s white flash tint, the 12-chip purple burst.
- edit `src/systems/enemyHooks/midSplit.ts` - the 0.4 s window: open/advance `splitClock`, capture triggering hp, split at window end (new `SPLIT_TELEGRAPH_SEC`).
- edit `src/entities/Enemy.ts` - field `splitClock`, spawn reset, `hit()` unkillable inside the window.
- edit `src/systems/enemyHooks/bossDeath.ts` - Orb's split horn at the split's moment, not per window frame.
- edit `src/art/entities.ts` - delete the Orb's baked-in crack block (the live line replaces it).
- edit `src/systems/enemyHooks/index.ts` - import + one line for `orbSplit`, after `midSplit`.
- edit `src/debug/runChecks.ts` - import + `enemies.orbSplit` invariant line, after `enemies.orb`.

### Interfaces
```ts
// Enemy.ts, field after `reachClock`; `this.splitClock = -1;` in spawn() after `this.reachClock = -1;`
/** Seconds since its split window opened (the Orb); -1 before its hp first dropped to the split line. */
splitClock = -1;
// Enemy.hit() last line `return this.hp <= 0;` becomes:
return this.splitClock < 0 && this.hp <= 0; // window open: hits deal, never kill, even down to 0
// midSplit.ts new export: `export const SPLIT_TELEGRAPH_SEC = 0.4;` — midSplit: MakeEnemyHook (same type), update(dt)
// orbSplit.ts: `export const orbSplit: MakeEnemyHook;`
```
### Steps
1. Enemy.ts: add field after `reachClock = -1;` (line 70); reset `this.splitClock = -1;` in `spawn()` after `this.reachClock = -1;` (line 123); in `hit()` replace `return this.hp <= 0;` with the line above (+ doc: "never inside its split window").
2. midSplit.ts: keep imports (add `import type { Enemy } from '../../entities/Enemy';`); add `export const SPLIT_TELEGRAPH_SEC = 0.4;`; body becomes: `const hpAt = new Map<Enemy, number>();` then `update(dt)` over `enemies.all`: `if (!e.active || e.def.splitsAt === undefined) continue;` `if (e.splitClock < 0) { if (!atSplitLine(e.def, e.hp, e.maxHp)) continue; e.splitClock = 0; hpAt.set(e, e.hp); }` `e.splitClock += dt;` `if (e.splitClock < SPLIT_TELEGRAPH_SEC) continue;` then unchanged split: `const child = getEnemy(e.def.splitsAt!.into); const half = splitChildHp(hpAt.get(e) ?? e.hp);` capture `x,y,d,size,sm` before spawn, `e.despawn(); hpAt.delete(e);` the two `enemies.spawn(child, half / child.hp, sm, dd)`, `clearRing(fx, x, y, size);`. Add `onKill({ enemy }) { hpAt.delete(enemy); }, onLeak(enemy) { hpAt.delete(enemy); },`.
3. orbSplit.ts (new, model crackDeep.ts): `({ fx, enemies }) => { const seen = new Map<Enemy, { line: Phaser.GameObjects.Graphics; x: number; y: number; color: number; serial: number }>(); }`. `update()`: first `for (const [e, s] of [...seen]) if (!e.active || e.serial !== s.serial) drop(e, true);` (a tracked Orb gone without kill/leak = the split consumed it; `serial` tells the slot recycled to its live Shards). Then over `enemies.all`: `if (!e.active || e.def.splitsAt === undefined) { drop(e, false); continue; }`; get-or-create state (`makeState`); `s.x = e.x; s.y = e.y;` `s.line.setPosition(e.x, e.y - Math.max(2, e.def.look.size * CELL * 0.18) / 2);` `s.line.setAlpha(0.25 + 0.75 * Math.min(1, (e.maxHp - e.hp) / (e.maxHp * e.def.splitsAt!.hpFrac)));` `if (e.splitClock >= 0) e.setTintFill(0xffffff);`. `onKill({ enemy }) { drop(enemy, false); }, onLeak(enemy) { drop(enemy, false); },`. `drop(e, burst)`: delete from `seen`, `s.line.destroy()`, `if (burst) fx.burst(s.x, s.y, s.color, 12);`. `makeState`: `const r = e.def.look.size * CELL;` `const g = fx.scene.add.graphics().setDepth(DEPTH.fx);` `g.lineStyle(Math.max(1, r * 0.1), PALETTE.muted, 1);` `g.beginPath(); g.moveTo(0, -r * 0.55); g.lineTo(-r * 0.08, -r * 0.06); g.lineTo(r * 0.06, r * 0.12); g.lineTo(0, r * 0.5); g.strokePath(); g.setAlpha(0.25);` `return { line: g, x: e.x, y: e.y, color: PALETTE[e.def.look.color], serial: e.serial };`.
4. index.ts: `import { orbSplit } from './orbSplit';` after the midSplit import; `orbSplit,` after `midSplit,` in `ENEMY_HOOKS`.
5. bossDeath.ts: closure `let lastAlive = false; let lastAtLine = false; let leaked = false;`; `onLeak(enemy) { if (bossId(run.wave) === enemy.def.id) leaked = true; }`; `update()`: `const boss = bossId(run.wave);` `if (boss === undefined) { lastAlive = false; lastAtLine = false; leaked = false; return; }` find `alive`/`atLine` over `enemies.all` (`e.active && e.def.id === boss`); `if (!alive && lastAlive && lastAtLine && !leaked) sfx?.bossDown();` then set `lastAlive = alive; lastAtLine = atLine; leaked = false;`. `onKill` unchanged.
6. art/entities.ts: delete the whole `if (e.id === 'orb') { ... }` block (lines 33–47).
7. runChecks.ts: `import { SPLIT_TELEGRAPH_SEC } from '../systems/enemyHooks/midSplit';` and after `enemies.orb`: `['enemies.orbSplit', (g) => (g.enemies.all.every((e) => !e.active || e.def.splitsAt === undefined || (Number.isFinite(e.splitClock) && e.splitClock >= -1 - 1e-9 && e.splitClock <= SPLIT_TELEGRAPH_SEC + 1e-9)) ? null : 'a split window out of its beat')],`.
### Pitfalls
- The window must advance even at hp ≤ 0 inside it: gate the OPEN on `atSplitLine` only; once `splitClock >= 0` advance unconditionally — else an Orb drained to 0 in the window never splits and is unkillable.
- Shards' hp comes from `hpAt` (hp at window open), not window-end hp: `splitChildHp(0)` is 1.
- The split's own spawn may recycle the Orb's pooled slot: detect consumption by `serial`, carry `x/y/color` in state; never read `e.def`/`e.x` for the burst.
- `orbSplit` must stay after `midSplit` in `ENEMY_HOOKS`: the burst branch assumes midSplit consumed the Orb earlier the same frame.
- Tint: the hook only ever `setTintFill(0xffffff)` on window frames; the clear is the split's `despawn()` — never `clearTint()` on non-window frames (that kills the per-hit white blink `Enemy.advance`/`hit` own).
- Without the bossDeath fix the horn plays every frame of the 0.4 s window (~25× at 1x).
- Alpha needs `Math.min(1, ...)`: the fraction exceeds 1 below the line; without it the crack is >100% (and never "opaque at the half-hp line").
- `this.splitClock < 0`, not `!this.splitClock` (0 = window just opened; the falsy check would let one killing hit through).
- The art block is deleted, not overlaid — else the crack is doubled; the BossCard's 8 px token simply loses the (invisible at that size) baked crack. No sound: no Sfx method; the burst is `fx.burst` (self-capping).
- Don't touch `crackDeep.ts`, `split.ts`, `core/midSplit.ts` — Splitter, Colossus, Titan and regular enemies stay byte-identical.
### Tests
- none

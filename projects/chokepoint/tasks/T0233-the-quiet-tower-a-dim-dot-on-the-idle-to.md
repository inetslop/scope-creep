---
id: T0233
title: "The quiet tower: a dim dot on the idle tower"
assignee: yoga
size: S
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T22:31:19Z
claimed_at: 2026-10-29T23:20:34Z
---

## Goal
A tower that has work to do but nothing in range says so: a first-time player stops wondering whether a silent tower is broken, and nothing changes about how the game plays.

## Details
- During a wave, an **attack-first tower** (a tower whose first form fires or acts on a cadence: shot, spray, pulse, burn, mark, beam or trap) shows one small muted-gray dot (radius ~3 px, the HUD's own muted ink) centered just above its token while both hold: at least one enemy is alive on the road, and the tower has had no attack event for **4 s or more**.
- An **attack event** is the tower doing its thing: a shot fired, a pulse landing (splash, slow, root or gust), a burn or mark applied, a beam holding an enemy (a beam counts as firing continuously while it holds one; holding no enemy is idle), a trap disc laid.
- The dot fades in over ~200 ms and is cleared (a ~150 ms fade) the moment the tower next has an attack event. It is never shown in the build phase, and never while the road has no enemy alive.
- **Pure-passive first forms never dot**: Mint, Rally and the other supports whose first form has no on-board action of its own (Haste, Momentum, Mend, and Toll when it lands) show no dot, ever.
- The dot rides on the tower token (well clear of the tier pips on the plinth and the what-if ghost on the slots — T0096), not on a cell: no board mark, no cell decoration.
- Why the screen has room for it (one in, one out): it replaces the player's private guessing about a dead tower. It is a 6 px dot that exists only while a tower is idle and disappears the instant the tower works; nothing on screen shows tower idleness today (the panel's kills line is a run total, the working-aura ring T0055 shows supports *working*, not towers standing idle). It matters from wave 1 and matters more when E5's boss goes untargetable (every tower idles on purpose and the dot says why).
- Display only: derived live each frame, nothing saved, a resumed run behaves identically from its next wave; no sound, no input, no card, no pause-screen line.

## Acceptance criteria
- [ ] In a wave, a Bolt tower with no enemy in range shows a small muted-gray dot above its token ~4 s after its last shot; a Bolt tower with an enemy in range never does.
- [ ] The moment the tower next fires (or a beam grabs its target, or a support pulse lands), the dot is gone within ~150 ms.
- [ ] In the build phase and on an empty road, no tower shows the dot.
- [ ] Passive-first towers (Mint, Rally and the other no-attack supports) never show the dot; a slow-cadence pulse tower (Anchor, 3 s) never flickers one.
- [ ] The dot sits on the token, clear of the tier pips and the what-if ghost; no board cell gains any mark; no sound, input or HUD change; works at 412x915 and 1280x720.

## Design (architect, yoga)

### Files
- create `src/systems/towerIdle.ts` — the quiet-dot bookkeeping: `quietDot(t, road, attacked, dt)` + `IDLE_DOT_SEC = 4`
- edit `src/entities/Tower.ts` — add the `idleDot` graphics (same spot/color as the existing `jamDot`), fields `idleSec`, `beamHolding`, `idleOn`, method `setIdleDot()`, destroy cleanup
- edit `src/systems/TowerSystem.ts` — rewrite `update()` to capture `attacked` and call `quietDot`; one import line
- edit `src/systems/BeamSystem.ts` — set `t.beamHolding` in two places
- edit `src/debug/runChecks.ts` — one invariant line after the `towers.gold` entry

### Interfaces
```ts
// towerIdle.ts
export const IDLE_DOT_SEC = 4;
export function quietDot(t: Tower, road: boolean, attacked: boolean, dt: number): void {
  if (attacked) { t.idleSec = 0; t.setIdleDot(false); return; }
  if (!road) { t.idleSec = 0; t.setIdleDot(false); return; }
  t.idleSec += dt;
  if (t.idleSec >= IDLE_DOT_SEC) t.setIdleDot(true);
}
// Tower: public `idleSec = 0;` (after `cooldown`), public `beamHolding = false;` and `idleOn = false;` (after `jammed`),
// private `idleDot` graphics, public `setIdleDot(on: boolean): void`
```

### Steps
1. Create `src/systems/towerIdle.ts` exactly as above (`import type { Tower } from '../entities/Tower';`).
2. `Tower.ts`: declare `private readonly idleDot: Phaser.GameObjects.Graphics;` next to `jamDot`; after the jamDot block in the constructor add: `this.idleDot = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);` / `this.idleDot.fillStyle(PALETTE.muted, 1);` / `this.idleDot.fillCircle(0, -32, 3);` / `this.idleDot.setVisible(false);` (identical float to the jam dot). Add `setIdleDot()` right after `setJammed()`: `if (this.idleOn === on) return; this.idleOn = on; this.scene.tweens.killTweensOf(this.idleDot);` then if `on`: `this.idleDot.setAlpha(0).setVisible(true); this.scene.tweens.add({ targets: this.idleDot, alpha: 1, duration: 200 });` else `this.scene.tweens.add({ targets: this.idleDot, alpha: 0, duration: 150, onComplete: () => this.idleDot.setVisible(false) });`. In `destroy()` add `this.scene.tweens.killTweensOf(this.idleDot); this.idleDot.destroy();` after the `jamDot` line.
3. `TowerSystem.ts`: replace `update()` with: `const enemies = this.enemies.all; const road = this.enemies.aliveCount > 0;` then per tower: `const firstAttacks = t.spec.attacks && t.spec.kind !== 'rally';` `let attacked = false;` guard the existing cooldown/attack code in `if (t.spec.kind !== 'beam' && !t.jammed && t.spec.attacks) { if (!(<original pure-support condition byte-for-byte>) { t.cooldown -= dt; if (t.cooldown <= 0) { attacked = this.attack(t, enemies); if (attacked) t.cooldown += 1 / (t.spec.rate * t.rallyRateMul); else t.cooldown = 0; } } }` and end the loop with `if (firstAttacks) quietDot(t, road, attacked || t.beamHolding, dt);`. Keep `t.cooldown +=` (not `=`) and keep the original pure-support condition exactly, negated once. Import `quietDot` from `./towerIdle`.
4. `BeamSystem.ts`: in the jammed branch add `t.beamHolding = false;` before the `continue`; after `this.held.set(t, now);` add `t.beamHolding = now.some((e) => e !== undefined);` (a held line counts as firing, so shot+beam towers stay dotted off while the beam holds).
5. `runChecks.ts`: after the `towers.gold` entry add `['towers.quietDot', (g) => { for (const t of g.towers.towers) if (t.idleOn && (!t.spec.attacks || t.spec.kind === 'rally')) return `a ${t.spec.kind} tower shows its quiet dot`; return null; }],`.

### Pitfalls
- Do not touch `jamDot`, the pips, the what-if ghost or DECORATIONS; the dot rides the token at `(0,-32)`, board units, no HUD/layout change (412x915 and 1280x720 unaffected).
- Only ONE writer per tower: TowerSystem runs `quietDot` for every eligible tower (beam-first included, via `t.beamHolding`, one frame stale — fine for a 150 ms fade); BeamSystem only sets the flag. Never run the dot logic for `kind === 'rally'`/empty — Mint/Rally and the future Haste/Momentum/Mend/Toll never dot, even a Mint+Bolt that does shoot.
- Jammed towers: `attacked` stays false so the dot still counts up — it lands exactly on the Mute's identical dot, and a Mute-jammed beam must get `beamHolding = false` or a stale `true` suppresses the dot.
- `RunFlow` only calls `TowerSystem` in the wave phase and `aliveCount === 0` ends every build phase, so the build phase can never show the dot; no sound, input, card or pause line may be added.
- Kill the `idleDot` tween in `destroy()` or smoke fails on a tween to a destroyed graphics.

### Tests
none

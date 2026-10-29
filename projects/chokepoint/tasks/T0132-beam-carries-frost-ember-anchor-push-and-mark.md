---
id: T0132
title: "Beam combos III: the beam carries Frost, Ember, Anchor, Push and Mark"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T10:40:00Z
epic: E4
---

## Goal
The "hits do X" augments (Frost, Ember, Anchor, Push, Mark) do nothing on a Beam-first tower, because a beam never "hits" today. Define a beam hit so they all work, and so a Frost or Anchor beam becomes a real control tower.

## Details
Applies to a tower whose **first** augment is Beam, on every line it holds (the main beam, Bolt rays from T0130 if present, Beam-added lines).
- **Contact effects (while the beam holds the enemy):**
  - Frost added: the beamed enemy is slowed by Frost's percent (40/50/60% by Frost tier) for as long as the beam holds it, and for Frost's 2 s after.
  - Mark added: the beamed enemy is marked (+25% damage taken per Mark) while held and for 2 s after.
  - Ember added: the beamed enemy is ablaze with Ember's burn (3/4/5 per second for 3 s), refreshed while held.
- **Pulse effects (one beam "hit" per second of contact on the same enemy, the first at the moment of lock):**
  - Anchor added: roots the enemy for Anchor's 0.5 s (+0.25 s per extra Anchor).
  - Push added: pushes it back 0.4 cells (+0.4 per Push).
  So a root or push never chains forever: one per second of contact.
- **Look:** a beam carrying an effect gets a thin second line beside it (2 px, 50% alpha) in the effect augment's own color, one per effect, at most two shown.
- **Panel:** "its beam slows by 40%", "its beam sets ablaze", "its beam roots for 0.5 s every second", etc.
- The Ward (T0111, if landed) ignores slow, root and push from beams like from anything else.

## Acceptance criteria
- [ ] Beam first + Frost: a held enemy moves at 60% speed while held and for 2 s after; unit-tested.
- [ ] Beam first + Mark / Ember: the held enemy is marked / ablaze while held; unit-tested.
- [ ] Beam first + Anchor: the held enemy is rooted 0.5 s once per second of contact, the first at lock; Push the same with 0.4 cells; unit-tested.
- [ ] Effect lines show beside the beam in the effect's color.
- [ ] The tower panel describes each effect.

## Design (architect, desktop)

### Files
- create `src/core/beamHold.ts` — pure rule for a beam line's "hit": contact while it holds an enemy, one pulse at lock then once per second of contact (unit-testable, no Phaser).
- create `src/core/beamEffects.ts` — `beamFx(spec)` (which effects a beam-first tower's lines carry, from its existing spec fields) and `beamEffectLines(augments)` (which effect colors ride the beam, at most two).
- edit `src/systems/EnemySystem.ts` — add one method `beamEffects()` next to `beamTick()` (apply contact + pulse through the enemy's own `slow`/`mark`/`ignite`/`root`/`pushBack` methods, so Ward from T0111 ignores them automatically when it lands); no other change.
- edit `src/systems/BeamSystem.ts` — per-line hold state, effect application each frame, thin effect lines drawn beside each beam line, and the hold check folded into the existing `broken()` (no `runChecks.ts` edit: `beams.valid` already calls it).
- edit `src/core/augments.ts` — `describeSpec` beam branch gains the effect trailers ("its beam slows by 40%" etc.) + one stale comment fixed.
- create `tests/core/beamHold.test.ts` — hold/pulse timing rule.
- create `tests/core/beamEffects.test.ts` — `beamFx`, `beamEffectLines`, panel lines.

### Interfaces
```ts
// src/core/beamHold.ts
export const BEAM_HIT_SEC = 1;
export interface BeamHold { enemy: object | undefined; nextHit: number; }
export const EMPTY_BEAM_HOLD: BeamHold = { enemy: undefined, nextHit: BEAM_HIT_SEC };
export function beamHoldStep(hold: BeamHold, enemy: object | undefined, dt: number): { contact: boolean; pulse: boolean; hold: BeamHold };
// `enemy` undefined -> { contact:false, pulse:false, hold:EMPTY_BEAM_HOLD }. New enemy (hold.enemy !== enemy)
// -> { contact:true, pulse:true, hold:{ enemy, nextHit:BEAM_HIT_SEC } } (the hit at the moment of lock).
// Same enemy -> nextHit -= dt; pulse true (resetting nextHit to BEAM_HIT_SEC) only when it reaches <= 0.

// src/core/beamEffects.ts (imports: CELL from ../config, getAugment, PALETTE, types from ../content, TowerSpec from ./augments)
export interface BeamFx { slow: { pct: number; sec: number } | undefined; markPct: number; burn: Burn | undefined; root: { sec: number } | undefined; push: number; }
export function beamFx(spec: TowerSpec): BeamFx | undefined; // undefined when spec.kind !== 'beam' or none of
// slow/markPct/burn/root/pushPerHit is set. push = spec.pushPerHit * CELL (board units). Values come straight from
// the spec, which for a Beam-first tower only ever holds these from ADDED augments (Beam's first form has none).
export const BEAM_EFFECT_LINE_MAX = 2;
export function beamEffectLines(augments: readonly AugmentCopy[]): { id: string; color: number }[]; // the ids
// 'frost','mark','ember','anchor','push' in tower order, one per augment (duplicates dropped), color =
// PALETTE[getAugment(id).look.color], at most BEAM_EFFECT_LINE_MAX.

// src/systems/EnemySystem.ts, after beamTick():
beamEffects(target: Enemy, fx: BeamFx, pulse: boolean, source: Tower): void;
// if (!target.active) return; fx.slow -> target.slow(pct, sec); fx.markPct > 0 -> target.mark(markPct);
// fx.burn -> overtook = target.burn.left <= 0 || fx.burn.dps >= target.burn.dps; fresh = target.ignite(dps, sec);
// if (overtook) target.burnSource = source; if (fresh) this.sfx?.ignite();  // same rules as strike()'s burn
// if (!pulse) return; fx.root -> target.root(sec); fx.push > 0 -> target.pushBack(push).
```
No new content, types, art, audio, HUD or input; the panel already renders `describeSpec(tower.spec)` (`TowerPanel.ts:76`), so the panel criterion is met by the `describeSpec` edit alone.

### Steps
1. Create `src/core/beamHold.ts` exactly as in Interfaces (keep the codebase's doc-comment style; it explains contact = every frame held, pulse = the once-per-second hit).
2. Create `src/core/beamEffects.ts` as in Interfaces. `EFFECT_IDS` is a module-level `new Set(['frost','mark','ember','anchor','push'])`.
3. `src/systems/EnemySystem.ts`: add `import type { BeamFx } from '../core/beamEffects';` and the `beamEffects()` method directly after `beamTick()` (lines 120-125). Nothing else in this file.
4. `src/systems/BeamSystem.ts`:
   a. Imports: `import { EMPTY_BEAM_HOLD, BEAM_HIT_SEC, beamHoldStep } from '../core/beamHold'; import type { BeamHold } from '../core/beamHold'; import { beamEffectLines, beamFx } from '../core/beamEffects';`
   b. Field next to `held`: `private readonly holds = new Map<Tower, BeamHold[]>();`
   c. New private method: `holdsFor(t: Tower, size: number): BeamHold[]` — get-or-resize `this.holds` for `t` to `size`, new slots `EMPTY_BEAM_HOLD` (mirror of the existing `held` resize).
   d. In `update()`, right after the existing `held` resize block (before `const { main, lines } = beamLines(...)`): `const fx = beamFx(t.spec); const holds = fx ? this.holdsFor(t, size) : undefined;` and after `const { main, lines } = beamLines(...);` add `const targets: (Enemy | undefined)[] = [main === -1 ? undefined : this.enemies.all[main]!, ...lines]; const steps = holds ? targets.map((e, i) => beamHoldStep(holds[i]!, e, dt)) : undefined;`
   e. Keep the existing main-line/extra-line `beamTick` blocks untouched, then after them insert: `if (fx && steps) { for (let i = 0; i < targets.length; i++) { const e = targets[i]; if (e && e.active) this.enemies.beamEffects(e, fx, steps[i]!.pulse, t); } }` (effects only on targets still alive after the tick).
   f. Replace the `now` block (the "A tick may have killed its target" loop) with: `const now: (Enemy | undefined)[] = []; for (let i = 0; i < targets.length; i++) { const e = targets[i]; const alive = e && e.active; now.push(alive ? e : undefined); if (holds && steps) holds[i] = alive ? steps[i]!.hold : EMPTY_BEAM_HOLD; } this.held.set(t, now);`
   g. In the drawing section (after `const color = ...`): `const fxs = fx ? beamEffectLines(t.augments) : [];` and after the existing hit-end tick (`g.lineBetween(e.x - px * 4, ...)`), inside the `d >= 1` path: `for (let i = 0; i < fxs.length; i++) { const off = 5 + i * 4; g.lineStyle(2, fxs[i]!.color, 0.5); g.lineBetween(m.x + px * off, m.y + py * off, e.x + px * off, e.y + py * off); }`
   h. Extend `broken()`: keep the existing loop, and after its per-tower range check add: `const holds = this.holds.get(t); if (!holds) continue; if (holds.length !== held.length) return ...; for (let i = 0; i < holds.length; i++) { const h = holds[i]!; if ((h.enemy !== undefined) !== (held[i] !== undefined)) return ...; if (h.enemy && (!Number.isFinite(h.nextHit) || h.nextHit < 0 || h.nextHit > BEAM_HIT_SEC)) return ...; }` (skip `t.jammed` towers first, as already).
5. `src/core/augments.ts` `describeSpec`, beam branch (lines 248-251): after the `beamExtras` lines add `if (slow) line += `, its beam slows by ${slow}%`; ` then `if (marked > 0) line += `, its beam marks for +${marked}% damage`; ` then `if (spec.burn) line += `, its beam sets ablaze`; ` then `if (spec.root) line += `, its beam roots for ${spec.root.sec}s every second`; ` then `if (spec.pushPerHit > 0) line += `, its beam pushes back ${spec.pushPerHit.toFixed(1)} cells every second`; `. Replace the comment above the ablaze trailer ("A beam has no hits of its own, so the hit trailers never say it.") with "a beam-first tower says its beam's effects in its own line." Leave the `spec.kind !== 'beam'` guards on the two generic trailers in place (the beam branch now covers them; removing the guards would print twice).
6. Create the two test files (Tests). Run `npm run check` then `npm run smoke`; both must pass.

### Pitfalls
- Pooling: hold identity is the enemy object reference; a killed target is set inactive by the tick the same frame, and step (f) resets that line's hold to `EMPTY_BEAM_HOLD`, so a recycled pool object can never resume a stale contact. A swapped extra-line target is a new contact (pulse at the new lock) — that is intended.
- Never apply effects to a dead target: guard `e.active` before `beamEffects` and inside it; a pulse that lands the frame the beam kills is simply skipped (the hold resets).
- The ignite SFX must fire only when `fresh` — contact re-ignites every frame, so re-using `strike()`'s logic verbatim but gating the sound on `fresh` (as specified) or it will shriek every frame.
- The `holds` array must grow/shrink in lockstep with `held` (an augment placed mid-run changes `beamExtras`); `holdsFor` mirrors the existing resize, and the new slot's `EMPTY_BEAM_HOLD` makes the first lock pulse immediately.
- Jammed towers (Mute) are skipped before any hold stepping, so holds freeze exactly like the frozen lines; `broken()` must skip `t.jammed` (already does) or the check false-alarms.
- `dt` comes in clamped (`GameScene` caps at 0.05 s, x2 speed at 0.1 s); all timing is `dt`-based, no 60 fps assumption, no `Math.random()`.
- Core files may not import Phaser; `beamHold.ts`/`beamEffects.ts` import only config/content. Mark and Anchor are both `pink` — two pink lines on such a tower is by design ("the effect's own color").
- Effect lines are drawn only in the `d >= 1` branch (where `px`/`py` exist); they are board-space Graphics, already camera-correct.
- T0130's Bolt rays (if they land first/after) become entries in the same `held`/`targets` structure, so they inherit the effects with no further change; T0111's Ward needs nothing here because all effects go through the enemy's own methods.

### Tests
- `tests/core/beamHold.test.ts`: first step on a target is contact + pulse (hit at lock); holding at 0.4 s + 0.6 s steps pulses exactly on the 1.0 s step and only then; a new target pulses immediately on the switch step; an `undefined` step resets, and re-locking the same object pulses again; `nextHit` always in (0, BEAM_HIT_SEC].
- `tests/core/beamEffects.test.ts` (use the `copy`/`spec` helpers' pattern from `tests/core/augments.test.ts`): `beamFx(spec('beam'))` and `beamFx(spec('bolt','beam'))` undefined; `beamFx(spec('beam','frost'))` = slow {0.4, 2} (rare 0.5), `ember` = burn {3, 3}, `mark` = markPct 0.25, `anchor` = root {0.5} (two anchors 0.75), `push` = 0.4 * CELL; `beamEffectLines` returns at most two, in tower order, deduped, with `PALETTE.ice`/`PALETTE.orange` colors; `describeSpec` beam lines: `/its beam slows by 40%/`, `/its beam marks for \+25%/`, `/its beam sets ablaze/`, `/its beam roots for 0\.5s every second/` (0.75s with a second Anchor), `/its beam pushes back 0\.4 cells/`; `describeSpec(spec('bolt','beam'))` must NOT contain "its beam".

---
id: T0089
title: "Pulse: the ring that guards its own cell"
assignee: inet-racing
size: L
priority: 3
status: in-progress
depends_on: [T0084]
attempts: 1
created: 2026-10-29T00:51:07Z
claimed_at: 2026-10-29T08:46:22Z
epic: E4
---

## Goal
The pool gets its first attack that aims at nothing: a Pulse tower damages everything around itself on a fixed cadence, so guarding the choke a tower stands on becomes a placement decision, and lanes single-target towers can't cover get covered.

## Details
- Both card lines:
  - As a tower's first augment: "Pulse — a ring of damage around the tower itself: 8/10/12 damage to everything within 2.5 cells every 2.0/1.7/1.4 s by tier. No shot, no target."
  - When added: "Pulse — the ring reaches 0.5 cells further." (per copy: 3.0, 3.5, 4.0, …; the tower's range ring grows with it)
- The pulse is the tower's own damage: a kill by a pulse is that tower's kill (gold pop, Mint's +1, the combo counter, the panel's kills line all credit it); Mark added to a Pulse marks everything the ring strikes; Rally's speed-up applies to the pulse's cadence; Momentum's bonus multiplies the pulse's damage.
- Pool, all tiers (the numbers above are Common/Rare/Epic), offered from the opening draft, the normal tier roll and no-repeat rule.
- Look: a low squat donut at the tower's base in its own color with one tick per copy (Momentum's tick language), and a thick expanding ring (~200 ms, ground level, the tower's own color) at each pulse — the pulse is seen before it lands.
- Sound: one soft low thud per pulse at the quiet volume (the tier chime's 0.1, never louder than the hit blip); silent with the pause sound off (T0035).
- Closest existing augment: Push (a self-centered pulse with no damage). New: the pulse deals damage and aims at nothing — the first attack that hits by proximity instead of at an enemy (Frost's ring slows, Push's ring shoves, Pulse's ring hurts).
- The panel's "≈ N/s" line (T0084) gains the pulse's term as damage × pulses per second — an enemy in range takes every pulse.

## Acceptance criteria
- [ ] The draft offers Pulse at all three tiers from the opening draft, with the two card lines above and the usual frame, gem row and odds treatment.
- [ ] A lone Pulse tower damages every enemy inside its reach every pulse tick — no projectile, no targeting: an enemy that walks into the ring takes the hit, and one pulse strikes two enemies inside the ring at once.
- [ ] Each added Pulse extends the ring by 0.5 cells, and the tower's range ring grows with it.
- [ ] A Pulse tower looks unlike every other tower: the low squat donut at its base in its own color with one tick per copy, and the thick expanding ring at each pulse.
- [ ] A kill by a pulse is the tower's kill — gold pop, Mint's +1, the combo counter and the panel's kills line all credit it — and Mark added to a Pulse marks everything the ring strikes.
- [ ] One soft low thud per pulse at the quiet volume, silent with sound off; nothing in the pulse plays louder than the hit blip.

## Design (architect, desktop)

### Files
- create `src/content/augments/pulse.ts` - the Pulse augment def (data only)
- create `src/systems/fx/pulseRing.ts` - the thick expanding ring effect
- edit `src/content/augments/index.ts` - `import { pulse } from './pulse';` (after mint, before push) + `pulse,` in `AUGMENTS` after `push,`
- edit `src/core/augments.ts` - `TowerSpec.pulseCount` field + EMPTY value + count loop in `towerSpec()`
- edit `src/entities/towerLook.ts` - one `DECORATIONS` entry (donut + ticks), after the Mark entry; import `pulse`
- edit `src/systems/attacks/pulse.ts` - Pulse-tower branch: `pulseRing` fx + `thud` sound (two branch lines only)
- edit `src/audio/Sfx.ts` - one `thud()` method next to `pulse()`
- edit `src/debug/runChecks.ts` - `towers.pulse` invariant line after `towers.gold`
- edit `tests/core/augments.test.ts` - dps-test exclusion + `describe('pulse (Pulse)')` block after the push block
- edit `src/core/towerDps.ts` - T0084's file (exists after T0084): the pulse term, see step 10
### Interfaces
```ts
// content/augments/pulse.ts
export const pulse: AugmentDef; // id 'pulse', look { shape: 'chevron', color: 'red', size: 0.22 }
//   first: { kind: 'pulse', damage: 8, range: 2.5, rate: 0.5 }
//   added: { splash: 0.5 }   // on a pulse tower core/augments folds splash into range (2.5+0.5/copy); on a shot tower it is a 0.5-cell burst
//   tiers.rare: { damageMul: 1.25, cooldownMul: 0.85, asTower: ..., asAdded: 'The ring reaches 0.5 cells further.' }   // 10 dmg, 1.7 s
//   tiers.epic: { damageMul: 1.5,  cooldownMul: 0.7,  asTower: ..., asAdded: 'The ring reaches 0.5 cells further.' }   // 12 dmg, 1.4 s
// core/augments.ts - TowerSpec gains:  /** Pulses in the tower: a low squat donut at the base, one tick per copy. */ pulseCount: number;  (EMPTY: 0)
// systems/fx/pulseRing.ts
export function pulseRing(fx: FxSystem, x: number, y: number, radius: number, color: number): void;
// audio/Sfx.ts
thud(): void; // this.tone(90, 0.2, 'sine', 0.1, 45)
```
### Steps
1. `src/content/augments/pulse.ts`: copy the shape of `push.ts`. Exact lines: `asTower: 'A damage ring around the tower: 8 to all in 2.5 cells, every 2.0 s.'` (67 chars); `tiers.rare.asTower: 'A damage ring: 10 to all in 2.5 cells, every 1.7 s.'` and `tiers.epic.asTower: 'A damage ring: 12 to all in 2.5 cells, every 1.4 s.'` (51 each); `description: 'A ring of damage around the tower itself, no shot, no target. Added: the ring reaches 0.5 cells further.'`. No `opening` flag needed (damage > 0); no `tier` field (all tiers).
2. Register it in `src/content/augments/index.ts` (import + one list line, per Files).
3. `src/core/augments.ts`: add `pulseCount` to `TowerSpec` (after `pushCount`) and `pulseCount: 0` to `EMPTY`; in `towerSpec()` after the push loop: `// Pulses in the tower: the low squat donut at the base, one tick per copy.` then `for (const a of augments) if (a.id === pulse.id) spec.pulseCount += 1;` (import the def).
4. `src/entities/towerLook.ts`: new `DECORATIONS` entry after Mark: if `spec.pulseCount === 0` return; `const c = PALETTE[getAugment(pulse.id).look.color];` `fillRing(g, 0, 0, BODY * 1.95, 5, 0, Math.PI * 2, c, 1);` then per tick `i`: `const a = (i / spec.pulseCount) * Math.PI * 2; fillRing(g, 0, 0, BODY * 1.95, 8, a - 0.15, a + 0.15, c);` (fillRing angles: 0 = up).
5. `src/systems/fx/pulseRing.ts`: guard `if (fx.full) return;`; graphics at `DEPTH.preview` (ground level) positioned at (x,y); `fillRing(g, 0, 0, radius, 8, 0, Math.PI * 2, color, 0.9);`; `g.setScale(0.2); fx.track(g, 200, { scale: 1, alpha: 0, ease: 'Cubic.easeOut' });`.
6. `src/systems/attacks/pulse.ts` (re-read it first — T0073 edits it): after the strike loop, replace the wave/rootWave lines with `const isPulse = spec.firstId === 'pulse';` / `if (isPulse) pulseRing(fx, tower.x, tower.y, range, payload.color);` / `else if (spec.damage > 0 || !spec.root) fx.wave(...);` (keep the `if (spec.root) fx.rootWave(...)` line); replace the last sound line with `if (spec.gust > 0) sfx?.gust(); else if (isPulse) sfx?.thud(); else sfx?.pulse();` and update the comment. Nothing else changes: the attack already strikes every enemy in `inRange`, and `payload.source` is the tower.
7. `src/audio/Sfx.ts`: add `thud()` right after `pulse()`: `this.tone(90, 0.2, 'sine', 0.1, 45);` (0.1 = the tier chime's note volume, quieter than the hit blip; muted is handled by `tone()`).
8. `src/debug/runChecks.ts`: after `towers.gold`: `['towers.pulse', (g) => { for (const t of g.towers.towers) { const n = t.augments.filter((a) => a.id === 'pulse').length; if (t.spec.pulseCount !== n) return \`pulse count ${t.spec.pulseCount} at (${t.cell.col}, ${t.cell.row})\`; } return null; }],`
9. `tests/core/augments.test.ts`: in 'every damaging first augment can hold wave 1', filter `a.first.damage > 0 && a.first.kind !== 'pulse'` with a comment (a pulse first hits everything in its ring at once, so single-target dps does not apply); add a `describe('pulse (Pulse)')` after the push block asserting: `spec('pulse')` has kind 'pulse', damage 8, range 2.5, rate 0.5, bolts 0; `spec('pulse','pulse').range === 3` and `pulseCount === 2`; `tierFirst(getAugment('pulse'),'rare').damage === 10` and `1/rate` close to 1.7 (epic 12 / 1.4); `tierTowerLine` rare/epic contain '1.7 s'/'1.4 s'.
10. `src/core/towerDps.ts` (after T0084 lands): the pulse term — a pulse-kind tower contributes `spec.damage * spec.rate` (an enemy in range takes every pulse), with the same treatment the shot term gets; add a test case for a Pulse tower.
### Pitfalls
- Card lines are hard-capped at 70 (base) / 56 (tier) chars by `tests/content.test.ts` and the phone layout — use the exact strings in step 1, do not restore the task's longer sentences.
- `cooldownMul` must be < 1 (the test asserts it; it divides the rate): 0.85 and 0.7, not 2.0/1.7.
- The damage lands on the firing frame, like every other pulse; the 200 ms ring is the pulse's visual, not a delayed-damage windup. Do not add cooldown/delay logic — the tower already stays ready and fires the moment an enemy walks into range (TowerSystem).
- Kill credit needs no work: `strike()` → `kill(payload.source)` pays the gold pop, Mint +1, combo chain and `tower.kills` (the panel's kills line); Mark (any slot) is applied to every ring hit via `payload.mark`; Rally speeds the cadence via `t.rallyRateMul` in TowerSystem; T0064's Momentum multiplier will apply to pulse damage for free because the pulse goes through `strike()` — never bypass it.
- Balance note: Pulse's single-target dps (common 4) is below the old 12 floor of the dps test — that is the task's intended trade (its value is the wide guard zone, multi-target); the test edit in step 9 excludes pulse-kind firsts, which is why the exclusion is kind-based, not id-based.
- Don't touch `sfx.pulse()` (Frost/Anchor/Splash use it) — only add `thud()`. Donut and Mark ring share the base radius: the red donut simply overpaints the ink ring where a tower has both.
- No new input or HUD element: draft offering, frame, gems and odds are automatic (damage > 0 opens the pool); cards auto-grow in DraftScene.
### Tests
- `tests/core/augments.test.ts`: the step-9 edits (pulse describe block + dps-test exclusion); `tests/content.test.ts` validates the new augment automatically; `src/core/towerDps.ts` gains a Pulse case in step 10.

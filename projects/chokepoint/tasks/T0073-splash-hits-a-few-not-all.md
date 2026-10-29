---
id: T0073
title: "Splash hits a few, not all: 3 enemies per Splash"
assignee: desktop-4070
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T21:08:30Z
claimed_at: 2026-10-29T00:09:48Z
design_attempts: 1
---

## Goal
Splash's blasts hit every enemy in their area, which makes its combos (extra shots, Rapid, Mark, Ember) far stronger than any other tower. Cap how many enemies a Splash blast hits, and let the cap grow with every Splash in the tower: more Splash means more of the pack, not all of it from the first copy.

## Details
- **The rule:** a Splash blast hits at most **3 enemies per Splash in the tower** (1 Splash: 3, 2: 6, 3: 9), counting copies in any slot and at any tier.
- **Splash as a tower's first augment (its pulse):** hits the up-to-N enemies in range that are **furthest along the road** (the same choice the other attacks make), not everything in range.
- **Splash added to a shooting tower (its bursts):** each hit still strikes its own target; the burst then strikes at most N - 1 other enemies inside the burst radius, **nearest to the struck enemy first**. Pierce is unaffected.
- **Splash added to a tower whose first augment is another pulse** (Frost, Anchor, Push): unchanged. It still widens that pulse's reach, and the pulse still affects everything in it (those pulses already hit everyone in range and aren't the damage problem).
- **Tiers are unchanged:** Rare and Epic still burst wider and hit harder (radius 1.5 / 2 cells, their damage and cadence); the count only grows with copies.
- **Card lines (Common):** first: "Blasts the 3 furthest around it." Added: "Hits burst over 1 cell, to 2 more enemies." Rare and Epic show their own radius in the added line ("over 1.5 cells", "over 2 cells"); the counts are the same at every tier.
- **Tower panel line:** says the tower's count, e.g. "blasts the 6 furthest" for a tower with two Splash, "its hits burst to 2 more" for a Bolt with one Splash added.
- No new visuals or sounds: the pulse ring and the burst ring look as they do today.

## Acceptance criteria
- [ ] A Splash tower with 6 enemies in range damages exactly the 3 furthest along; with a second Splash in it, all 6.
- [ ] A Bolt with Splash added: each hit damages its target plus at most 2 others inside the burst radius, the nearest first; with two Splash added, at most 5 others.
- [ ] Frost, Anchor and Push towers with Splash added still reach further and affect every enemy in their wider range.
- [ ] A Rare or Epic Splash still bursts wider and hits harder than a Common one; the counts don't change by tier.
- [ ] The draft cards and the tower panel show the counts.
- [ ] Unit tests cover the counts (1, 2 and 3 Splash; first and added) and the furthest-along / nearest-first choice.

## Design (architect, baby-mama)

Cap how many enemies a Splash hits: 3 per Splash copy (N = copies × 3), counted in any slot/tier. (a) Splash-first pulse hits its N furthest-along in range; (b) a shot's burst strikes ≤ N−1 *other* enemies, nearest to the struck one first; (c) splash added to Frost/Anchor/Push pulses is unchanged; tiers keep radius/damage as-is (counts never change by tier). No new visuals/sounds.

### Files
- `src/content/augments/splash.ts` — add `export const SPLASH_CAP = 3;` + card lines.
- `src/core/targeting.ts` — new `pickNearest()`.
- `src/core/augments.ts` — `splashCount` on `TowerSpec`/`EMPTY`, count loop in `towerSpec()`, `splashHits()`, two `describeSpec()` line edits.
- `src/systems/attacks/pulse.ts` — cap the hits when the first is Splash.
- `src/systems/EnemySystem.ts` — `splashCap` on `HitPayload`; `hit()` uses `pickNearest`.
- `src/systems/TowerSystem.ts` — one payload line.
- `tests/core/targeting.test.ts`, `tests/core/augments.test.ts` — new tests.

### Interfaces
- `pickNearest(near: TargetCandidate, radius: number, enemies: readonly TargetCandidate[], max: number): number[]` — active enemies within `radius` of `near`, nearest first, `near` itself skipped, up to `max`.
- `export function splashHits(copies: number): number` in `core/augments.ts` — `copies * SPLASH_CAP` (SPLASH_CAP imported from `content/augments/splash.ts`).
- `TowerSpec.splashCount: number` (copies of Splash in any slot; 0 in `EMPTY`); `HitPayload.splashCap: number` (burst victims *besides* the struck enemy).

### Steps
1. `splash.ts`: add `export const SPLASH_CAP = 3;`; make lines from it so they can't drift: `asTower: \`Blasts the ${SPLASH_CAP} furthest around it.\``; `asAdded: \`Hits burst over 1 cell, to ${SPLASH_CAP - 1} more enemies.\``; same for `description`; keep Rare/Epic `asAdded` radii ("1.5"/"2 cells") with the same count: \`Hits burst over 1.5 cells, to ${SPLASH_CAP - 1} more enemies.\` etc.
2. `targeting.ts`, after `pickTargets`:
```ts
export function pickNearest(near: TargetCandidate, radius: number, enemies: readonly TargetCandidate[], max: number): number[] {
  const d2 = (i: number): number => { const e = enemies[i]!; const dx = e.x - near.x; const dy = e.y - near.y; return dx * dx + dy * dy; };
  return inRange(near.x, near.y, radius, enemies).sort((a, b) => d2(a) - d2(b)).filter((i) => enemies[i] !== near).slice(0, Math.max(0, max));
}
```
3. `core/augments.ts`: import `SPLASH_CAP`; `TowerSpec` field `/** Copies of Splash in the tower: its hit cap (core/augments.ts). */ splashCount: number;` + `splashCount: 0,` in `EMPTY`; after the Push loop: `for (const a of augments) if (a.id === 'splash') spec.splashCount += 1;`; helper `export function splashHits(copies: number): number { return copies * SPLASH_CAP; }`; `describeSpec`: shot branch → `\`, and the shots burst to ${splashHits(spec.splashCount) - 1} more\``; final else → `line = spec.firstId === 'splash' ? \`Blasts the ${splashHits(spec.splashCount)} furthest around it\` : 'Blasts everything around it';`
4. `pulse.ts`: `import { splashHits } from '../../core/augments';`; replace the `hits` line with:
```ts
const cap = spec.firstId === 'splash' ? splashHits(spec.splashCount) : 0;
const hits = cap > 0 ? pickTargets(tower.x, tower.y, range, enemies, cap) : inRange(tower.x, tower.y, range, enemies);
```
5. `EnemySystem.ts`: `HitPayload` gains `/** How many more enemies (beyond the struck one) the burst strikes: the nearest first. */ splashCap: number;`; import `pickNearest` from `../core/targeting`; in `hit()` replace the all-in-radius loop with `for (const i of pickNearest(target, payload.splash, this.pool, payload.splashCap)) victims.push(this.pool[i]!);` (keep `fx.ring` and the `payload.splash > 0` guard).
6. `TowerSystem.ts`: import `splashHits` alongside `slotCost, towerColor`; payload line after `splash:`: `splashCap: Math.max(0, splashHits(spec.splashCount) - 1),`.
7. Tests: `targeting.test.ts` — `describe('pickNearest')` with a struck enemy `{x:100,y:0,distance:20,active:true}` plus neighbours at x 104/90/200 and one dead at 112: radius 30 → `[1,2]` order nearest-first, dead skipped; radius 100 → includes the far one, still skips the struck. `augments.test.ts` — `describe('splash cap')`: `spec('splash').splashCount===1`, `spec('bolt','splash','splash').splashCount===2`, `spec('splash','splash','splash').splashCount===3`; `describeSpec(spec('splash'))` matches `'Blasts the 3 furthest around it.'`, `spec('splash','splash')` matches `'Blasts the 6 furthest'`, `spec('bolt','splash')` matches `'shots burst to 2 more'`, `spec('bolt','splash','splash')` matches `'5 more'`; `spec('frost','splash')` keeps `splash===0` and its line matches `'Slows everything around it'`.

### Pitfalls
- Cap only on `spec.firstId === 'splash'` — never test `kind === 'pulse'` or `spec.splash > 0`: Frost/Anchor/Push must keep hitting everyone in range.
- `pickNearest` skips the struck enemy by reference (`!== near`); without it the target is struck twice (it sits at distance 0, so it sorts first).
- N−1 (others only) in the shot burst: `splashCap` in TowerSystem and the shot line; N total in the pulse cap — don't swap them.
- Don't touch `pickPierceTarget` (Pierce unaffected), `fx.ring`, or projectile visuals (`Projectile.fire`'s 1.4 scale is unchanged).
- The existing test `describeSpec(spec('bolt','splash'))).toMatch(/burst/)` must still pass.

### Tests
`npm run check` (unit: pickNearest order/skip/cap; counts 1/2/3 first+added; panel lines; Frost uncapped) and `npm run smoke`.

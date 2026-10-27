---
id: T0127
title: "Tide — the page breathes after 16:00"
assignee: asus
size: L
priority: 2
status: todo
depends_on: [T0116]
attempts: 0
created: 2026-10-27T16:34:21Z
---

## Goal
After 16:00 the crop-safe boundary itself becomes a hazard — an ink edge that breathes in and out, and the advancing ink burns — so the late page has a rhythm of its own to time against the Gutter sweeps, the swarm and (after 20:00) The Press's wall.

## Details
- Schedule: from 16:00 (960 s) on, the crop-safe boundary breathes on a 6 s period — 3 s sliding inward, 3 s sliding back out, a linear triangular wave. At the inward peak the ink edge sits 4% of the safe area's width (left/right) and 4% of its height (top/bottom) inside the crop-safe boundary; at rest it is exactly on the crop-safe boundary. Before 16:00 the boundary, its burn and everything keyed to it are identical to today.
- The hazard draws as the hazard: the ink edge renders as a flat 6 u dark-ink band on its inside, along the breathing boundary — the Gutter's flat-ink idiom (T0099), no glow, no gradient. The paper between the band and the crop-safe boundary keeps its normal tone.
- Burn: while the ink is advancing (the 3 s inward slide), standing with the player's circle center between the ink edge and the crop-safe boundary burns 4 damage/s through the existing continuous-burn path (the Gutter's 4/s and the crop's 5/s idiom). While the ink is receding, the same margin is safe. At rest there is no band and no burn.
- Telegraph: the crop-mark corners (T0045) brighten toward full alpha as the ink advances (eased, full at the inward peak) and dim back on the retreat — the corners are the early hint that the page is about to breathe.
- Teaching: the first inward phase of a run prints the marginalia note "THE PAGE BREATHES" beside the player in the marginalia idiom (T0027), fading over 2 s.
- The breathing rect is the safe rect: from 16:00 on the Gutter (T0099) sweeps the breathing safe area (clipped to it exactly as it is clipped to the crop-safe rect today), The Press's wall (T0116) measures its progress in fractions of the same breathing rect (so the wall's speed breathes with the page — intended), and the spawn director plus the Underdrawing's announcements (T0100) place spawns within the breathing rect. No system special-cases Tide; everything reads one adjusted safe rect.
- No new SFX, key, HUD element or scene: the ink edge, the brightening corners and the marginalia are the entire teaching.
- The pure schedule lives in its own module in `src/core/` with unit tests in the crop/gutter pattern (T0045/T0099): the inset fraction (0 before 960 s; 0 → 0.04 linear over 3 s; 0.04 → 0 linear over 3 s; 6 s period thereafter; continuous and non-negative) and the phase (advancing / receding / rest). The burn rule (advancing phase only) is tested on the same module.

## Acceptance criteria
- [ ] Before 16:00 nothing changes: the boundary, the crop burn, the Gutter, the spawns and their underdrawing sketches are identical to today.
- [ ] At 16:00 the marginalia "THE PAGE BREATHES" prints once, and the ink edge begins its first 3 s inward slide to 4% of the safe area, reverses at the peak, and slides 3 s back — repeating every 6 s, drawn as a flat 6 u dark-ink band.
- [ ] While the edge is sliding in, standing between it and the crop boundary burns 4 HP/s; while it slides out the same position is safe; at rest there is no band and no burn.
- [ ] The crop-mark corners brighten toward full as the ink advances and dim back on the retreat.
- [ ] The Gutter band sweeps the breathing safe area and The Press's wall (once T0116 lands) tracks the same breathing rect; enemy spawns and their underdrawing sketches stay inside the breathing rect from 16:00 on.
- [ ] The pure tide module's unit tests pass: 0 inset before 960 s, peak 0.04 at 963 s, rest at 966 s, 6 s period after, burn only during the advancing phase; `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, inet-racing)

### Files
- create `src/core/tide.ts` - pure Tide schedule: `TIDE`, `TideState`, `tideAt(t)`, `tideSafeHalf(t)` (crop/gutter module pattern)
- create `src/systems/TideSystem.ts` - breathing ink-edge band, 4/s center burn, first-advancing marginalia
- create `tests/core/tide.test.ts` - unit tests in the crop/gutter test idiom
- edit `src/systems/CropSystem.ts` - crop-mark lineStyle alpha brightens with the tide (only line 48; margin strips + burn untouched)
- edit `src/systems/GutterSystem.ts` - `safeHalf()` returns `tideSafeHalf(run.timeSec)` so the band sweeps the breathing rect, clipped as today
- edit `src/systems/SpawnSystem.ts` - `pickSpawnPoint()` constrains the inner rect to the breathing rect from 16:00 on
- edit `src/scenes/GameScene.ts` - import, field, construct, update call, two invariants
- edit (only after T0116 lands) the Press wall module + `tests/core/press.test.ts` - wall safe-extent read switches to `tideSafeHalf(t)`

### Interfaces
```ts
// src/core/tide.ts
export const TIDE = {
  startSec: 960, periodSec: 6, slideSec: 3,
  peakInset: 0.04,   // per-side inset at peak, fraction of the crop-safe rect's FULL width (x) / height (y)
  bandWidthUnits: 6, burnPerSec: 4,
} as const;
export type TidePhase = 'rest' | 'advancing' | 'receding';
export interface TideState { inset: number; phase: TidePhase; burns: boolean }
export function tideAt(timeSec: number): TideState;  // p=(t-960)%6; inset=peakInset*min(p,6-p)/3; burns = (p>0 && p<3)
export function tideSafeHalf(timeSec: number): number; // (ARENA_SIZE/2) * cropSafeFraction(t) * (1 - 2 * inset)
// src/systems/TideSystem.ts
export class TideSystem {
  totalDamage = 0; bandVisible = false;
  constructor(scene: Phaser.Scene, run: RunState, player: Player, marginalia: Marginalia, damageNumbers: DamageNumbers);
  update(dt: number): void;
}
```
### Steps
1. `src/core/tide.ts` (new), per Interfaces. Half-open windows matching gutter: t<960 → `{inset:0, 'rest', false}`; p===0 → rest; 0<p<3 → advancing (burns); else receding. Imports: `ARENA_SIZE` from `../config`, `cropSafeFraction` from `./crop`.
2. `src/systems/TideSystem.ts` (new), modeled on `GutterSystem`: `scene.add.graphics().setDepth(DEPTH.floor + 3)` (above gutter band, below arena walls); clear each frame; `bandVisible = inset > 0`, early-return when false; draw 4 flat `PALETTE.ink` 0.85 strips of width `TIDE.bandWidthUnits` on the INSIDE of the breathing boundary (h = `tideSafeHalf(t)`, w = 6): `fillRect(-h,-h,2h,w)`, `(-h,h-w,2h,w)`, `(-h,-h,w,2h)`, `(h-w,-h,w,2h)`. On the first frame with `phase==='advancing'` print `marginalia.freeNote('THE PAGE BREATHES', player.x, player.y - 28)` once (`taught` flag; Player has no serial, so `freeNote` not `note`). Burn is the player's CENTER only: `(Math.abs(px)<=cropHalf && Math.abs(py)<=cropHalf) && (Math.abs(px)>h || Math.abs(py)>h)` with `cropHalf=(ARENA_SIZE/2)*cropSafeFraction(t)`; when `ph.burns && !run.isDead` → `totalDamage += run.drain(TIDE.burnPerSec*dt)` and `damageNumbers.show(px, py-24, TIDE.burnPerSec*0.5, false, true)` every 0.5 s (GutterSystem's numberTimer reset idiom).
3. `src/systems/CropSystem.ts`: import `TIDE, tideAt`; add `const MARK_REST = 0.45;` beside `MARK`; line 48 becomes `g.lineStyle(3, PALETTE.ink, markAlpha)` with `markAlpha = timeSec < TIDE.startSec ? 1 : MARK_REST + (1 - MARK_REST) * n*n*(3-2*n)` (n = `tideAt(t).inset / TIDE.peakInset`, smoothstep; full at the inward peak). Nothing else in the file changes.
4. `src/systems/GutterSystem.ts`: swap the `cropSafeFraction` import for `import { tideSafeHalf } from '../core/tide'`; `safeHalf()` → `return tideSafeHalf(this.run.timeSec);`; drop the now-unused `ARENA_SIZE` import; one-line doc-comment touch-up ("the breathing safe area from 16:00").
5. `src/systems/SpawnSystem.ts` `pickSpawnPoint()`: keep the ring math; replace the `inner` rect — if `this.run.timeSec >= TIDE.startSec`: `half = (ARENA_SIZE/2) * cropSafeFraction(timeSec + UNDERDRAW.leadSec) * (1 - 2*TIDE.peakInset)`, `inner = new Phaser.Geom.Rectangle(-half, -half, 2*half, 2*half)` (the most-inset breathing half over the whole 1.5 s lead: crop still shrinks until 17:00 and inset never exceeds peak, so a fixed spot and its sketch stay inside until landing); else today's bounds-minus-40 rect, byte-identical. The 8-attempt + clamp fallback is untouched. Add imports `TIDE`, `cropSafeFraction`, `ARENA_SIZE`.
6. `src/scenes/GameScene.ts`: add imports (`TideSystem`; `TIDE, tideSafeHalf` from `../core/tide`; `cropSafeFraction` from `../core/crop`); field `private tide!: TideSystem;` after `gutter` (line 71); construct right after line 126: `this.tide = new TideSystem(this, this.run, this.player, this.marginalia, this.damageNumbers)`; `this.tide.update(dt);` right after `this.gutter.update(dt)` (line 185); two invariants after `'gutter-band'` (line 418): `'tide-damage'` (totalDamage finite and ≥ 0) and `'tide-band'` (before 960 s `bandVisible` must be false; otherwise `tideSafeHalf` finite and ≤ crop-safe half + 1e-6).
7. After T0116 lands: in the Press wall module replace its safe-extent read `(ARENA_SIZE/2)*cropSafeFraction(t)` with `tideSafeHalf(t)` so wall progress is measured in fractions of the breathing rect; adjust `tests/core/press.test.ts` expectations.
### Pitfalls
- inset is per-side of the FULL width: `tideSafeHalf` multiplies by `(1 - 2*inset)` (0.92 at peak) — never drop the 2.
- The 6 u band is drawn INSIDE the breathing boundary; the burn ring is OUTSIDE it (`h < |coord| ≤ cropHalf`) — band and hazard sit on opposite sides of the ink edge, exactly per spec.
- Tide burn uses the circle CENTER only (no `PLAYER_RADIUS`); CropSystem's any-part-of-circle burn stays as is.
- Pre-16:00 must be byte-identical: `tideAt` returns rest/0, markAlpha stays 1, `pickSpawnPoint` keeps the old rect — verify no new code path runs before 960 s.
- The marks dim once from 1 → 0.45 at exactly 16:00 (the tide-start beat, alongside the note + band); the brighten/dim itself is smoothstep-eased, full at peak.
- `'rest'` is a measure-zero instant (p===0): the band hides there via the `inset > 0` check; tests assert `phase(966)='rest'`.
- Everything derives from `run.timeSec` per frame: pausing freezes mid-breath, resuming continues; fresh `TideSystem` per run, no listeners, so nothing to remove on shutdown.
### Tests
- `tests/core/tide.test.ts` (gutter.test.ts idiom): `toEqual(TIDE)`; rest before 960 (t ∈ {0, 720, 959.9}: inset 0, 'rest', burns false); `inset(963)` ≈ 0.04; `inset(966)` = 0 and phase 'rest'; linearity `inset(961.5)` ≈ 0.02; 6 s period (`inset(t)` ≈ `inset(t+6)` for t ∈ {961, 964.5, 967, 975.5}); continuity at 963 from both sides; non-negative sweep over [959, 1000]; burns only advancing (961 true, 963 false, 964.5 false, 966.5 true); `tideSafeHalf(959)` = crop-safe half and `tideSafeHalf(963)` ≈ `1600 * cropSafeFraction(963) * 0.92`.
- `npm run check` and `npm run smoke` (desktop + phone). Smoke reaches only pre-16:00 — that is exactly the identity guarantee it exercises; the invariants + unit tests cover the rest.

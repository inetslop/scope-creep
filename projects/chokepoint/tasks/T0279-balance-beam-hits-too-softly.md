---
id: T0279
title: "Balance: Beam hits too softly"
size: S
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-30T10:37:56Z
epic: E4
---

## Goal
Beam is far weaker than the other attack augments: a Beam-first tower does about a third of a Bolt's damage. Bring it up to the level of the other damage dealers while keeping its identity (steady, never missing), and trim its range a little as the counterweight.

## Details
- **Where it stands today** (Common, damage per second against one enemy, from `content/augments/*.ts`):

  | Augment | DPS | Range |
  |---|---|---|
  | Bolt | 19.2 | 2.6 |
  | Rapid | 20 | 2.2 |
  | Reach | 18.9 | 4.6 |
  | Splash | 15 | 1.7 (area) |
  | Lance | 13.3 | 2.6 (plus pierce) |
  | **Beam** | **6** | **4.5** |

- **New numbers:** 14 / 20 / 28 per second at Common / Rare / Epic (from 6 / 8 / 10), and range 4.5 → **3.5** as a counterweight to the much higher damage.
  - Beam never misses and never overkills, so it sits a little below a Bolt's 19.2 at Common, but it is no longer a third of one.
  - At 3.5 it still outranges Bolt (2.6) but no longer nearly matches Reach (4.6).
  - Update `first.range`, `first.beam.dps`, `tiers.*.beamDps` and the card lines ("Beams the furthest enemy: 14 per second, range 3.5." and so on). Reach added still multiplies the new base.
  - Each Bolt ray (T0130) follows the beam's own rate, so a Beam + Bolt tower goes from 12 to 28 per second at Common.
- **Check by playing as well as by numbers:** run a Beam-first and a Bolt-first opening through waves 1–10 with the smoke or sim harness. Both should hold wave 10 with similar leaks. If Beam is clearly ahead or behind, nudge its per-second numbers by at most about 15%, and record the final values and the reason in the result.
- **Spray is out of scope here.** The inbox task "Spray crits: the shotgun rolls for double damage" gives it a built-in 20% crit. Leave Spray's numbers alone until that has landed and been played.
- **Order with other Beam tasks:** these inbox tasks also edit Beam:
  - "Beam added is a damage boost, not another beam" changes `added`;
  - "Beam and burn deal damage in ticks" changes how the per-second rate is applied, not its value.

  This task only changes `first`, `tiers.*.beamDps` and the card lines. Whichever lands later rebases onto the others.
- Update every test that pins the old numbers: `tests/core/towerDps.test.ts` (beam 6/8/12/16/18/6.6/19.8) and any `tierStrength` expectations.

## Acceptance criteria
- [ ] A lone Beam deals 14 / 20 / 28 per second by tier with range 3.5, and its card, range ring and panel say so.
- [ ] In a waves 1–10 comparison, a Beam-first opening holds about as well as a Bolt-first one. The result notes the numbers seen and any nudge made.
- [ ] `npm run check` passes with the updated tests. Desktop 1280x720 and mobile 412x915 smoke pass.

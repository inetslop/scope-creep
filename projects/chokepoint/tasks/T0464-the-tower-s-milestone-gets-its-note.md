---
id: T0464
title: "The tower's milestone gets its note"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-03T02:24:38Z
claimed_at: 2026-11-03T02:31:28Z
finished_at: 2026-11-03T02:38:59Z
---

## Goal
The tower's milestone ring (T0270: a ring at a tower's base when its kills first cross 10, 25 and 50) is seen but not heard: one quiet two-note rise at the ring's pop, so a tower's own record is noticed where it stands.

## Details
- One note per crossing: when a tower's kills first cross 10, 25 or 50 — the same edge the ring pops on (the ring's path plays no sound today; if the architect finds one on that exact edge, the note joins it rather than doubling) — play one quiet two-note rise. A tower earns the note at most three times a run (its 10th, 25th and 50th kills); two towers crossing at the same moment each play their own note.
- The note is a short quiet rising two-sine in Sfx's softest class (the Leech sip's class, T0460, never above a kill blip): two 60 ms sine notes rising, ~30 ms apart, E4→G4 (330→392 Hz), 0.06 pre-master. A new method `towerMilestone()` in src/audio/Sfx.ts beside `leechDrink()`.
- The closest example is the Leech's drink note (src/systems/enemyHooks/leechDrinkNote.ts, T0460): a new file on the per-frame reconcile pattern — edge-triggered, silent otherwise — named `towerMilestoneNote.ts` in the towers' hook home; if the towers' note needs its own registry where the enemy hooks live, it is a new file wired the way src/systems/enemyHooks/index.ts wires the enemy hooks.
- It respects the pause's Sound toggle (Sfx.tone's existing mute check).
- No HUD, no chip, no text: sound only, like T0460 and T0419. Everything else byte-identical.

## Acceptance criteria
- [ ] A tower's 10th, 25th and 50th kills each play exactly one quiet two-note rise at the ring's pop; the 51st kill plays nothing and the ring is unchanged.
- [ ] A second tower crossing a milestone plays its own note.
- [ ] With the pause's Sound toggle off the milestone is silent.
- [ ] No sound, HUD element or visual is added anywhere else.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/towerMilestoneNote.ts` - per-run closure tracker that plays `sfx?.towerMilestone()` on the tower's 10th/25th/50th kill, the exact edge `killMilestone.ts` pops the ring on
- edit `src/systems/enemyHooks/index.ts` - one import line + one `ENEMY_HOOKS` line, both next to killMilestone's (import after line 44, array entry after `killMilestone,` line 83)
- edit `src/audio/Sfx.ts` - new `towerMilestone()` method directly under `leechDrink()` (after line 282)
### Interfaces
```ts
// enemyHooks/towerMilestoneNote.ts
export const towerMilestoneNote: MakeEnemyHook; // ({ sfx }) => ({ onKill })
// Sfx.ts, beside leechDrink()
/** A tower's own milestone heard at its base: one quiet two-note rise, E4 then G4 (330 then 392 Hz), 60 ms sines ~30 ms apart, 0.06 pre-master, the Leech sip's soft class. */
towerMilestone(): void
```
### Steps
1. Sfx.ts, directly under `leechDrink()`:
```ts
  /** A tower's own milestone heard at its base: one quiet two-note rise, E4 then G4 (330 then 392 Hz), 60 ms sines ~30 ms apart, 0.06 pre-master, the Leech sip's soft class. */
  towerMilestone(): void {
    this.tone(330, 0.06, 'sine', 0.06);
    this.tone(392, 0.06, 'sine', 0.06, undefined, 0.03);
  }
```
2. Create `src/systems/enemyHooks/towerMilestoneNote.ts` (mirror `killMilestone.ts` line-for-line, ring replaced by the note):
```ts
import type { Tower } from '../../entities/Tower';
import type { MakeEnemyHook } from './hook';

const MILESTONES = [10, 25, 50];

/**
 * A tower's own milestone is heard where it stands: at the same crossing the ring pops on
 * (systems/enemyHooks/killMilestone.ts) it plays one quiet two-note rise — at most one per
 * crossing, three per tower per run. The tracker lives in this closure, so it resets with
 * every new run, exactly like the ring's.
 */
export const towerMilestoneNote: MakeEnemyHook = ({ sfx }) => {
  const seen = new Map<Tower, number>(); // last checked kill count per tower
  return {
    onKill({ source }) {
      if (!source) return;
      const n = source.kills + 1; // EnemySystem counts this kill into source right after the hooks run
      const prev = seen.get(source) ?? 0;
      seen.set(source, n);
      for (const m of MILESTONES) {
        if (prev < m && m <= n) sfx?.towerMilestone();
      }
    },
  };
};
```
3. `index.ts`: `import { towerMilestoneNote } from './towerMilestoneNote';` after the `killMilestone` import; `towerMilestoneNote,` after `killMilestone,` in `ENEMY_HOOKS`.
### Pitfalls
- Copy the edge verbatim from killMilestone (`source.kills + 1`, `prev < m && m <= n`): any drift plays the note one kill early/late or on the 51st.
- The second `tone` needs `undefined` in the `slideTo` slot before `delaySec`; the mute check is already in `Sfx.tone` (the pause Sound toggle is honored, no held oscillators to stop).
- Do not touch `killMilestone.ts` or `leechDrink*`; no shared state with the ring hook — each hook owns its closure, and EnemySystem builds a fresh hook per run.
- Two towers crossing the same frame each get their own `onKill`, so each plays its own note; per-tower `Map` is what keeps them apart.
### Tests
none

## Result (attempt 1, yoga)

The tower's milestone is now heard where it stands: a new `towerMilestoneNote` enemy hook plays one quiet two-note rise (`sfx.towerMilestone()`, E4→G4, 330→392 Hz, 60 ms sines ~30 ms apart, 0.06 pre-master) at the same exact edge the ring pops on — when a tower's kills first cross 10, 25 or 50. The tracker lives in the hook's closure (fresh each run), so a tower earns the note at most three times per run and a second tower crossing at the same moment plays its own; the pause's Sound toggle is honored by `Sfx.tone`'s existing mute check. The ring itself, and everything else, is byte-identical. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 7.5 min

```
projects/chokepoint/game/src/audio/Sfx.ts          |  6 ++++++
 .../game/src/systems/enemyHooks/index.ts           |  2 ++
 .../src/systems/enemyHooks/towerMilestoneNote.ts   | 25 ++++++++++++++++++++++
 3 files changed, 33 insertions(+)
```

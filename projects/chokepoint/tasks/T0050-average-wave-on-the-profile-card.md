---
id: T0050
title: Average wave on the profile card
assignee: desktop
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T12:34:55Z
claimed_at: 2026-10-28T13:07:55Z
epic: E1
---

## Goal
The profile card shows where the player usually lands, not just where they got lucky: the runs line gains an average.

## Details
- The menu profile card (T0007) shows a muted "runs N" line, N the total runs played.
- That line becomes "runs N · avg M", where M is the floor of the mean of the waves of the last up-to-4 finished runs (the recent list from T0018).
- With zero runs the line stays "runs 0" (no avg part); with fewer than four runs, M averages the runs that exist.
- The line keeps its current size and color, the card keeps its size and position, and the line never wraps.
- Example: recent waves 4, 9, 6, 12 and 17 runs played → "runs 17 · avg 8".

## Acceptance criteria
- [ ] With at least one finished run saved, the profile card's runs line reads "runs N · avg M", M the floor of the mean of the saved recent runs' waves.
- [ ] On a fresh device with no runs the line reads exactly "runs 0".
- [ ] The card keeps its size and position and the line stays on one line at 412x915 and 1280x720.

## Design (architect, yoga)

### Files
- edit `src/scenes/menu/ProfileCard.ts` - the card's muted runs line gains " · avg M" (the floor of the mean of the `profile.recent` waves)

### Interfaces
No exported changes. Add one private function above `buildProfileCard`:
```ts
function runsText(profile: Profile): string {
  if (!profile.recent.length) return `runs ${profile.runsPlayed}`;
  let sum = 0;
  for (const r of profile.recent) sum += r.wave;
  return `runs ${profile.runsPlayed} · avg ${Math.floor(sum / profile.recent.length)}`;
}
```
(`Profile` is already imported at the top of the file; `profile.recent` is the T0018 recent list, capped at 4 entries.)

### Steps
1. In `src/scenes/menu/ProfileCard.ts` only: add `runsText` exactly as above, then replace line 24 `const runs = scene.add.text(0, 24, `Runs ${profile.runsPlayed}`, textStyle(17, PALETTE.muted)).setOrigin(0.5);` with `const runs = scene.add.text(0, 24, runsText(profile), textStyle(17, PALETTE.muted)).setOrigin(0.5);`. No other line in the file changes.
2. `npm run check` and `npm run smoke` must pass.

### Pitfalls
- The task's worked example is off by one: waves 4, 9, 6, 12 mean 7.75, floor = **7**, not "8". Details and acceptance criterion both say floor — implement floor; never switch to `Math.round` to chase the example.
- The avg part appears iff `profile.recent.length > 0`, not iff `runsPlayed > 0`: broken storage can hold runs 5 with an empty recent list, and the line must then read exactly "runs 5".
- Lowercase "runs" is intentional: the acceptance says a fresh device reads exactly "runs 0"; the old text is "Runs N" — do not keep the capital R.
- Keep `textStyle(17, PALETTE.muted)`, position (0, 24), origin 0.5: card stays 300x124 at its spot; `textStyle` sets no `wordWrap`, so the line cannot wrap; the worst-case string is well inside the 300 px card at 412x915 (card scale `Math.min(1, (412-32)/300)` = 1) and 1280x720.
- Do NOT touch `src/core/profile.ts` or `tests/core/profile.test.ts` (open tasks T0035 and T0042 both edit them): the formula stays in the card file, which no other open task touches. No Math.random, no listeners, no pooling — nothing to clean up.
### Tests
none

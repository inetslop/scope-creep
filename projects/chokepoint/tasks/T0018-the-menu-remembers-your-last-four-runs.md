---
id: T0018
title: The menu remembers your last four runs
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-28T03:39:38Z
claimed_at: 2026-10-28T08:30:17Z
finished_at: 2026-10-28T08:36:27Z
epic: E1
---

## Goal
After a few runs, the menu should show your recent runs and what they paid out, so you can see you are progressing run to run.

## Details
- The saved profile (T0001) gains a small list of the four most recent finished runs, most recent first, each storing the run's wave and its coins. When a run ends, the new run is prepended to the list and the list is capped at 4. The existing profile fields (best wave, total coins, last run) are unchanged.
- Under the profile card on the menu, add one small line: the word "Recent" followed by up to 4 entries, each "W<wave> +<coins>", most recent first, separated by " · ". For example: `Recent  W12 +9 · W8 +6 · W5 +4 · W9 +7`.
- The line is a separate menu element (not inside the profile card), in small muted-gray text (~12 px) matching the menu's existing secondary lines. It is a text line, not a card, so its layout impact is minimal.
- If the player has fewer than 4 finished runs, show only those; if they have none, show no line at all.
- The line must fit the menu at 412x915 and 1280x720. At 412 px wide it may wrap to a second line if needed, but it must not push the other menu elements (title, profile card, how-to, Play) out of place.

## Acceptance criteria
- [ ] After 3 finished runs, the menu shows a "Recent" line with exactly 3 entries, most recent first, each with the correct wave and coin values.
- [ ] After 5 finished runs, only the most recent 4 are shown.
- [ ] A fresh profile (no runs) shows no "Recent" line.
- [ ] The line fits at 412x915 and 1280x720 without breaking the menu layout.
- [ ] The profile's existing best wave, total coins, and last-run line are unchanged and still display correctly.

## Design (architect, desktop)

### Files
- edit `src/core/profile.ts` - add `recent` list to `Profile`; parse it in `loadProfile`; prepend + cap in `recordRun`
- edit `tests/core/profile.test.ts` - existing `toEqual` expectations gain `recent`; new tests for order, cap, and corrupt data
- edit `src/scenes/MenuScene.ts` - one new text element ("Recent" line) under the profile card

### Interfaces
Only `Profile` changes (no signature changes):
```ts
export interface Profile {
  bestWave: number;
  runsPlayed: number;
  coins: number;
  lastRun: { wave: number; coins: number } | null;
  recent: { wave: number; coins: number }[]; // most recent first, at most 4
}
```

### Steps
1. `src/core/profile.ts`:
   - Line 1 comment: "best wave, runs played, coins, and the four most recent runs."
   - In `Profile`, after `lastRun`: `recent: { wave: number; coins: number }[];`
   - In `loadProfile`, after the `lastRun` const:
     ```ts
     const recent = Array.isArray(parsed.recent)
       ? parsed.recent
           .filter((r) => !!r && typeof r === 'object' && Number.isFinite(r.wave) && r.wave >= 0 && Number.isFinite(r.coins) && r.coins >= 0)
           .slice(0, 4)
           .map((r) => ({ wave: Number(r.wave), coins: Number(r.coins) }))
       : [];
     ```
     Add `recent,` after `lastRun,` in both return objects.
   - In `recordRun`'s profile object, after `lastRun`: `recent: [{ wave: result.waves, coins }, ...old.recent].slice(0, 4),`
2. `tests/core/profile.test.ts`: add `recent: []` to the two "empty/broken" expectations; in the two `recordRun` tests add `recent: [{ wave: 5, coins: 11 }]` (first) and `recent: [{ wave: 3, coins: 5 }, { wave: 5, coins: 11 }]` (second); in the zero-wave test add `recent: [{ wave: 0, coins: 0 }]`. Add:
   ```ts
   it('keeps the four most recent runs, newest first', () => {
     const store = memory();
     for (const waves of [5, 3, 8, 2, 9]) recordRun(store, { waves, stopped: 0, clean: 0 });
     expect(loadProfile(store).recent).toEqual([
       { wave: 9, coins: 9 },
       { wave: 2, coins: 2 },
       { wave: 8, coins: 8 },
       { wave: 3, coins: 3 },
     ]);
   });
   ```
   and, in the broken-storage test: `store.setItem('chokepoint:profile', JSON.stringify({ recent: [{ wave: 7, coins: 2 }, null, { wave: 1, coins: -4 }] })); expect(loadProfile(store).recent).toEqual([{ wave: 7, coins: 2 }]);`
3. `src/scenes/MenuScene.ts`:
   - Import line 14 becomes: `import { buildProfileCard, PROFILE_CARD_H, PROFILE_CARD_W } from './menu/ProfileCard';`
   - After `const profileCard = buildProfileCard(this, p);` (line 62):
     ```ts
     const recent = p.recent.length
       ? this.add
           .text(0, 0, `Recent  ${p.recent.map((r) => `W${r.wave} +${r.coins}`).join(' · ')}`, textStyle(12, PALETTE.muted, { wordWrap: { width: 380 } }))
           .setOrigin(0.5)
       : null;
     ```
   - After the entrance-tween for-loop (line 72):
     ```ts
     if (recent) {
       recent.setAlpha(0);
       this.tweens.add({ targets: recent, alpha: 1, duration: 400, delay: 460 });
     }
     ```
   - In `layout()`, after `how.setPosition(cx, y + 213).setScale(textScale);` (line 86):
     ```ts
     if (recent) recent.setPosition(cx, y + 104 + (PROFILE_CARD_H / 2) * Math.min(1, (width - 32) / PROFILE_CARD_W) + 7);
     ```
   - Do not change the existing `profileCard`/`how`/`button`/`hint` lines or the tween loop array (the loop's index sets each delay).

### Pitfalls
- All five existing `toEqual` profile expectations fail without `recent` — update every one, or `npm run check` fails.
- `recordRun` is the only place runs are folded (called in `GameOverScene.create()`); do not touch `GameOverScene` — T0003 owns it.
- The line is a standalone scene text, NOT a child of the profile-card container, and must be placed in `layout()` so it follows resizes; `layout()` runs once in `create()`, so no (0,0) flash.
- 7 px below the card's scaled bottom edge is deliberate: the card→how-to gap is only ~10–14 px; measuring from the card (not `how.height`) keeps it deterministic across fonts. `wordWrap: 380` means the (unreachable) 2-line case degrades to a mild overlap instead of horizontal overflow.
- Pre-existing saved profiles lack `recent` → `loadProfile` yields `[]` → no line, so old users are unaffected until their next finished run.
- No invariant needed: the profile is stored data, not run state; the cap/order rule is covered by the unit test.

### Tests
- `tests/core/profile.test.ts` updated as above (the prepend/cap rule is core logic a later change could silently break).

## Result (attempt 1, desktop)

The saved profile now keeps the four most recent finished runs (most recent first, capped at 4) — `recent` was added to `Profile` in src/core/profile.ts, parsed defensively in `loadProfile`, and prepended/capped in `recordRun`. The menu shows a small muted "Recent  W12 +9 · W8 +6 …" line under the profile card when there are finished runs (src/scenes/MenuScene.ts), fading in with the other entrance tweens and repositioned on resize. Unit tests cover the new field in every existing expectation plus order, cap, and corrupt-data cases. `npm run check` and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 6.2 min

```
projects/chokepoint/game/src/core/profile.ts       | 13 ++++++++++--
 projects/chokepoint/game/src/scenes/MenuScene.ts   | 12 ++++++++++-
 .../chokepoint/game/tests/core/profile.test.ts     | 23 +++++++++++++++++-----
 3 files changed, 40 insertions(+), 8 deletions(-)
```

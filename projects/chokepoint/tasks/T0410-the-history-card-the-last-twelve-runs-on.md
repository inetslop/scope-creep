---
id: T0410
title: "The history card: the last twelve runs, on the menu"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T06:19:02Z
claimed_at: 2026-11-02T07:43:56Z
finished_at: 2026-11-02T08:25:10Z
epic: E18
---

## Goal
The menu shows the last four runs at a glance; a History card lists the last twelve, so the whole climb is one tap away — and the profile card's last-four line moves into it, so the same runs are shown once, not twice.

## Details
- The menu's button row (the row Tech and How live in) gains a third button, "History", in the Tech/How buttons' own style and size, added to the menu's fit-sum so the column still fits at 412x915 and 1280x720 without scrolling.
- Its card: a white card in the How card's language (one centered card over the dimmed demo), titled "History", with back to the menu the How card's own way.
- One row per run, most recent first, up to twelve: "Wave N · +X coins" in the recent line's own muted style (T0018). An Iron run's row wears one small muted "iron" mark (the Iron line's own language, T0249). Any row that reached the saved best wave wears the small yellow star (the profile card's own star, T0016 — several rows may wear it, the recent line's own rule, T0037).
- One in, one out: the profile card's last-four "recent" line and its stars move into the history card and are removed from the profile card — the same four runs are not shown in two places. The profile card keeps its coins, its best wave + star, and its runs · avg wave line, with the avg keeping its own last-four rule (T0050).
- The profile stores the last twelve finished runs, most recent first, capped at twelve (T0018's store grows from four to twelve); older saves with fewer runs load as-is. The rows read the stored entries — wave, coins and the mode — never recomputed.
- A storm run, when the storm lands (T0403), wears a muted "storm" mark the same way; this task only needs the mark's spot to be its own.
- The Play and Iron cards, the demo, the Tech and How buttons, the claim and game-over cards are unchanged.

## Acceptance criteria
- [ ] The menu shows a "History" button beside Tech and How; tapping it opens the History card over the dimmed demo, and back returns to the menu the How card's own way.
- [ ] The card lists up to the last twelve finished runs, most recent first: "Wave N · +X coins"; Iron runs wear the muted "iron" mark; any run that reached the saved best wave wears the yellow star.
- [ ] The profile card's last-four recent line is gone; its coins, best wave + star and runs · avg wave line remain with unchanged values.
- [ ] Finishing a thirteenth run drops the oldest: the profile stores at most twelve; a save with fewer runs loads as-is.
- [ ] The menu column still fits at 412x915 and 1280x720 without scrolling; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, inet-racing)

### Files
- create `src/scenes/HistoryScene.ts` — the History overlay card, modeled line-for-line on `src/scenes/HowScene.ts` (shade, centered card, close back to the menu, smoke auto-close).
- edit `src/core/profile.ts` — `recent` entries gain `mode`, the cap grows 4 → 12 (one constant, used in `loadProfile` and `recordRun`).
- edit `src/scenes/menu/ProfileCard.ts` — remove the recent line; the avg keeps its last-four rule.
- delete `src/scenes/menu/RecentLine.ts` — only ProfileCard used it; its star rule moves into HistoryScene.
- edit `src/scenes/MenuScene.ts` — the History button, its fit line, its layout line, its fadeIn entry.
- edit `src/scenes/keys.ts` — `history: 'History'` in `SCENES`, on the line after `how`.
- edit `src/main.ts` — import `HistoryScene` and add it to the `scene:` list right after `HowScene`.
- edit `tests/core/profile.test.ts` — the cap test 4 → 12, plus mode and old-save tests.
### Interfaces
```ts
// src/core/profile.ts (replace the inline { wave; coins } shape)
export interface RecentRun {
  wave: number;
  coins: number;
  /** This run's mode; the storm takes its own mark line in the same slot when it lands (T0403). */
  mode?: 'iron';
}
export const RECENT_CAP = 12;
// Profile.recent: RecentRun[]   (recordRun writes mode: result.mul === 2 ? 'iron' : undefined)
```
### Steps
1. `core/profile.ts`: add `RecentRun` above `Profile`, change line 19 to `recent: RecentRun[];`, add `RECENT_CAP` near `PROFILE_KEY`. In `loadProfile`, `.slice(0, 4)` → `.slice(0, RECENT_CAP)` and map to `{ wave: Number(r.wave), coins: Number(r.coins), mode: r.mode === 'iron' ? 'iron' : undefined }` (a missing or broken `mode` loads as none — older saves load as-is). In `recordRun`, line 147 → `recent: [{ wave: result.waves, coins, mode: result.mul === 2 ? 'iron' : undefined }, ...old.recent].slice(0, RECENT_CAP),`.
2. `ProfileCard.ts`: drop the `buildRecentLine` import, the `recent`/`h4` locals, the `recent` branch of the `if (recent)` block, and `recent.container` from `kids`; `gaps` becomes `2 + (iron ? 1 : 0)` and `height` drops `h4`. In `runsText`, compute over `const last4 = profile.recent.slice(0, 4);` (`if (last4.length >= 2)`, average `last4`) — the avg's last-four rule (T0050) is unchanged while `recent` can hold twelve.
3. Delete `RecentLine.ts`.
4. `keys.ts`: add `history: 'History',` after the `how:` line. `main.ts`: `import { HistoryScene } from './scenes/HistoryScene';` (after the HowScene import) and insert `HistoryScene` in the `scene:` array right after `HowScene`.
5. `HistoryScene.ts` (copy HowScene's shape; no wrap, no pointer line): constants `W = 340`, `PAD = 20`, `TOP = 36`, `GAP_TL = 42`, `LINE_H = 20`, `BOTTOM = 22`. `create()`: `uiCamera(this)`, `hook.overlay = SCENES.history`, shade `PALETTE.ground` 0.78 with `pointerdown` → `close` (same as HowScene lines 43-45). `const p = loadProfile(window.localStorage); const rows = p.recent;` `style = textStyle(12, PALETTE.muted)` (the recent line's own style). `panelH = TOP + GAP_TL + rows.length * LINE_H + BOTTOM`; `card = makeCard(this, 0, 0, W, panelH, 28)`, `card.setInteractive()`; title `'History'`, `titleStyle(32)` at `-panelH / 2 + TOP`. Rows: `let y = -panelH / 2 + TOP + GAP_TL;` per entry: `line = this.add.text(-W / 2 + PAD, y, `Wave ${r.wave} · +${r.coins} coins`, style)`; then the mark slot at `let x = -W / 2 + PAD + line.width;` — `if (r.mode === 'iron')` push `this.add.text(x + 8, y, 'Iron', textStyle(12, PALETTE.muted, { fontStyle: 'bold' }))` (the claim card's iron tag, RewardsScene's own language) and `x += mark.width;`; then `if (r.wave === p.bestWave)` push `artScale(this.add.image(x + 13, y + line.height / 2 + 1, STAR_TEXTURE))` (the recent line's star rule, T0037 — several rows may wear it); `y += LINE_H`. `box` container `setDepth(2)`; `layout` and `onResize` exactly as HowScene lines 65-72; `close` exactly as HowScene's (guard, `hook.overlay = ''`, `this.scene.start(SCENES.menu)`); `if (flags.smoke) this.time.delayedCall(800, this.close);` like HowScene line 74.
6. `MenuScene.ts`: after the `howRow` button (line 138) add `const history = p.recent.length ? makeButton(this, 0, 0, 'History', () => { this.scene.launch(SCENES.history); this.scene.pause(); }, { width: 220, height: 60, fontSize: 24, radius: 30 }) : undefined;` (no runs yet: no button, same as resume/boards/ghost). In the fadeIn list push `history.container` after `howRow.container` (guarded). In `layout`'s fit sum, after line 184 add `if (history) below += GAP + BUTTON_H;` and in the placement after lines 242-243 add the guarded `gap(GAP); history.container.setScale(s); history.container.setPosition(cx, put(BUTTON_H));` block. Nothing else moves — the existing `s` scaling keeps the column fitting at 412x915 (fullest state: resume, boards, ghost, and History all present, ~1300 px below, scaled by `s` exactly like today's ~1130 px).
7. Tests: rename 'keeps the four most recent runs' to twelve — loop 14 waves, expect the last twelve `{ wave, coins }` (toEqual ignores the `mode: undefined` entries); add one test that `recordRun` with `mul: 2` stores `recent[0]` with `mode: 'iron'` while a following normal run's entry has none; add one test that a stored save of 13 entries loads capped to 12 and a save of 3 old-shape entries loads as-is.
### Pitfalls
- Old saves: entries without `mode` must load as-is (normal rows) — the `r.mode === 'iron'` check, never a truthy cast; never rewrite stored data on load.
- `recent` now holds twelve, so anything still reading `profile.recent` for a last-four meaning must `slice(0, 4)` — only `runsText` does; the profile card's recent line is deleted, not truncated.
- Delete `RecentLine.ts` only after ProfileCard no longer imports it (lint fails on the dead import).
- MenuScene: the History fit line and placement line must both be guarded by `if (history)` in the same order, or the column offsets shift when the button is absent.
- HistoryScene: rows are top-anchored text (origin 0,0) unlike RecentLine's centered texts — the star's y is `y + line.height / 2 + 1`, not `y + 1`.
- Fullest row "Wave 999 · +99999 coins Iron ★" is ~180 px at 12 px font, well inside `W - PAD * 2 = 300`; card is 340 px tall at twelve rows, fitting both 412x915 and 1280x720 at scale 1.
### Tests
- `tests/core/profile.test.ts` as in step 7 (cap, iron mode, old-save loading).

## Result (attempt 1, inet-racing)

The menu's button row gains a "History" button (shown once there's a run to list, in Tech/How's own style and added to the fit-sum so the column still scales into 412x915 and 1280x720); tapping it opens a new History card (scenes/HistoryScene.ts, the How card's own language: white card over the dimmed demo, tap to close back) listing the last twelve finished runs, most recent first, as "Wave N · +X coins" in the recent line's muted style, with the muted "Iron" mark on Iron rows and the yellow star on any row at the saved best wave. The profile store (core/profile.ts) now keeps twelve runs (RECENT_CAP) with each entry's mode, old saves load as-is, and the profile card's last-four "Recent" line and its stars are gone (RecentLine.ts deleted) while its coins, best wave + star and runs · avg wave line keep their values, the avg still over the last four. Tests cover the twelve-run cap, the stored iron mode, and old-save loading.

- Self-review: APPROVE
- Time: 41.3 min
- Deleted src/scenes/menu/RecentLine.ts, as the agent asked.

```
projects/chokepoint/game/src/core/profile.ts       | 22 ++++--
 projects/chokepoint/game/src/main.ts               |  3 +-
 .../chokepoint/game/src/scenes/HistoryScene.ts     | 87 ++++++++++++++++++++++
 projects/chokepoint/game/src/scenes/MenuScene.ts   | 12 +++
 projects/chokepoint/game/src/scenes/keys.ts        |  1 +
 .../chokepoint/game/src/scenes/menu/ProfileCard.ts | 30 +++-----
 .../chokepoint/game/src/scenes/menu/RecentLine.ts  | 42 -----------
 .../chokepoint/game/tests/core/profile.test.ts     | 36 ++++++++-
 8 files changed, 162 insertions(+), 71 deletions(-)
```

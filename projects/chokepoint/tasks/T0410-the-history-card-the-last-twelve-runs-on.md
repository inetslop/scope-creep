---
id: T0410
title: "The history card: the last twelve runs, on the menu"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T06:19:02Z
claimed_at: 2026-11-02T07:28:33Z
epic: E18
designer: inet-racing
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

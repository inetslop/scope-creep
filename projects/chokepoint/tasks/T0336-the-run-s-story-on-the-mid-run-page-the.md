---
id: T0336
title: "The run's story on the mid-run page: the pause's Summary"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T03:39:37Z
epic: E12
---

## Goal
E12's second slice: the run's shape is visible while the run is happening — the claim card's story (T0333) re-used on the pause's Summary page (T0306), so a player can look back at which waves were clean, which were held and which hurt most without ending the run.

## Details
- **Where:** the pause's Summary page (T0306's scene): a new "Story" section under the page's run reads and above the by-tower rows. The section is absent while the page reads "Ready" (before wave 1).
- **The marks:** one small mark per wave faced so far, in a wrapping row — the claim card's story marks (T0333), the same shape, size and colors: green for a clean wave, muted gray for a held wave. No red mark mid-run (the death wave's mark lives on the claim card only). The muted legend beside the row is T0333's own.
- **The loudest line:** one muted line under the marks — the run's loudest wave so far, T0333's own line ("loudest · wave N · M leaks") — shown only when at least one wave has been held; hidden while every wave so far is clean.
- **The data:** read the run's per-wave record (T0333's ledger field, written as each wave ends and carried through the resume save) — no new run or save field; a resumed run shows its whole story so far, a fresh run starts empty.
- **Nothing shown twice:** the wave card's "held · N" chip is the latest held wave only (transient), and the exit's clean chip is the current streak — the whole run's shape so far is on no other screen mid-run. Nothing on the section repeats the pause's own run line.
- No sound, no input, no marks on the board or the HUD: one section in the page's own card, which grows its height for it and keeps its scale-to-fit (the references' fit, T0329's pattern) at 412x915 and 1280x720.

## Acceptance criteria
- [ ] From wave 1 on, the pause's Summary page shows the "Story" section: one mark per wave faced (green clean, muted-gray held) in a wrapping row with T0333's legend, and the loudest-wave line when any wave has been held; before wave 1 the section is absent.
- [ ] The marks and the line agree with the claim card's story for the same run (same colors, and the same loudest wave at the run's end); a resumed run shows its whole story so far; no red mark ever appears on the page.
- [ ] Nothing on the section repeats the pause's run line, the wave card's held chip or the exit's clean chip; no new run or save field; the card fits at 412x915 and 1280x720; typecheck, lint, unit tests and the desktop/mobile smoke pass.

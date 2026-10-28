---
id: T0060
title: "Last stand banner: the card that teaches the rule"
size: S
priority: 3
status: design
depends_on: [T0054]
attempts: 0
created: 2026-10-28T13:29:40Z
epic: E1
---

## Goal
The moment a run drops to one life, a small white card slides in at the top — "Last stand · kills pay double" — so T0054's rule is taught where it triggers, not just seen as a red number.

## Details
- Every time a leak brings the run's lives to exactly 1 — the moment T0054's last stand turns on — a small white rounded card (~220 px wide, the same card look and type as the HUD) slides in from above at the top-center of the screen, holds, and fades out: ~1.5 s total (~200 ms in, ~300 ms out).
- Two centered lines: "Last stand" in bold ink, muted "kills pay double" below it.
- It shows on every re-entry into the state: a later leak back to 1 (after T0045's streak paid a life back) shows it again. It never shows when lives are 2 or more.
- Top-center sits clear of the stats card; the card is transient — it never blocks the board or input, and it is not a control (no pause-screen row).
- Closest existing: the green "Clean" chip's pop and fade (T0005) — a transient that announces a state where it happens. The wave-banner idea (IDEAS) will reuse this slide-and-fade pattern later.
- No sound, no new key, no change to T0054's red lives number or its wave-start pulse.

## Acceptance criteria
- [ ] A leak that brings lives to exactly 1 shows the top-center white card — "Last stand" bold, muted "kills pay double" below — sliding in from above and fading out after ~1.5 s.
- [ ] A later leak back to 1 (after the streak's +1 life) shows it again; a leak that leaves lives at 2 or more shows nothing.
- [ ] The card blocks nothing and takes no input; the red lives number, the wave-start pulse, the double-gold rule and all sounds are unchanged.
- [ ] Fits 412x915 and 1280x720 (top-center, clear of the stats card).

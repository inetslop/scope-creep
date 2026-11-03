---
id: T0487
title: "The memory's teach: the first leakers that come back say why"
size: S
priority: 2
status: design
depends_on: [T0473]
attempts: 0
created: 2026-11-03T10:07:19Z
epic: E27
---

## Goal
The moment the road first remembers — a build phase whose next wave carries leakers that came back — the player learns, once, that what leaked comes back (Pillar 8), at the exact moment the rule fires.

## Details
- On the run's first build phase in which the next plan carries a remembered addition (T0473's rule grew the plan), one white chip appears directly under the next-wave preview card (above the round button): "come back: <Type>" for each type that comes back in that wave, in the order the plan carries them, with " ×n" only for n ≥ 2 (so a doubled type reads "Hauler ×2"; a wave with two single types reads "come back: Dot, Ward"). Bold 12 px muted ink on a rounded white chip — the first-leak chip's look (T0107) with the name chip's text style (T0085). It pops in, holds ~1.5 s, fades, and never shows again: the run's one-time-teach flag pattern (T0431's shape — a run-scoped flag set on show, carried by the run save, so a resumed run never re-teaches).
- The types and counts to name are the additions the next plan carries, read from the rule T0473's module computes — the HUD never re-derives the leak record itself, and the chip never shows when the plan carries no additions.
- In a Blind run (the level whose build hides the preview) the chip never shows at all — its text would name what the level hides.
- It lives in its own small file (the T0431 BankTell shape: one HUD part file, one import and one part line in the HUD scene, one run flag and its save lines) so no existing card's layout changes. No sound, no key, no button, no permanent mark.
- It fits: the longest line is "come back: Hauler ×2, Dot, Ward" (the 3-walker cap), under the preview card's width at 412x915 and 1280x720.

## Acceptance criteria
- [ ] In a run whose just-ended wave leaked, the next build phase shows the chip under the preview once for ~1.5 s naming each type that comes back (×n for n ≥ 2), then it never shows again — not in that run, not after a resume, not in later runs.
- [ ] The chip does not show when the next plan carries no additions, in a Blind run, or when the flag is already set.
- [ ] It adds no sound, no key, no button and no permanent mark; a run with no leaks is unchanged.

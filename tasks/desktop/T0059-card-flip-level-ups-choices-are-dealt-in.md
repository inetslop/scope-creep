---
id: T0059
title: Card-flip level-ups — choices are dealt in like cards
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T02:15:10Z
claimed_at: 2026-10-27T02:39:45Z
designer: desktop
---

## Goal
Level-up choices are no longer three cards that pop into existence: they are dealt in one by one with a card flip, so every level-up lands as a small moment instead of a menu.

## Details
- When the LevelUp scene opens, the three choice cards start face-down: a plain card back — a flat ink rectangle with a thick paper-light border, same size as the finished card, with no name, description, color band or level pips.
- The deal: card 1 begins flipping at 0 ms, card 2 at +150 ms, card 3 at +300 ms. Each flip takes 200 ms (a scale-x from 0 to 1, with the face visible from the flip's midpoint on). Each card's flip plays one short card-flip SFX — a snappy tick plus a soft thump, ~120 ms, built from the existing Sfx primitives, with its own throttle so it can never overlap itself.
- The last flip finishes at ~500 ms. Until that moment, pointer/tap input and the 1/2/3 keys are ignored for card selection. No skip button — the deal is half a second.
- Card faces are unchanged: same name, description, color band, level pips, and the same hover/tap/keyboard selection behavior as today once the deal is done. The run stays paused behind the cards exactly as it does now.

## Acceptance criteria
- [ ] On every level-up the three cards flip in sequence (150 ms apart) with one flip SFX per card, and the whole deal finishes in under 0.7 s.
- [ ] Tapping a card or pressing 1/2/3 during the deal selects nothing; once the deal is done, selecting behaves exactly as before.
- [ ] The finished card faces are identical to today (name, description, color, level pips) and the face-down state never lingers on screen.
- [ ] The run remains paused during and after the deal, as before.
- [ ] `npm run check` and `npm run smoke` pass.

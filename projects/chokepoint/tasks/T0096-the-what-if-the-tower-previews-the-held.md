---
id: T0096
title: "The what-if: the tower previews the held augment before the gold is spent"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T02:00:38Z
claimed_at: 2026-10-29T02:21:14Z
epic: E4
designer: cachyos-x8664
---

## Goal
The decision is visible before it is paid for: while a hand card is selected, a tower with a free slot shows what it would become with that augment — the new barrel, ring or tick, and the new reach where the reach changes — before the gold is spent.

## Details
- No new input: the hand's existing pick state (the tapped card that commits to a tower or an empty cell on tap) drives the preview; the same pick, the same commit.
- Desktop (hover): while a hand card is selected and the pointer is over a tower with at least one free slot, that tower shows a ghost of the result:
  - The marker the augment would add — the same look towerLook already paints for that augment in a tower (the barrel, ring or tick, in the augment's own color) — at the tower's next free slot position, at ~50% alpha, wearing the card's tier pip, so the rarity is seen in the preview too (E4's rule: rarity shows everywhere an augment appears).
  - Where the held augment changes the tower's shown range — an added Reach (+35% range per copy), an added Pulse (+0.5 cells per copy) — the tower's range ring previews the new reach: the same ring at the new radius, ~50% alpha. Where the held augment changes no range, the ring is untouched.
  - The ghost clears the moment the pointer leaves the tower, the card is committed, or the pick is canceled (the card tapped again).
- Mobile (no hover): while a hand card is selected, every tower with a free slot shows the ghost marker at its next free slot (the augment's own color, the card's tier pip, ~50% alpha) — no range ring, to keep the board quiet. Tapping a tower commits the card as today and clears every ghost.
- A tower with no free slot never shows a ghost, whatever card is held — "buy a slot first" stays the buy button's job.
- The ghost is display-only: it changes no damage, gold, targeting or timer; nothing is spent until the commit, and the committed augment renders exactly as it does today.
- No new sound (the pick is silent; the commit keeps its existing chime, T0088's if landed), no new key or button, no pause-screen line.

## Acceptance criteria
- [ ] On desktop, with a hand card selected, hovering a tower with a free slot shows the held augment's marker ghost (its own color, the card's tier pip, ~50% alpha) at the tower's next free slot; leaving the tower, committing, or canceling the pick clears it.
- [ ] With an added Reach or an added Pulse held, the hovered tower's range ring previews the new radius at ~50% alpha; with a card that changes no range, the ring is untouched.
- [ ] At 412×915 and 1280×720, with a hand card selected, every tower with a free slot shows the ghost marker (no range ring on mobile), and tapping a tower commits the card as today and clears the ghosts.
- [ ] A tower with no free slot never shows a ghost, whatever card is held.
- [ ] The ghost changes nothing measurable — gold, damage, targeting, cooldowns and the wave all behave exactly as today, and the committed augment renders identically to before this change.
- [ ] No new sound, key or button; the pause screen is unchanged.

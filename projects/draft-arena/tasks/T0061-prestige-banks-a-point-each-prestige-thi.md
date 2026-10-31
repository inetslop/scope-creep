---
id: T0061
title: "Prestige banks a point: each prestige this life banks +1 talent point"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T11:40:36Z
claimed_at: 2026-10-31T11:40:42Z
epic: E17
designer: desktop-4070
---

## Goal
Prestiging should pay in the draft currency itself, not only in coins: each prestige this life banks +1 talent point, so the level-1 start after a prestige is not a dead minute — the player already holds a point to spend the moment they calm down.

## Details
- A new director (a new file in src/content/directors/, closest example: prestige-coins, which pays coins on the same hook): on `onPrestige`, bank +1 talent point for the player who prestiges. Flat +1 per prestige this life, no scaling.
- Humans only: a bot that prestiges gets no point and its build does not change (precedent: kill coins, "bots earn nothing").
- The banked point lands in the player's existing bank of talent points: the Talents button pulses exactly as it does when a level-up banks a point, and the panel spends it on any talent whose needs are met, in any tree.
- The 2-second prestige card (top centre under the xp bar, currently the coins the last prestige paid) gains a second line while it shows: "+1 talent point". No new card, no new screen space.
- The point lasts the rest of this life: it survives the level-18 reset back to level 1, and is lost on a knockout like every other banked point.

## Acceptance criteria
- [ ] A human player who prestiges at level 18 sees the 2-second card with both lines: the coins (25 × N) and "+1 talent point".
- [ ] At the moment of the prestige the Talents button pulses as with a banked point, and the panel shows the extra point spendable on any available talent.
- [ ] The second prestige this life banks another point (2 points total after two prestiges).
- [ ] A bot that prestiges changes nothing in its build.
- [ ] Right after the level-18 reset the point is still banked and spendable; a knockout before it is spent loses it, like other banked points.

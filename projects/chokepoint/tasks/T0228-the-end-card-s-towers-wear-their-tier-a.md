---
id: T0228
title: "The end card's towers wear their tier: a pip on the by-tower chips"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T18:07:31Z
claimed_at: 2026-10-29T18:12:10Z
epic: E4
designer: yoga
---

## Goal
The game-over screen's "By tower" card (T0216) names the run's towers but hides their tier — the one surface where rarity does not show. E4's promise is that rarity shows everywhere the augment does (draft, hand, tower panel, the tower's slot pips); the end card completes it.

## Details
- Every chip in the "By tower" card — one per tower built, the first augment's icon plus its "×N" kill count — wears one small tier pip beside its icon: T0010's own pip (small rounded pip, r=4; light gray Common, blue Rare, purple Epic), the same size the towers' slot pips use.
- The tier is the tower's first augment's tier — the same value its slot pip and its tower panel already show.
- Chips stay small: the pip adds a few pixels; the chip row wraps as it already does and the card still fits 412x915 and 1280x720 (the card's fit language, T0136/T0225).
- No new sound, no new input. The pip says "tier" the way the player already reads it off every tower; nothing needs teaching.
- Only the game-over screen's "By tower" card changes. The claim card (RewardsScene) is left alone — it is being re-laid out (T0224).
- Closest examples: the tier pip (T0010, on the tower's slots) and the by-tower chips (T0216, the end card).

## Acceptance criteria
- [ ] On the game-over screen, every chip in the "By tower" card wears a small tier pip beside its icon, in the tower's first-augment tier color (light gray Common, blue Rare, purple Epic), T0010's pip shape.
- [ ] The "By tower" card still fits both layouts (412x915 and 1280x720), chips wrapping as before; the chip order and counts are unchanged.
- [ ] Nothing else on the end card changes (score line, breakdown, kill counts untouched), and the claim card is byte-identical.

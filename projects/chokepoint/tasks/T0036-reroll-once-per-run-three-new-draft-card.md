---
id: T0036
title: "Reroll: once per run, three new draft cards for 15 gold"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T08:43:02Z
claimed_at: 2026-10-28T08:43:05Z
epic: E4
designer: desktop
---

## Goal
When all three offered cards are wrong, the player gets one way out: pay 15 gold and roll three new ones — a real decision between gold for slots and a better pick, once per run.

## Details
- One new button under the three draft cards in the draft scene: a small white rounded card button reading "Reroll · 15" with the same small coin glyph the HUD's "+N coins" line uses (T0013). One click or tap; a full finger-width target.
- Usable while the run has not yet rerolled and gold ≥ 15. On click: gold drops by exactly 15, the three cards flip over and back exactly like a draft opening (the ~200 ms flip from T0024, an Epic holding its flip a beat longer), and they land as a fresh set of three offers — rolled with the same tier odds the current wave already uses (the odds line is unchanged and stays correct) — and land with the tier chime (T0032).
- Once per run: the spent flag lives with the run (a new run starts it usable again) and is spent across all drafts — the opening draft before wave 1 counts as a draft.
- After the one use, the button stays visible in every later draft, dimmed in muted gray, reading "Reroll · used", and does nothing when clicked. No disappearing UI: a player who has not used it can see they have it; a player who did can see it is spent.
- While gold < 15 and the reroll is unused: the button is dimmed and the "15" is red, so the gap is visible instead of a dead button.
- The reroll never changes the wave, the odds line, the hand, or anything outside the three offered cards. A fresh roll may repeat an offer — same odds, no guarantee of difference.
- Bright minimal: white card, ink text, one coin glyph; no theme dressing.
- Closest examples: the draft scene's own cards and flip (T0024), the HUD coin line's glyph (T0013), and any existing small white card button for the button's look.

## Acceptance criteria
- [ ] Every draft (the opening one before wave 1 and each one after a cleared wave) shows the "Reroll · 15" button with the coin glyph under the three cards.
- [ ] With gold ≥ 15 and the reroll unused, clicking or tapping it drops gold by exactly 15, flips the three cards over and back, and lands a fresh set of three offers rolled at the current wave's tier odds.
- [ ] The new cards land with the same flip and tier chime as a normal draft opening (T0024, T0032).
- [ ] In every draft after the one use, the button reads "Reroll · used", dimmed in muted gray, and does nothing when clicked; a new run starts with it usable again.
- [ ] With gold < 15 and the reroll unused, the button is dimmed with the price in red and does nothing when clicked.
- [ ] The button fits the draft layout at 412x915 and 1280x720: a full finger-width tap target, no overlap with the cards.
- [ ] Nothing else in the draft changes: the odds line, the hand, the wave and the three-card layout are untouched by the button's presence.

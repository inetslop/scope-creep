---
id: T0374
title: "The bank says what it pays: the build phase's 'bank +N' line on the stats card"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T18:48:59Z
claimed_at: 2026-11-01T18:49:02Z
designer: desktop
---

## Goal
T0363 gave the build phase a spend-now-vs-bank decision — the bank pays 5% of the gold at wave start, capped at +10 — taught once in the first build phase. After that teach the payoff of the choice is nowhere to be seen: the player re-derives "5%, cap 10" in their head every build. One muted line in the stats card puts the number on the decision while the decision is open.

## Details
- **What:** one muted line in the stats card (the top-left card that holds lives, gold and the run's coin tally; the closest example is its coin-tally line, T0013 — 12 px muted ink with the small coin icon, in `src/ui/hud/StatsCard.ts`): "bank +N", where N is the bank's own number for the run's current gold — the existing pure function T0363 built (core/bankInterest.ts: 5% of the gold, floored, capped at +10 per build phase). No new rule: the line reads the same function the pay uses.
- **When:** the build phase only — the only time the choice is open. The line is shown while the interest would be at least 1 gold (20 gold or more, since the pay floors) and updates live as the player spends gold, so the number falls as the bank falls; below 20 gold it is absent and the stats card is byte-identical to today. Outside the build phase — a wave, the draft, the menu, the pause, the game over — it is never shown.
- **No state, no save field:** the line re-derives from the gold every frame, so a resumed run shows it purely from the restored gold.
- **Nothing shown twice, nothing replaced:** the gold balance is the line above it; "bank +N" is the payoff, which is shown nowhere else (the one-time teach says the rule, never the number). It is one line in a card that already holds three reads, present only while the decision is open; the level chips under the stats card follow the card's edge as they do today. No sound, no new button, no key. The line fits the card at 412x915 and 1280x720 alongside the lives/gold and coin-tally lines.

## Acceptance criteria
- [ ] During a build phase with 20 gold or more, the stats card shows a muted "bank +N" line with N the bank's number for the current gold (5%, floored, cap +10); it updates live as gold is spent, and below 20 gold it is absent and the card is byte-identical to today.
- [ ] Outside the build phase — a wave, the draft, the menu, the pause, the game over — the line is never shown and the stats card is byte-identical to today; a resumed run shows the line purely from the restored gold, with no new save field.
- [ ] The line fits the card at 412x915 and 1280x720; the coin-tally line, the lives/gold line and the level chips are unchanged; npm run check and the desktop/mobile smoke pass.

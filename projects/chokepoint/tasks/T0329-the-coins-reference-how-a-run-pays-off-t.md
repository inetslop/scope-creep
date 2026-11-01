---
id: T0329
title: "The coins reference: how a run pays, off the pause"
size: M
priority: 2
status: design
depends_on: [T0313]
attempts: 0
created: 2026-11-01T01:46:07Z
epic: E9
---

## Goal
The coin payout is three layers deep now — the base rates, the claim branch's nodes, and the run's multipliers (E9's level augments and Iron) — and no single screen shows how a run pays. A "Coins" reference off the pause, the fifth of the pause's reference pages, puts the payout math in one card: the rates, this run's terms so far, and the run's multipliers — so the player sees what a clean wave is really worth before spending.

## Details
- **The entry:** one new row on the pause card, "Coins", in the exact pattern of the other reference rows (T0252's Enemies, T0264's Waves, T0277's Bosses, T0306's Summary), plus one line in the pause's controls list ("Coins — how a run pays"). The pause card's column keeps fitting at 412x915 and 1280x720 (its own fit decides; the rows are the established size). The screen has room: the pause is the reference hub, the row is the established size, and the payout — E9's long-term ladder — is the one number a player saves toward and can't yet read the math of.
- **The screen:** a new scene in the references' pattern — the dimmed pause behind, one white rounded card, title "Coins", closed by the references' own close (a tap on the dim shade).
- **Section "Pays"** (muted ink, the current rates, one line each):
  - "each wave held · +1"
  - "every 10 stopped · +1"
  - "each clean wave · +N" — N from the claim branch's clean-pay (the same read the stats card uses, T0313's `cleanWavePay`: 1, or 2 while "Clean ×2" is owned)
  - "a flawless run · +N" — N the Flawless node's own pay (T0313's `flawlessPay`, 10), shown only while that node is owned, absent otherwise
- **Section "This run"** (bold ink, the run's terms so far — the claim card's recipe parts, T0075/T0313's own values, so the mid-run card and the end card agree): "waves +A · stopped +B · clean +C", A the waves held so far, B floor(stopped so far ÷ 10), C the clean waves so far; each part × the run's Iron ×2 when it runs; plus a "flawless +D" part (D the node's pay, × the Iron ×2) while the run is flawless so far (every wave held so far clean, at least one held) and the node is owned. Wraps within the card like the claim recipe.
- **Section "Multipliers"** (shown only when present — the factors behind the parts): "×2 Iron" in an Iron run; "×N level augments" when this run's level multiplier is above 1, N the menu's own number (e.g. "×1.25"). The total is never on the card — the pause's worth line keeps it (T0306's rule: nothing on the page repeats the pause's own run line or worth line; no wave number, lives, gold or tally either).
- Everything is read from what the run and the profile already carry (the ledger, the Iron flag, the purchased nodes, the run's level set) — no new run or profile field, and a resumed run shows the same card.
- No sound, no input beyond the close, no marks on the board or the HUD: one row in, one page behind it.

## Acceptance criteria
- [ ] The pause card has the "Coins" row in the references' pattern and its line in the controls; opening it shows the dimmed pause behind one white card titled "Coins"; the references' own close returns to the pause.
- [ ] "Pays" lists the three base rates; the clean line reads "+2" with the Clean ×2 node owned and "+1" without; the flawless line appears only with the Flawless node owned, and its number is the node's own pay.
- [ ] "This run" reads the run's live terms — for the same ledger and mode, the same parts the claim card's recipe line shows at the end (Iron's ×2 in each part); before wave 1 the parts read +0.
- [ ] "Multipliers" shows "×2 Iron" in Iron runs and "×N level augments" only when the run's level multiplier is above 1; a plain run with no level augments shows no multipliers section.
- [ ] The card shows no wave number, lives, gold, coin tally or total; the pause's own run line and worth line are untouched.
- [ ] No new save field: a resumed run mid-wave shows the same card, and the card's text fits at 412x915 and 1280x720.

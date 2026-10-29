---
id: T0081
title: "The claim card's last page"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
epic: E1
design_attempts: 1
---

## Goal
A run you can look back on, not just a number: the rewards claim grows a small second card under the first — the run's story, wave by wave.

## Details
- A second small white card under the existing claim card (T0003), same width, on the same dimmed board; the Menu button stays under it. It appears with the first card — static, no count-up.
- **The marks row:** one small rounded mark (~12 px) per wave the run reached, wrapping left to right: green = a clean wave (T0005's green), gray = a held wave that leaked, red = the wave the run ended on (the death wave — it is never a held wave). The death mark is last.
- **Two lines under the row**, in the claim card's line style: "Best combo ×N" (the same value and color as the first card's line, T0051 — muted under ×10, the milestone yellow at ×10 and up) and "Loudest wave N" (muted ink — N is the wave that stopped the most enemies; the line is omitted if no wave stopped any).
- **Data:** the run ledger (T0001) grows a per-wave record — for every wave reached: its number, whether it was held, whether it was clean, how many enemies it stopped — written as the run goes and read by the claim card (never recomputed, the T0075 pattern). A resumed run carries the record in its save (the T0042 pattern) and continues it.
- The first card, its count-up, the coin chime (T0009), the claim button and the Menu button are untouched.
- Closest example: the first claim card (T0003) for card language and line style; T0051 for the combo line; the clean chip's green (T0005) and the leak warning's red (T0014) for the mark colors, so a first-time player already knows what they mean.

## Acceptance criteria
- [ ] A run that held 5 waves (2 of them clean) and ended on wave 6 shows 6 marks — 2 green, 3 gray, 1 red — red last.
- [ ] The "Best combo ×N" line matches the first card's line in value and color; "Loudest wave N" names the wave with the most stops (omitted when none).
- [ ] A run resumed mid-way: the marks include the pre-resume waves and the record survived the save.
- [ ] At 412x915 and 1280x720 the two cards and the Menu button fit on screen with no scroll; the first card's layout is unchanged.
- [ ] A first-time player reads the marks without new teaching: green is the clean chip's green, red is the leak warning's red.

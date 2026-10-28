---
id: T0063
title: "Panic pulse: buy your way out of a wave"
size: M
priority: 2
status: design
depends_on: [T0039, T0059]
attempts: 0
created: 2026-10-28T13:29:40Z
---

## Goal
A last gasp when a wave is getting away: during a wave, a "Panic · 25" button under the stats card clears every enemy on the board for 25 gold, once per wave — the first time a player can buy their way out of a wave, at the price of gold they were saving for slots.

## Details
- A bright white rounded button under the stats card (the same button style as the draft's "Reroll · 15", T0036): the coin icon (the HUD's coin, T0013) and "Panic · 25". It is shown only during the wave phase — it appears when the wave starts and is gone by the time the build phase does.
- States: normal when the run has at least 25 gold; dimmed with the price in red when gold is short (the T0036 language); after its one use this wave, dimmed "Panic · used". The use resets at the next wave's start. No keyboard key — tap/click only.
- Effect: every enemy currently on the board vanishes — a soft white flash at each enemy's spot (~150 ms, a small white ring fading out) and one soft low whoosh (a new Sfx at hit-blip volume, played once per pulse, not once per enemy).
- Vanished enemies are a paid wipe, not kills: they pay no gold, count as no "stopped", make no combo, leak nothing, pay no Mint "+1" (T0021) and trigger no burn jump (T0059). The wave's remaining spawns continue as normal, and the wave ends when they are done.
- Discoverable: the button is shown exactly where and when it is used (during a wave), and the pause screen's key list gains one line — "Panic — clear the board, 25 gold, once per wave".
- The button is a separate element below the stats card; the card's layout is unchanged.

## Acceptance criteria
- [ ] During a wave, a "Panic · 25" coin button appears under the stats card; tapping it with at least 25 gold spends 25 gold, every enemy on the board vanishes in soft white flashes with one soft whoosh, and the wave's remaining spawns continue.
- [ ] Vanished enemies pay no gold and count as nothing (no "stopped", no combo, no leak, no Mint +1, no burn jump); the button reads dimmed "Panic · used" for the rest of the wave and resets at the next wave.
- [ ] The button is dimmed with a red price when gold is under 25, is absent during the build phase, and the pause screen's key list has the Panic line.
- [ ] The stats card layout, gold rules, lives and all other sounds are unchanged; works at 412x915 and 1280x720.

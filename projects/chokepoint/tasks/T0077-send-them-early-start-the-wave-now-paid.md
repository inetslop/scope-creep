---
id: T0077
title: "Send them early: start the wave now, paid in gold for the seconds left"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T22:13:10Z
epic: E1
---

## Goal
The break between waves stops being free time: a player who is ready can start the wave early and be paid for the countdown they gave up, so every build phase ends in a decision — spend the time on building, or sell it for gold.

## Details
- A white card button under the wave preview card (T0015), visible exactly while the preview card is visible (the build phase, including the one before wave 1); hidden during the wave, after the wave ends and before the preview returns.
- Label: "Send · +N" with the HUD's small coin glyph before the number. N = 2 × the whole seconds left on the build countdown (floored), recomputed every second — the price visibly falls while the player waits, so the trade is seen without reading.
- The button is a large tap target in the reroll button's class (T0036); while N is more than the run's gold it is dimmed and the number is red (the buy-slot and reroll language), re-enabling live as the countdown brings N within reach.
- Press: the run's gold gains N (a gold pop at the button, the kill-gold pop's style), and the wave starts immediately on the same path the countdown end uses — the planned wave is unchanged (same enemies, same order), and the wave banner (T0067), the phase change and everything the countdown end does happen as usual. A press in the last partial second (N = 0) just starts the wave.
- No new hotkey — the button is the whole input. The pause screen lists it with the other controls: "Send — start the wave now, +2 gold per second left".
- Layout: the button sits in the preview card's width, below it, at 412x915 and 1280x720; it never covers the stats card, the coin line or the speed button (T0019, wave phase only).

## Acceptance criteria
- [ ] During the build phase, a "Send · +N" button sits under the wave preview card and N updates every second to 2 × the whole seconds left; with 30 s left it reads "+60" and falls by 2 each second.
- [ ] While gold < N the button is dimmed with a red number, and it enables live when the countdown brings N within the gold; pressing it then pays N (gold pop at the button) and starts the wave immediately.
- [ ] After the press the wave is exactly the planned wave (banner, enemies and order unchanged) and the build UI (preview card, button) is gone; a second press is impossible.
- [ ] The button is absent during the wave phase and in the beat after the wave ends.
- [ ] The pause screen lists "Send — start the wave now, +2 gold per second left".
- [ ] At 412x915 and 1280x720 the button fits under the preview card without covering the stats card, the coin line or the speed button.

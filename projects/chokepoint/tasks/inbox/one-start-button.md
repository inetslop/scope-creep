---
title: "One start button: the big one banks the early-send gold, the Send button and the wave-gold line go"
size: M
priority: 2
---

## Goal
The build phase has two buttons that start the wave. The big round one (and Space/Enter) starts it and pays nothing; the small "Send · +N" card under the wave preview starts it and banks 2 gold per whole second left. That is redundant, and the better one is the less visible one. The Send card's corners also differ from the round-ended preview card above it. Keep one: the big button starts the wave and banks the gold, and shows how much on it. Also clean up the wave preview card:
- drop its "+N gold" line (the wave's clear bonus), which looks awkward above the enemy counts and isn't worth the room;
- fix its one-time teach line ("quiet: fewer, double gold"), which runs past the card's bottom edge and its sides.

## Details
- **Remove `src/ui/hud/SendButton.ts`** (a `DELETE:` line) and everything that only it used: its part in the HUD (`src/scenes/HudScene.ts` / `src/ui/hud/hud.ts`) and `SEND_BTN`.
- **One way to start early:** the big button (`src/ui/hud/NextWaveButton.ts`) and Space/Enter (`src/input/hotkeys.ts`) do what Send did: bank 2 gold per whole second left (`RunState.bankSend`), then start the wave (`RunFlow.sendNow`'s steps). Fold `startWaveNow` and `sendNow` into one `RunFlow` method that both call. In the last partial second it banks 0 and just starts the wave. It is a gain, never a cost: no "can't afford" dimming, no red number.
- **The gold on the big button:** while the build phase runs and the bank is above 0, a small badge on the button's rim shows the coin icon beside "+N" (bold, 13-14 px), N falling by 2 each second. The badge is a white pill with fully round ends, like the preview card, and never overlaps the "Wave N" title, the hint, the preview card or the speed button, on wide or narrow screens. It goes when the bank reaches 0 and during the wave. On press, the "+N" gold pop rises from the button (the pop Send had).
- **The wave preview card (`src/ui/hud/NextWavePreview.ts`):**
  - Remove the "+N gold" line (`payLine`).
  - Lay the card out from its content: the counts row, then the teach line under it when there is one. Its height is the content plus the same padding top and bottom; its width is the widest line plus the padding. The teach line sits inside the card, never on or past its edge.
  - It now sits directly above the big button's ring or title, in the space Send used to take.
- **The pause screen's key list** (`src/scenes/PauseScene.ts`) says once that Space or the big button starts the wave early for +2 gold per second left, and drops the "Send" line.
- **Keep:** the countdown ring and its blips, the counts and the quiet/tight chips, the teach line's once-per-run rule, the card's pop-in, its hiding on narrow screens while the tower panel is open, `RunState.waveBonus` (the clear still pays it, just not shown here).

## Acceptance criteria
- [ ] There is one start-wave button. Pressing it, or Space/Enter, with 8 s left banks +16 gold and starts the wave; with under 1 s left it banks nothing and starts the wave.
- [ ] The badge shows "+N" on the big button during the build phase, falls by 2 each second, and is gone during the wave. It overlaps nothing at 1280x720 or 412x915.
- [ ] The preview card shows no "+N gold" line. On a quiet or tight wave's first preview, the teach line sits inside the card at both sizes.
- [ ] The Send button is gone from the game and its file is deleted. The tests for banking (`tests/core/run.test.ts`) still pass, and a test covers the folded start method.

---
title: "Remove the Stay put button"
size: S
priority: 1
---

## Goal
The player asked for T0206's "Stay put · 5" button to go. It is a fiddly trade (5 gold for 3 more build seconds, once per build phase) that nobody needs. It also brought back the extra button row under the wave preview that T0223 had just removed. Remove it, and put the wave preview back directly above the big start button, where T0223 left it.

## Details
- Delete `src/ui/hud/StayPutButton.ts` and `tests/systems/buyBuildTime.test.ts` (`DELETE:` lines).
- `src/scenes/HudScene.ts`: remove the `StayPutButton` import and its line in the parts list.
- `src/systems/RunFlow.ts`: remove `buyBuildTime()`, the `stayPutUsed` field, the line that resets it when a build phase starts, and `STAY_PUT` from the config import.
- `src/config.ts`: remove `STAY_PUT`.
- `src/ui/hud/hud.ts`: remove `SEND_BTN` (only the preview's placement uses it once Stay put is gone; check first).
- `src/ui/hud/NextWavePreview.ts`:
  - Remove the `rect` getter (only Stay put used it; check first) and the `SEND_BTN` import.
  - Place the card directly above the big button again: `above - this.cardH / 2`, with the comment "Directly above the big button: above its words on narrow screens, above its ring on wide."
- `src/scenes/PauseScene.ts`: remove the "Stay put — 5 gold buys +3 s of building, once per build phase" line from the controls list.
- Nothing else changes: the build countdown, the big button's early-send gold and its badge, the wave preview's content and its pop-in work as before.
- **For the product owner, when you review this task:** in `planning/IDEAS.md`, mark Stay put as removed at the player's request. It was a trade of a few gold for a few seconds: a choice too small to be worth a button. Don't propose buying or selling build time again.

## Acceptance criteria
- [ ] No Stay put button in any build phase; the pause screen doesn't mention it.
- [ ] At 412x915 and 1280x720 the wave preview card sits directly above the big start button (no empty row between them) and overlaps nothing.
- [ ] `npm run check` passes, with no unused import or constant left behind.

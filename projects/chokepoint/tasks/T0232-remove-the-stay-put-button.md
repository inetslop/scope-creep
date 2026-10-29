---
id: T0232
title: Remove the Stay put button
size: S
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T22:04:07Z
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

## Design (architect, yoga)

### Files
- delete `src/ui/hud/StayPutButton.ts` — the button itself
- delete `tests/systems/buyBuildTime.test.ts` — its tests
- edit `src/config.ts` — remove `STAY_PUT`
- edit `src/systems/RunFlow.ts` — remove `buyBuildTime()`, `stayPutUsed`, the reset line, the `STAY_PUT` import
- edit `src/scenes/HudScene.ts` — remove the import and its parts line
- edit `src/ui/hud/hud.ts` — remove `SEND_BTN`
- edit `src/ui/hud/NextWavePreview.ts` — remove the `rect` getter and `SEND_BTN` import, restore the T0223 placement
- edit `src/scenes/PauseScene.ts` — remove the "Stay put" controls line
### Interfaces
None.
### Steps
1. `config.ts`: delete line 35 (comment) and line 36 `export const STAY_PUT = { cost: 5, sec: 3 } as const;`.
2. `RunFlow.ts`: line 2 → `import { BUILD_SEC, REROLL_COST } from '../config';`; delete lines 47-48 (the `stayPutUsed` comment + field); delete lines 97-106 (comment + entire `buyBuildTime()`); delete line 142 `this.stayPutUsed = false; // the new build phase gets its one buy`.
3. `HudScene.ts`: delete line 14 `import { StayPutButton } from '../ui/hud/StayPutButton';` and line 48 `new StayPutButton(this, game, preview),` (keep `preview,` — it is still a part).
4. `hud.ts`: delete lines 19-20 (the comment + `export const SEND_BTN = { height: 48, gap: 10 } as const;`).
5. `NextWavePreview.ts`: line 11 → `import { EDGE, isNarrow, NEXT_SIZE, type HudPart } from './hud';`; delete lines 44-48 (comment + whole `get rect()`); replace lines 89-98 with exactly:
```ts
  /** Directly above the big button: above its words on narrow screens, above its ring on wide. */
  private place(): void {
    const box = this.box;
    if (!box) return;
    const { width, height } = this.size;
    const bottom = height - HUD.bottom / 2;
    const x = Math.min(width - EDGE - NEXT_SIZE / 2 - 4, width - EDGE - this.cardW / 2);
    const above = isNarrow(width) ? bottom - NEXT_SIZE / 2 - 22 - 30 : bottom - (NEXT_SIZE / 2 + 7) - 10;
    box.setScale(this.fitScale()).setPosition(x, above - this.cardH / 2);
  }
```
6. `PauseScene.ts` line 64: set the `keys` text to `'Space or the big button — start the wave early, +2 gold per second left\nF — fast-forward (2x) during waves\n1-9 — pick a card from the hand\n+ / - — zoom the board'` (drop the middle line only; keep everything else on that line, including `textStyle(12, PALETTE.muted, { align: 'center', lineSpacing: 6 })` and `.setOrigin(0.5)`).
7. Delete the two files (step 0: `DELETE:` both).
8. Grep the repo for `STAY_PUT|stayPut|buyBuildTime|Stay put` — must come back empty — then `npm run check`.
### Pitfalls
- The card moves up 58 px (the removed Stay-put row); it then sits at `above` = 14 px above the narrow-screen title's top and 10 px above the wide ring's top — do not re-add a gap.
- The `keys` text is origin-centered at `-panelH / 2 + 176`; removing the line re-centers it by itself — do not touch its y or the panel.
- Lint fails on the unused `SEND_BTN`/`STAY_PUT` imports if step 2/4/5 import edits are skipped; do not delete `CARD` or `EDGE` from hud.ts (still used).
- Don't touch `planning/IDEAS.md` — the "mark as removed" note is for the product owner, not this task.
### Tests
none

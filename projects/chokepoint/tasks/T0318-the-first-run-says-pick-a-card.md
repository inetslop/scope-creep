---
id: T0318
title: The first run says pick a card
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T01:13:09Z
epic: E11
---

## Goal
A first-time player is dropped onto three unfamiliar cards and nothing says what they are for; on the device's very first run, the pre-wave-1 draft wears one plain white card — "Pick a card" — until a card is picked. The first of E11's three hints and its smallest end-to-end version: one hint a player can use.

## Details
- First run only: the profile's runsPlayed is still 0. A first run resumed after a tab close is still a first run; the hint re-derives from the run's state (T0272's pattern), so a resumed first run that has already picked a card never shows it.
- Only the opening draft (before wave 1), never a later one. A reroll of the opening draft re-flips the cards under the hint; the hint stays up until a pick.
- Look: the HUD's own white card (the draft cards' language, a size below them): one line of bold ink text, ~14 px, "Pick a card", centered above the row of draft cards.
- One in, one out: first run only, one line, gone by doing, never a permanent mark — the teach's language (T0107's first leak, T0272's early send, T0314's streak), a card instead of a line because it outlives the flip: it sits until a first-timer makes a pick.
- Dismissed by doing: the moment any card is picked the card fades out (~150 ms) and never comes back. No sound, no input — a teach, not a button (nothing to list on the pause screen).
- Untouched: the draft's offers, the flip, the tier chime, the reroll button, the hand, the menu demo.
- Closest example for the build: the teach's guard-and-re-derive pattern from `src/systems/fx/streakTeach.ts` (T0314, fired from its one guarded site), shown here while its condition holds (opening draft open, nothing picked) instead of for a fixed time; the card itself in the look of the HUD's white cards.

## Acceptance criteria
- [ ] On a fresh profile (no finished runs), the opening draft shows the "Pick a card" card above the cards; picking any card fades it out and it never reappears in that run or any later run.
- [ ] It never shows in a later draft of the first run, in any run with runsPlayed ≥ 1, or in a resumed first run that has already picked.
- [ ] A reroll of the opening draft leaves the hint up; the card plays no sound and takes no input.
- [ ] The draft (offers, flip, chime, reroll) behaves exactly as before, and everything still fits at 412x915 and 1280x720 with the card up.

## Design (architect, desktop)

### Files
- edit `src/scenes/DraftScene.ts` — the whole feature: compute the hint condition, build the white card, reserve its space in the layout, and fade it on pick. No other file changes.

### Interfaces
No new types. All additions are locals/constants inside `DraftScene.create()`.

### Steps
1. Imports: add `import { loadProfile } from '../core/profile';` and `import { makeCard } from '../ui/card';`.
2. Next to `CARD_W`/`CARD_H` (lines 17-18) add module constants: `const HINT_W = 140; const HINT_H = 44; const HINT_GAP = 12;`
3. In `create()`, next to `let cards ...` (line 41) declare: `let hint: Phaser.GameObjects.Container | undefined;`
4. Right after `const opening = game.run.wave === 0;` (line 55) add:
   `const showHint = opening && loadProfile(window.localStorage).runsPlayed === 0;`
   (runsPlayed is only incremented in `recordRun` at run end, so a first run — including one resumed after a tab close — still reads 0 here; `opening` keeps it to the pre-wave-1 draft. A first-run profile has no coins/tech, so the offer is always 3 cards and `hasRow` is false — the grid path never co-occurs with the hint.)
5. In `pick()` (lines 45-51), replace `this.scene.stop();` with:
   ```ts
   if (hint) {
     this.tweens.add({ targets: hint, alpha: 0, duration: 150, ease: 'Quad.easeIn' });
     this.time.delayedCall(150, () => this.scene.stop());
   } else {
     this.scene.stop();
   }
   ```
6. Replace `portrait` (lines 73-79) with (it captures `showHint` from the closure; `cardSlot` and `rerollSlot` call it, so they shift automatically):
   ```ts
   const portrait = (h: number, n: number): { top: number; header: number; gap: number } => {
     let header = 84, gap = 16;
     if (showHint) header += HINT_H + HINT_GAP * 2 - 26; // the hint card takes the odds-to-cards gap
     const col = () => header + n * H + (n - 1) * gap + 16 + 52;
     if (70 + col() > h - 8) { header = 76 + (showHint ? HINT_H + HINT_GAP * 2 - 18 : 0); gap = 12; }
     const c = col();
     return { top: Math.min(Math.max(70, (h - c) / 2), h - c - 8), header, gap };
   };
   ```
7. After the `odds` text (line 72) create the hint:
   ```ts
   hint = showHint
     ? this.add.container(0, 0, [
         makeCard(this, 0, 0, HINT_W, HINT_H, 14),
         this.add.text(0, 0, 'Pick a card', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5),
       ])
     : undefined;
   ```
8. In `layout()`: in the landscape branch (lines 241-245) add `const shift = showHint ? HINT_H + HINT_GAP * 2 : 0;` and subtract it from all three y's (`- 74 - shift`, `- 40 - shift`, `- 18 - shift`). Then at the end of `layout()` place the hint between the odds line and the first card's top edge:
   ```ts
   if (hint) {
     const first = cardSlot(0, width, height, cards.length);
     hint.setPosition(width / 2, (odds.y + 6 + first.y - H / 2) / 2);
   }
   ```

### Pitfalls
- `scene.stop()` destroys the hint, so the fade must finish before the stop — hence the `delayedCall`; never stop immediately when `hint` exists. During those 150 ms the reroll/keys are already dead (`this.picked` guards) and `hook.overlay` is cleared synchronously, so smoke and invariants are unaffected.
- `buildRow` (reroll) must stay untouched — it re-flips the cards and never touches `hint`; `layout()` repositions the hint, so a reroll leaves it up.
- The non-hint layout must be byte-identical: every new expression is a no-op when `showHint` is false.
- Verified fit at 412x915 (portrait, `top` 70 for H=206, 53 for the tallest current 3+2-line card, H=212) and 1280x720 (title y 112, hint y 219). If a future augment ever gets 3+3-line card text (H≈229), the title top edge goes ~13 px off at 412x915 — re-check the portrait numbers then.
- No sound, no input, no pause-screen entry: the container is not interactive and nothing is added to `HOTKEYS`/`INVARIANTS`.

### Tests
none

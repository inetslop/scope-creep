---
id: T0036
title: "Reroll: once per run, three new draft cards for 15 gold"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-28T08:43:02Z
claimed_at: 2026-10-28T09:03:58Z
finished_at: 2026-10-28T09:16:35Z
epic: E4
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

## Design (architect, desktop)

### Files
- edit `src/config.ts` — one constant next to `WAVE_BONUS`
- edit `src/core/run.ts` — reroll flag + pay method on `RunState`
- edit `src/systems/RunFlow.ts` — one new method `rerollOffer()` between `openDraft()` and `finishDraft()`
- edit `src/scenes/DraftScene.ts` — make the card row rebuildable and add the reroll button under the cards
- edit `tests/core/run.test.ts` — tests for the once-per-run rule

### Interfaces
```ts
// config.ts, after WAVE_BONUS:
export const REROLL_COST = 15; // the run's one draft reroll

// core/run.ts, on RunState (field after cleanWaves; method after spend()):
rerollUsed = false;
/** Pays for the run's one reroll: takes the gold and marks it spent. */
reroll(cost: number): boolean {
  if (this.rerollUsed) return false;
  if (!this.spend(cost)) return false;
  this.rerollUsed = true;
  return true;
}

// systems/RunFlow.ts (import REROLL_COST from '../config'):
/** The draft's one reroll: if the run has it, pay REROLL_COST and roll three new offers. */
rerollOffer(): boolean {
  if (this.run.phase !== 'draft') return false;
  if (!this.run.reroll(REROLL_COST)) return false;
  this.offer = rollOffer(this.run.rng, AUGMENTS, 3, this.draftWave, this.run.wave === 0);
  return true;
}
```
(The `this.run.wave === 0` keeps the opening draft's opener-only pool; `draftWave` is untouched, so the odds line stays correct.)

### Steps
1. `config.ts`, `core/run.ts`, `systems/RunFlow.ts`: exactly the code above.
2. `DraftScene.ts` imports: add `REROLL_COST` from `'../config'`, `cssColor` next to `PALETTE`, `COIN_TEXTURE` to the `art/textures` import, `import type { AugmentCopy } from '../content/types';`.
3. In `create()`: delete lines 34-36 (`offer`, `offered`, `flipped`) and the whole `const cards = offered.map(...)` block (63-109). Add instead:
   `const flipped: boolean[] = [false, false, false];` `let cards: { button: ReturnType<typeof makeButton>; frame: Phaser.GameObjects.Graphics | undefined }[] = [];` `let flipTweens: Phaser.Tweens.Tween[] = [];` `let size = viewSize(this);`
4. Move the deleted map body verbatim into `const buildRow = (copies: AugmentCopy[]): void => { cards = copies.map((copy, i) => { ...same body... }); ...placement... }` with three changes: the map param is now `copy` and the first line is `const b = getAugment(copy.id);` (replacing `const copy = offer[i]!`); capture the tween: `const flip = this.tweens.add({...}); flipTweens.push(flip);`; prepend at the top of `buildRow`:
   ```ts
   for (const t of flipTweens) t.stop();
   flipTweens = [];
   for (const c of cards) { c.button.container.destroy(); c.frame?.destroy(); }
   flipped.fill(false);
   ```
   and end `buildRow` placing the row at the current size (same loop the layout used, via `cardSlot(i, size.width, size.height)`). Call `buildRow(game.flow.offer);` where the old map was.
5. Position helpers, same formulas as today's `layout()`:
   ```ts
   const cardSlot = (i: number, w: number, h: number) =>
     w < 740 ? { x: w / 2, y: Math.max(70, (h - 3 * (CARD_H + 16) - 90) / 2) + 84 + CARD_H / 2 + i * (CARD_H + 16) }
             : { x: w / 2 + (i - 1) * (CARD_W + 24), y: h / 2 + 10 };
   const rerollSlot = (w: number, h: number) =>
     w < 740 ? { x: w / 2, y: Math.max(70, (h - 3 * (CARD_H + 16) - 90) / 2) + 84 + 3 * CARD_H + 2 * 16 + 42 }
             : { x: w / 2, y: h / 2 + 10 + CARD_H / 2 + 44 };
   ```
6. After `buildRow(...)`, the button (white card, coin glyph, key hint on it):
   ```ts
   const reroll = (): void => {
     if (this.picked || !game.flow.rerollOffer()) return;
     refreshReroll();
     buildRow(game.flow.offer);
   };
   const rerollButton = makeButton(this, 0, 0, '', reroll, { width: 156, height: 52, fadeWhenDisabled: false });
   const rerollWord = this.add.text(0, 0, 'Reroll ·', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
   const rerollPrice = this.add.text(0, 0, String(REROLL_COST), textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
   const rerollCoin = artScale(this.add.image(0, 0, COIN_TEXTURE), 12 / 28); // the HUD "+N coins" glyph
   const rerollHint = this.add.text(-156 / 2 + 12, -52 / 2 + 12, 'R', textStyle(11, PALETTE.faint, { fontStyle: 'bold' }));
   const centerRow = (): void => {
     const w = 12 + 8 + rerollWord.width + 6 + rerollPrice.width;
     rerollCoin.x = -w / 2 + 6; rerollWord.x = -w / 2 + 20; rerollPrice.x = rerollWord.x + rerollWord.width + 6;
   };
   const refreshReroll = (): void => {
     const used = game.run.rerollUsed;
     const afford = game.run.canAfford(REROLL_COST);
     rerollButton.setEnabled(!used && afford);
     rerollPrice.setText(used ? 'used' : String(REROLL_COST));
     rerollWord.setColor(cssColor(used ? PALETTE.muted : PALETTE.ink));
     rerollPrice.setColor(cssColor(used ? PALETTE.muted : afford ? PALETTE.ink : PALETTE.red));
     rerollButton.content.setAlpha(used ? 0.5 : afford ? 1 : 0.6);
     centerRow();
   };
   rerollButton.content.add([rerollCoin, rerollWord, rerollPrice, rerollHint]);
   refreshReroll();
   if (flags.smoke) rerollButton.setEnabled(false);
   ```
7. `pick(i)`: replace `game.flow.finishDraft(offer[i])` with `game.flow.finishDraft(game.flow.offer[i])`.
8. `layout()`: set `size = { width, height };` first, keep the title/subtitle/odds lines unchanged, replace the card `place` loop with `cards.forEach((c, i) => { const p = cardSlot(i, width, height); c.button.container.setPosition(p.x, p.y); c.frame?.setPosition(p.x, p.y); });` and add `const r = rerollSlot(width, height); rerollButton.container.setPosition(r.x, r.y);`.
9. `onKey`: add `if (e.key === 'r' || e.key === 'R') reroll();` next to the 1-3 line. Leave the smoke auto-pick as is.
10. Tests in `tests/core/run.test.ts` (import `REROLL_COST`): (a) `reroll(REROLL_COST)` true → gold down exactly 15, `rerollUsed` true; second call false with gold unchanged; (b) with gold `REROLL_COST - 1`: false, `rerollUsed` still false, gold unchanged.

### Pitfalls
- After a reroll `game.flow.offer` is a **new array**; picking the captured old one would make `finishDraft` silently drop the pick — hence step 7.
- A reroll clicked while the opening flip is mid-flight: stop every flip tween, destroy the old row, and `flipped.fill(false)` before rebuilding, or a dead tween's `onComplete` marks a still-face-down card pickable.
- `centerRow()` must run after every text change: "Reroll · used" is wider than "15" and the row would drift off-center.
- Keep the reroll button disabled in `flags.smoke`: a random smoke click could spend the reroll or re-flip the cards right after the 800 ms auto-pick and strand the draft.
- Layout is already checked: 412x915 button spans y 820-872 (cards end 804, screen 915); 1280x720 center y 517 (cards end 473). Do not retune.
- Keep the new RunFlow method its own hunk between `openDraft`/`finishDraft` (T0015 also edits RunFlow) and the config line next to `WAVE_BONUS` (T0004 also edits config.ts). No tween/dt changes, no pooling, no new scene listeners beyond `onResize`/`onKey` (auto-removed on shutdown).

### Tests
- `tests/core/run.test.ts`: the two cases in step 10 (rule in `src/core/run.ts` a later change could silently break).

## Result (attempt 1, desktop)

Added the run's one draft reroll: a "Reroll · 15" coin-glyph button under the three draft cards that, once per run, pays 15 gold and re-rolls the offer with the same flip animation and tier chime. The spent flag and payment live on `RunState` (`rerollUsed`, `reroll()`), the re-roll in `RunFlow.rerollOffer()` (kept in its own hunk between `openDraft`/`finishDraft`), the cost in `config.ts` next to `WAVE_BONUS`, and the UI in `DraftScene.ts` where the card row is now rebuildable (`buildRow`) with the button reflecting used/can't-afford states and an "R" hotkey. Two new unit tests in `tests/core/run.test.ts` guard the once-per-run rule; check and smoke both pass.

- Self-review: APPROVE
- Time: 12.6 min

```
projects/chokepoint/game/src/config.ts            |   3 +
 projects/chokepoint/game/src/core/run.ts          |   9 ++
 projects/chokepoint/game/src/scenes/DraftScene.ts | 166 ++++++++++++++--------
 projects/chokepoint/game/src/systems/RunFlow.ts   |  10 +-
 projects/chokepoint/game/tests/core/run.test.ts   |  20 ++-
 5 files changed, 148 insertions(+), 60 deletions(-)
```

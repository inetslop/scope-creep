---
id: T0406
title: "The Iron card says what it does: the sub-line under the name"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T05:03:59Z
claimed_at: 2026-11-02T05:22:08Z
finished_at: 2026-11-02T05:31:27Z
---

## Goal
The Iron mode's rules are only known to players who have read a run's claim card; the menu's Iron card now says what it buys and what it turns off, in the sub-line language E17's Storm card (T0403) will copy.

## Details
- The Iron card on the menu (the mode card under Play, the same row of cards T0403's Storm card will join — the menu scene; closest example: the profile card's muted line, "runs N · avg wave M", in src/scenes/menu/ProfileCard.ts): one muted line under the card's name, always shown, in the profile card's muted line's own size and color: "1 life · 2× coins · no last stand".
- The card grows to fit the line (its own text-fit pass); the line fits at 412x915 and 1280x720.
- The Play card and every other menu element are unchanged; the claim card's "Iron" read and the pause screen are unchanged.

## Acceptance criteria
- [ ] The menu's Iron card shows the muted sub-line "1 life · 2× coins · no last stand" under its name, in both layouts.
- [ ] The line shows on the menu only — the claim card, the pause screen and the profile card are unchanged.
- [ ] The Play card, the Tech button and the menu demo are unchanged.

## Design (architect, yoga)

### Files
- edit `src/scenes/MenuScene.ts` — the Iron card block only (lines 84–93): new sub-line text, profile-card muted-line style, card width grown from the line. Nothing else in this file changes (not the `below`/`layout()` math, not `IRON_H`, not `fadeIn`).

### Interfaces
No new types or signatures — everything is a `create()`-local change in `MenuScene`.

### Steps
Replace lines 84–93 exactly with:
```ts
    // The Iron mode: the same run at one life that pays double coins, chosen before wave 1.
    // The sub-line also says what the mode turns off; the card's width grows from it.
    const ironLine = this.add.text(0, 0, '1 life · 2× coins · no last stand', textStyle(17, PALETTE.muted)).setOrigin(0.5);
    const ironTitle = this.add.text(0, 0, 'Iron', titleStyle(24)).setOrigin(0.5);
    const ironPairH = ironTitle.height + 4 + ironLine.height;
    const iron = makeButton(this, 0, 0, '', () => {
      clearSavedRun(window.localStorage); // a new run abandons a saved one for nothing
      this.registry.set('ironMode', true);
      this.scene.start(SCENES.pick); // the Iron run also picks its board
    }, { width: Math.round(ironLine.width) + 28, height: IRON_H, radius: 30 });
    iron.label.setVisible(false);
    ironTitle.setY(-ironPairH / 2 + ironTitle.height / 2);
    ironLine.setY(ironPairH / 2 - ironLine.height / 2);
    iron.content.add([ironTitle, ironLine]);
```
(`textStyle` and `titleStyle` are already imported; the 28 is the profile card's `PAD * 2`.)

### Pitfalls
- Copy the exact characters from the old string: "·" is U+00B7 and "×" is U+00D7 — not a hyphen, period, or Latin x.
- The width is the text-fit pass: `ironLine.width + 28`, never the old hard-coded 220 and never capped. The card is centered at `cx` and scaled by `s`, so a wider card (~270–290 px) fits at 1280x720 (s≈0.56 → ~160 px) and 412x915 (s≈0.74 → ~210 px) without any layout change.
- Don't keep the old y's (`-10`, `16`): the 17 px line is taller than the 14 px one and the title/line gap would shrink to ~1 px — the y's come from `ironPairH`.
- Keep `height: IRON_H` (68), `iron.label.setVisible(false)`, and add only `ironTitle` and `ironLine` to `iron.content`.
- No edits to `SummaryScene` (claim card), `PauseScene`, `ProfileCard.ts`, `MenuDemo.ts`, or the Play/Tech buttons.

### Tests
- none

## Result (attempt 1, yoga)

The menu's Iron card now shows a muted sub-line under its name — "1 life · 2× coins · no last stand" — in the profile card's muted-line style (17 px, `PALETTE.muted`), saying what the mode buys and that it turns off last stand. The card width is text-fit from the line (`ironLine.width + 28`) instead of the hard-coded 220, and the title/line y positions come from the pair height, keeping the 4 px gap. Nothing else changed: the claim card, pause screen, Play/Tech buttons and the menu demo are untouched, and the line fits in both layouts since the card is already centered and scaled by the existing layout math.

- Self-review: APPROVE
- Time: 9.3 min

```
projects/chokepoint/game/src/scenes/MenuScene.ts | 10 +++++++---
 1 file changed, 7 insertions(+), 3 deletions(-)
```

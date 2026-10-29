---
id: T0100
title: The hand card wears its tier
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T02:55:25Z
claimed_at: 2026-10-29T03:54:47Z
epic: E4
---

## Goal
The hand names its tier the way the draft does: the hand card's tier word (the shared tier card look, T0008) is drawn in the tier's own color — the hand-side twin of T0097's draft-card change.

## Details
- A hand card already wears the shared tier card look — frame, gem row and tier word in plain ink (T0008). This task colors the word: "· Rare" in blue, "· Epic" in purple — the same tier colors the draft cards wear after T0097, and the same colors as the card's own frame and gems. A Common hand card stays the plain name, no word.
- If a hand card turns out to carry no word yet, add it first in the draft's style (T0026 — "Name · Rare" on the name line) and then color it; either way the finished word matches T0097's draft word in style and color.
- The word keeps the hand card's existing name-line style and position; the card grows to fit if needed (T0072's text-fit pattern). The frame and gem row (T0008) are untouched.
- No rule change, no input, no sound. The draft cards are T0097's and are not touched here.
- Closest examples: T0097 (the same color change on the draft surface) and the tier word itself (T0026).

## Acceptance criteria
- [ ] A Rare hand card reads "Name · Rare" with the word in blue (the Rare frame's blue); an Epic hand card reads "· Epic" in purple; a Common hand card shows the plain name.
- [ ] The word matches T0097's draft word in style and color; the hand card's frame and gem row (T0008) are unchanged.
- [ ] The card fits its text (T0072 pattern) at 412x915 and 1280x720; a Common card renders byte-identically to today.
- [ ] Desktop and mobile smoke pass.

## Design (architect, yoga)

- The hand card (`src/ui/hud/HandBar.ts`) builds each card as a `makeButton` (uniform width `w`), with the name line at `HandBar.ts:59` being just `a.name` — **no tier word yet**. So per the task's hedge, I add it in the draft's style (T0026), then color it.
- The tier look is shared in `src/ui/tierLook.ts`: `tierFrameColor(tier)` returns `PALETTE.blue`/`PALETTE.purple` (the exact frame/gem colors, `undefined` for Common); `tierName(tier)` returns `'Rare'`/`'Epic'`. The frame (`drawTierFrame`) and `gemRow` are already wired in HandBar and stay untouched.
- The draft's word (T0026) is `${name} · ${tierName}`; T0097 (not yet built) will color it. T0100 is the hand-side twin, using the same palette colors directly — no dependency on T0097, and it edits only `HandBar.ts` (T0097 edits DraftScene/tierLook/TowerPanel → no file overlap).
- `PALETTE.blue`/`purple` exist; `textStyle(size, color)` takes the raw palette number.

DESIGN:
### Files
- edit `src/ui/hud/HandBar.ts` — add the tier word to the Rare/Epic hand-card name line, colored by tier; grow each Rare/Epic card to fit its line (Common cards byte-identical). One file; no new files, no registries.

### Interfaces
none — reuses existing `tierName()` and `tierFrameColor()` from `src/ui/tierLook.ts`; `PALETTE.blue`/`PALETTE.purple`. Add both to the existing tierLook import in HandBar.

### Steps
1. HandBar.ts import (line 9): `import { drawTierFrame, gemRow, tierFrameColor, tierName } from '../tierLook';`
2. In `build()`, replace the block from `const gap = 8;` through the end of the `ids.forEach(...)` (current lines 53-67) with:
```ts
    const gap = 8;
    const per = (space - gap * (ids.length - 1)) / Math.max(1, ids.length);
    const base = Math.max(56, Math.min(CARD, per)); // today's width
    // "Name" for Common, "Name · Rare"/"Name · Epic" otherwise; measure it so the card fits the line.
    const measure = scene.add.text(0, 0, '', textStyle(13, PALETTE.ink, { fontStyle: 'bold' }));
    const widths = ids.map((copy) => {
      if (copy.tier === 'common') return base;
      measure.setText(`${getAugment(copy.id).name} · ${tierName(copy.tier)}`);
      return Math.max(base, measure.width + 12); // 6 px of room each side
    });
    measure.destroy();
    let x = EDGE;
    ids.forEach((copy, i) => {
      const a = getAugment(copy.id);
      const w = widths[i];
      const b = makeButton(scene, x + w / 2, bottom, '', () => game.building.pickCard(i), { width: w, height: CARD, radius: 20, accent: PALETTE[a.look.color] });
      const icon = artScale(scene.add.image(0, -13, augmentTexture(copy.id)), Math.min(1.1, w / 75));
      const name = scene.add.text(0, 12, a.name, textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      const word = copy.tier === 'common' ? undefined : scene.add.text(0, 12, `· ${tierName(copy.tier)}`, textStyle(13, tierFrameColor(copy.tier)!, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      if (word) {
        name.setOrigin(0, 0.5);
        const total = name.width + 4 + word.width; // "Name" + space + "· Rare", centered
        name.x = -total / 2;
        word.x = name.x + name.width + 4;
      }
      const key = i < 9 ? [scene.add.text(-w / 2 + 9, -CARD / 2 + 7, String(i + 1), textStyle(11, PALETTE.faint, { fontStyle: 'bold' }))] : [];
      b.content.add([icon, name, ...(word ? [word] : []), gemRow(scene, copy.tier, 0, 29), ...key]);
      // The frame goes in the content, so it lifts with the card; last, so it draws on top.
      const frame = drawTierFrame(scene, copy.tier, w, CARD, 20);
      if (frame) b.content.add(frame);
      b.setSelected(game.building.selectedAugment === i);
      items.push(b.container);
      x += w + gap;
    });
```
The word is a second text: `· Rare`/`· Epic` (dot included), tier-colored via `tierFrameColor` (blue/purple, `!` — always defined for Rare/Epic); the name stays ink. The `4` is the space before the dot. `widths` makes Rare/Epic cards `max(base, line+12)` and Common cards exactly `base` (today's `w`), laid out cumulatively from `EDGE`.

### Pitfalls
- Common byte-identical: Common cards use `base` (the old uniform `w`) and a single centered ink name — identical to today in every hand. Don't route Common through the word/fit path.
- `tierFrameColor` is `number | undefined`; the `!` is safe only in the Rare/Epic branch (it's `undefined` for Common) — keep the `!` where the word is built.
- The `measure` text is created and destroyed inside `build()` (never rendered); do not add it to `items`/`this.box`.
- Cumulative `x` (per-card `w`): card `i` center `= x + w/2`, then `x += w + gap`; when no card grows this reduces to today's uniform `EDGE + w/2 + i*(w+gap)`.
- Don't touch `drawTierFrame`/`gemRow` calls or the frame/gem look; the word is the only content added. No sound, no input, no rule change; draft cards (T0097) untouched.

### Tests
none (UI/juice; no `src/core` rule added or changed).

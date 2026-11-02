---
id: T0422
title: "The preview's tag chip sits on its own line"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T11:43:00Z
---

## Goal
The next-wave preview's tag chip (quiet, tight, rush, boss) currently sits at the token row's left edge, where it crowds the first token and can read as a token itself; on its own line under the row it reads as the label of the whole wave — the wave's pace, planned in the build.

## Details
- File: `src/ui/hud/NextWavePreview.ts` only. The chip already exists (the banner chip's own look: the tag's fill, the 11 px label, the label.width+14 × 18 rounded rect, shown only during the build phase on tagged waves) — this task moves it, it does not add it.
- Move the chip from the token row's left edge to its own line directly under the token row, above the card's muted "+N gold" line (the gold line's placement is the closest example of a line under the tokens).
- The chip's look is unchanged; only its position moves. The token row keeps its full width (no chip space reserved at its left edge). While a tag is present the card grows by the chip's line (18 px) plus a 4 px gap.
- Untagged waves: the card is byte-identical (no chip line, no height change).
- The one-time teach line under the card (T0092) and the flyer's one-time teach (T0373) are untouched; the storm's preview chip (E17) will ride this placement.

## Acceptance criteria
- [ ] During a tagged wave's build phase the chip shows on its own line under the token row, above the "+N gold" line, in its unchanged look (tag fill, 11 px label, label.width+14 × 18 rounded).
- [ ] The first token in the row is no longer pushed over by the chip.
- [ ] Untagged waves: the card is byte-identical to before.
- [ ] With the longest tag and the longest counts, the card and its lines fit at 412x915 and 1280x720 (the layout gate passes).

## Design (architect, yoga)

### Files
- edit `src/ui/hud/NextWavePreview.ts` — move the tag chip from the token row's left edge to its own centered line directly under the row, above the card's muted lines (the far line / teach lines; the card has no separate gold line — anything added there later rides under the chip). Tagged card grows 18 px (chip line) + 4 px (gap); untagged card unchanged.

### Interfaces
None — no new types or signatures; only private `build()` internals and two local constants change.

### Steps
1. After `const TEACH_H = 18;` (line 17) add, one per line: `const CHIP_H = 18;` and `const CHIP_GAP = 4;`.
2. In `build()`, replace lines 126–136 (`const tag = plan.tags[0];` through the end of its `if (tag) { … }`) with:

```ts
    const tag = plan.tags[0];
    let chip: Phaser.GameObjects.Container | undefined;
    let chipW = 0;
    if (tag) {
      // The tag's own chip, in its own muted color (never the red leak warning), on its own line under the row.
      const label = scene.add.text(0, 0, tag, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
      chipW = Math.ceil(label.width) + 14;
      const chipBg = scene.add.graphics();
      chipBg.fillStyle(tagChip(tag), 1);
      chipBg.fillRoundedRect(-chipW / 2, -9, chipW, 18, 9);
      chip = scene.add.container(0, 0, [chipBg, label]);
    }
```

(the old `countsPieces.push(scene.add.container(chipW / 2, …))` and `cursor += chipW + GROUP_GAP;` are deleted — the row reserves no chip space; `cursor` starts at 0 as before).
3. In `build()`'s tail, replace from `this.cardW = Math.max(…)` (line 157) to the `pieces` line with:

```ts
    this.cardW = Math.max(countsW, chipW, ...lines.map((t) => Math.ceil(t.width))) + PAD * 2;
    const chipRow = chip ? CHIP_GAP + CHIP_H : 0;
    this.cardH = LINE_H + chipRow + lines.length * (ROW_GAP + TEACH_H) + PAD * 2;
    const contentH = this.cardH - PAD * 2;
    const left = -this.cardW / 2 + PAD;
    for (const p of countsPieces) { p.x += left; p.y += -contentH / 2 + LINE_H / 2; }
    if (chip) chip.setPosition(0, -contentH / 2 + LINE_H + CHIP_GAP + CHIP_H / 2); // centered, like the lines below it
    let ly = -contentH / 2 + LINE_H + chipRow + ROW_GAP + TEACH_H / 2;
    for (const t of lines) { t.setPosition(0, ly); ly += ROW_GAP + TEACH_H; }
    const pieces: Phaser.GameObjects.GameObject[] = [...countsPieces, ...(chip ? [chip] : []), ...lines];
    pieces.unshift(makeCard(scene, 0, 0, this.cardW, this.cardH, this.cardH / 2)); // pill, like before
    return scene.add.container(0, 0, pieces);
```

Everything else (the `counts.forEach` row, `fitScale()`, `place()`, pop-in tween, `update()` gates) stays byte-identical.

### Pitfalls
- The chip must NOT go into `countsPieces`: the `p.x += left` loop left-aligns that list; the chip is centered at x=0 like the muted lines and lives only in `pieces`.
- `chipW` must stay in the `cardW` max: a boss wave's row is one short group and the chip would overhang the card's right edge without it.
- Untagged waves must stay byte-identical: `chipW = 0` is a no-op in the max, `chipRow = 0`, no chip in `pieces` — the 4 px gap and 18 px line apply only when tagged.
- Line order is unchanged (far line first, then teach) and each line keeps its 6 px ROW_GAP from the element above it (the chip when tagged, the row when not); only 4 px sits between row and chip.
- Do not add the 22 px to untagged heights, and leave `place()` alone: the card is bottom-anchored, so it rises ≤22 px and `fitScale()` still shrinks it to the corner; the tallest card overall (100 px, untagged first build with two teach lines) is unchanged, so 412x915 / 1280x720 keep fitting.

### Tests
- none

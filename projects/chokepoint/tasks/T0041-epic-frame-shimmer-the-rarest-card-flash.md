---
id: T0041
title: "Epic frame shimmer: the rarest card flashes as it lands"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T10:59:21Z
claimed_at: 2026-10-28T11:13:30Z
epic: E4
---

## Goal
The draft's rarest moment gets a flash: when an Epic card lands face-up on the reveal flip, its purple frame runs one quick white shimmer, so the rarest card in the offer is noticed before its name is read.

## Details
- On the draft reveal (T0024), when an Epic card's flip lands, a one-shot white shimmer passes across the card from left to right in about 150 ms: a flat white band (the card's own white, soft alpha edges — no glow, no color gradient, no outline) that reads as the purple frame flashing where it crosses. The instant it ends, the card looks exactly like it does today.
- One shimmer per reveal: it plays on the first offer and again when the reroll (T0036) re-flips the offer. It never plays again while the card sits in the draft, and it never plays on hand cards or tower-panel cards.
- Common and Rare cards land exactly as they do today: no shimmer.
- Nothing else changes: the flip's timing, the tier chime (T0032), the gem row, the tier word, the card sizes on 412x915 and 1280x720, and every other scene.
- Closest example: the draft-card flip in `DraftScene.ts` (T0024) — the shimmer starts at the moment that flip lands.

## Acceptance criteria
- [ ] In a draft offer containing an Epic card, that card's reveal flip lands with a one-shot ~150 ms white shimmer passing left to right; the Common and Rare cards in the same offer land without it.
- [ ] The reroll's re-flip shimmers an Epic card once more; a card already in the draft or in the hand never shimmers again.
- [ ] After the shimmer the Epic card looks exactly as it does today (purple frame, gem row, "Name · Epic" line): no glow, gradient, outline, sound, or layout change at 412x915 or 1280x720.
- [ ] Flip timing, tier chime, the hand and tower panel, and every other scene are unchanged; the desktop and mobile smoke tests pass.

## Design (architect, yoga)

### Files
- edit `src/scenes/DraftScene.ts` — one new module function `epicShimmer` + a one-line condition in the draft card flip's `onComplete`. Nothing else touched (no core changes, no invariants, no content).

### Interfaces
No new types. New module-level function in `DraftScene.ts`:
`function epicShimmer(scene: Phaser.Scene, x: number, y: number): void`

### Steps
1. In `buildRow`'s flip tween, replace the `onComplete` one-liner (line 120) with:
```ts
onComplete: () => {
  button.container.setScale(1);
  frame?.setScale(1);
  flipped[i] = true;
  if (copy.tier === 'epic') { const p = cardSlot(i, size.width, size.height); epicShimmer(this, p.x, p.y); }
},
```
2. Add this function at the end of `DraftScene.ts`, after `drawPlusGlyph` (same style as `drawTowerGlyph`/`drawPlusGlyph`):
```ts
/**
 * The Epic card's one-shot shimmer: as its flip lands, a flat white band (the card's own color)
 * sweeps the card from its left edge to its right edge in 150 ms. Invisible on the white card,
 * so it reads as the purple frame flashing where the band crosses.
 */
function epicShimmer(scene: Phaser.Scene, x: number, y: number): void {
  const band = scene.add.graphics();
  band.fillStyle(PALETTE.card, 0.05);
  band.fillRect(-36, -CARD_H / 2, 24, CARD_H);
  band.fillRect(12, -CARD_H / 2, 24, CARD_H);
  band.fillStyle(PALETTE.card, 0.18);
  band.fillRect(-24, -CARD_H / 2, 24, CARD_H);
  band.fillRect(0, -CARD_H / 2, 24, CARD_H);
  band.fillStyle(PALETTE.card, 0.45);
  band.fillRect(-12, -CARD_H / 2, 24, CARD_H);
  band.setPosition(x - CARD_W / 2 + 36, y);
  scene.tweens.add({ targets: band, x: x + CARD_W / 2 - 36, duration: 150, ease: 'Linear.easeNone', onComplete: () => band.destroy() });
}
```
The five `fillRect`s (width 24, centered at dx −36, 12, −24, 0, −12) form one 72-px-wide soft band: alphas 0.05/0.18/0.45/0.18/0.05 left-to-right, full card height, in `PALETTE.card` (white).

### Pitfalls
- Trigger must be `onComplete`, not `onYoyo`: at the yoyo start the card is still a thin line (`scaleX` 0.03); the flip lands face-up only when `scaleX` returns to 1 (`flipped[i] = true`).
- Do not set depth: the band is created in `onComplete`, i.e. after every object from `create()`, so creation order renders it on top of the card, frame and text.
- The band never leaves the card: its half-width is 36, start center `x − CARD_W/2 + 36` (left edge flush with the card's left edge) and end center `x + CARD_W/2 − 36` (right edge flush), so white never touches the sage ground and the card is pixel-identical the instant the band is destroyed.
- Keep `band.destroy()` in the tween's `onComplete` — a leaked Graphics would sit on the board; in smoke mode a scene stop mid-band is fine (scene shutdown kills the tween and the object).
- Don't touch the flip's `delay`/`leg`/`yoyo`, the tier chime in `onYoyo`, or the frame drawing; no sound, no glow, no gradient, no `Math.random`.
- Reroll needs no flag: `buildRow` rebuilds the cards and fresh `onComplete`s fire, so a re-flipped Epic shimmers once more and a sitting/hand card never does. Works on 412x915 and 1280x720 because the band is placed from `cardSlot(i, size.width, size.height)` with the live `size`.

### Tests
none

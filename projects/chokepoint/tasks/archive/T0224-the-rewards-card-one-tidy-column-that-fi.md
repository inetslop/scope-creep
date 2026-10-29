---
id: T0224
title: "The rewards card: one tidy column that fits its card"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T17:00:35Z
claimed_at: 2026-10-29T17:35:43Z
finished_at: 2026-10-29T18:15:48Z
---

## Goal
The rewards card (the claim screen after a run) has outgrown its layout. Seen at 412x915: an empty band above the "Rewards" title; the coin breakdown ("waves +13 · stopped +40 · clean +11") runs past both edges of the card and the score breakdown nearly does; the coin icon sits far from "+64 coins"; the gaps between lines are uneven (the coin line crowds its neighbours, a large gap above Menu). Make it one tidy column that always fits inside its card.

## Details
- **Why it broke:** every line in `src/scenes/RewardsScene.ts` has a hand-placed y offset that tasks added one at a time, and the card's height comes from a separate formula (`panelH`, the `dy` per "middle line") that no longer matches the lines.
- **Lay the card out as one column, built from its lines in order:** each line's y comes from the line above it (its height plus a gap), and the card's height is the content plus the same padding at the top and the bottom. Two gap sizes only: a small one inside a group, a bigger one between groups.
- **The groups, top to bottom:** the title; the run (Waves held, Stopped, Clean, Best combo); Score and its breakdown; the coins and their breakdown; the board code (and Flawless when the run was flawless); the Menu button.
- **The two breakdown lines** (muted gray) are smaller than the lines they explain (about 16 px against 22 px), and never wider than the card minus its padding: if one would be wider, it shrinks to fit (never below 13 px).
- **The coin icon** sits right beside "+N coins" (a small fixed gap), and the pair is centered.
- **Keep:** the count-up, the colors, which lines appear when (Clean only after a clean wave, Best combo from 2, Flawless only when flawless), the Menu button, and the scaling that keeps the whole card on screen.

## Acceptance criteria
- [ ] At 412x915 and 1280x720, no text crosses the card's edges (at least 16 px inside them), for a long run (a 5-digit score, a 4-digit stopped count, 3-digit coins) and for a short one.
- [ ] The padding above the title equals the padding below the Menu button: no empty band.
- [ ] The gaps are the same between the lines of a group, and the same between groups.
- [ ] The coin icon sits beside the coin number.
- [ ] The lines appear under the same conditions as before, and the count-up works as before.

## Design (architect, desktop)

### Files
- edit `src/scenes/RewardsScene.ts` — the only file. Replace the hand-placed y-offsets (`mid`, `dy`, `panelH`, lines 77–116) with one column built in order from its lines; add a pure `stack()` helper and coin-pair centering. No imports change; no other file is touched.

### Interfaces
Module-level, above the class in `src/scenes/RewardsScene.ts`:

```ts
/** The coin icon beside "+N coins": its shown size (the 28-unit texture at artScale 1.5) and the small fixed gap. */
const COIN_SIZE = 14;
const COIN_GAP = 10;

/**
 * One tidy column: each line's center y below the one before it (its height plus its gap),
 * with the card's padding above the first line and below the last. `ys[i]` is the card-relative
 * center of line i (card top at 0); `height` is the card's height.
 */
function stack(rows: ReadonlyArray<{ height: number; after: number }>, pad: number): { ys: number[]; height: number } {
  let y = pad;
  const ys: number[] = [];
  rows.forEach((row, i) => {
    ys.push(y + row.height / 2);
    y += row.height + (i === rows.length - 1 ? 0 : row.after);
  });
  return { ys, height: y + pad };
}
```

Private class method:

```ts
  /** The icon sits right beside "+N coins" and the pair is centered (the number grows while counting up). */
  private centerCoins(): void {
    this.coinText.setX((COIN_SIZE + COIN_GAP) / 2);
    this.coinIcon.setX(-this.coinText.width / 2 - COIN_GAP / 2 - COIN_SIZE / 2);
  }
```

### Steps
1. In `create()`, keep everything up to the `shade` line (the `menu` closure, board image, shade) and the `update()` count-up lines unchanged. Delete `mid`, `dy`, `panelH` and all old `this.add.text(0, <literal y>, ...)` calls; replace from `const panelW = 360;` to `onResize(this, layout);` with:

```ts
    const panelW = 360;
    const pad = 28; // the card's padding, above the title and below the Menu button
    const gapSmall = 12; // inside a group
    const gapBig = 24; // between groups
    const maxW = panelW - 2 * pad; // no line may run past the card inside its padding
    const RECIPE_SIZE = 16;

    /** A muted breakdown line: smaller than the line it explains, shrunk to fit the card (never below 13px). */
    const recipe = (text: string): Phaser.GameObjects.Text => {
      const t = this.add.text(0, 0, text, titleStyle(RECIPE_SIZE, PALETTE.muted)).setOrigin(0.5);
      if (t.width > maxW) t.setFontSize(`${Math.max(13, Math.floor((RECIPE_SIZE * maxW) / t.width))}px`);
      return t;
    };

    const title = this.add.text(0, 0, 'Rewards', titleStyle(32)).setOrigin(0.5);
    this.wavesText = this.add.text(0, 0, 'Waves held 0', titleStyle(22)).setOrigin(0.5);
    this.stoppedText = this.add.text(0, 0, 'Stopped 0', titleStyle(22)).setOrigin(0.5);
    if (run.cleanWaves > 0) this.cleanText = this.add.text(0, 0, 'Clean 0', titleStyle(22, PALETTE.greenDeep)).setOrigin(0.5);
    if (run.bestCombo >= 2) this.comboText = this.add.text(0, 0, 'Best combo ×0', titleStyle(22, run.bestCombo >= 10 ? PALETTE.yellow : PALETTE.muted)).setOrigin(0.5);
    this.scoreText = this.add.text(0, 0, 'Score 0', titleStyle(22)).setOrigin(0.5);
    const scoreRecipe = recipe(`waves +${run.wavesCleared * 100} · stopped +${run.kills}`);
    this.coinText = this.add.text(0, 0, '+0 coins', titleStyle(28, PALETTE.goldText)).setOrigin(0.5);
    this.coinIcon = artScale(this.add.image(0, 0, COIN_TEXTURE), 1.5);
    const coinRecipe = recipe(`waves +${this.waves} · stopped +${Math.floor(this.stopped / 10)} · clean +${this.clean * cleanPay}`);
    const boardText = this.add.text(0, 0, `Board ${boardCode(run.seed)}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);
    let flawlessText: Phaser.GameObjects.Text | undefined;
    let flawlessStar: Phaser.GameObjects.Image | undefined;
    if (flawless) {
      flawlessText = this.add.text(0, 0, 'Flawless', titleStyle(22, PALETTE.muted)).setOrigin(0.5);
      flawlessStar = artScale(this.add.image(0, 0, STAR_TEXTURE), 1.5);
    }
    const menuButton = makeButton(this, 0, 0, 'Menu', menu, { width: 240, height: 52, radius: 26 });

    // The column's groups: the title; the run; the score and its recipe; the coins and their
    // recipe; the board code (and Flawless); the Menu button.
    const rows: Array<{ height: number; after: number }> = [
      { height: title.height, after: gapBig },
      { height: this.wavesText.height, after: gapSmall },
      { height: this.stoppedText.height, after: this.cleanText || this.comboText ? gapSmall : gapBig },
    ];
    if (this.cleanText) rows.push({ height: this.cleanText.height, after: this.comboText ? gapSmall : gapBig });
    if (this.comboText) rows.push({ height: this.comboText.height, after: gapBig });
    rows.push(
      { height: this.scoreText.height, after: gapSmall },
      { height: scoreRecipe.height, after: gapBig },
      { height: this.coinText.height, after: gapSmall },
      { height: coinRecipe.height, after: gapBig },
      { height: boardText.height, after: flawlessText ? gapSmall : gapBig },
    );
    if (flawlessText) rows.push({ height: flawlessText.height, after: gapBig });
    rows.push({ height: menuButton.container.height, after: 0 });

    const col = stack(rows, pad);
    const panel = makeCard(this, 0, -col.height / 2, panelW, col.height, 28);
    title.setY(col.ys[0]);
    this.wavesText.setY(col.ys[1]);
    this.stoppedText.setY(col.ys[2]);
    let i = 3;
    if (this.cleanText) this.cleanText.setY(col.ys[i++]);
    if (this.comboText) this.comboText.setY(col.ys[i++]);
    this.scoreText.setY(col.ys[i++]);
    scoreRecipe.setY(col.ys[i++]);
    this.coinText.setY(col.ys[i]);
    this.coinIcon.setY(col.ys[i]);
    i++;
    coinRecipe.setY(col.ys[i++]);
    boardText.setY(col.ys[i++]);
    if (flawlessText && flawlessStar) {
      flawlessText.setY(col.ys[i]);
      flawlessStar.setY(col.ys[i] + 1).setX(flawlessText.width / 2 + 13); // the texture is painted 1px low
      i++;
    }
    menuButton.container.setY(col.ys[i]);
    this.centerCoins();

    const parts: Phaser.GameObjects.GameObject[] = [panel, title, this.wavesText, this.stoppedText];
    if (this.cleanText) parts.push(this.cleanText);
    if (this.comboText) parts.push(this.comboText);
    parts.push(this.scoreText, scoreRecipe, this.coinText, this.coinIcon, coinRecipe, boardText);
    if (flawlessText && flawlessStar) parts.push(flawlessText, flawlessStar);
    parts.push(menuButton.container);
    const box = this.add.container(0, 0, parts).setDepth(2);

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      const k = Math.min(((width - 16) * display.ratio) / boardSize.width, ((height - 16) * display.ratio) / boardSize.height);
      artScale(board, k * ART);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / col.height));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    if (flags.smoke) this.time.delayedCall(1500, menu);
```

2. In `update()`, replace only the last line (`this.coinIcon.setX(...)`) with `this.centerCoins();`.

### Pitfalls
- Phaser `Text.width`/`height` are measured at creation, so `recipe()` can shrink immediately; `setFontSize()` re-renders and updates `.width` — no manual measurement needed.
- The coin pair must be re-centered every frame (the number grows during the count-up), but the icon's y never changes: it and the text are both in `box`, which starts at (0,0), so re-parenting keeps their relative positions — do not `setY` the icon in `update()`.
- Keep the star's `+1` y offset and its `width/2 + 13` x — the star texture is painted offset for its side face.
- Keep the exact strings and colors of every line (the smoke mode auto-menu and any text checks depend on behavior, not positions); keep `this.waves` in the coin recipe, not `run.wavesCleared`.
- Worst case (all lines, ~596px tall) still scales to 1 at 412x915 and 1280x720 — do not add new scaling logic.

### Tests
none (UI layout only; no core rule added)

## Result (attempt 1, inet-racing)

Rewrote the rewards card in `src/scenes/RewardsScene.ts` as one tidy column: the pure `stack()` helper now derives each line's y and the card's height in order from its six groups (title; run; score + breakdown; coins + breakdown; board code/Flawless; Menu), with equal 28px padding top and bottom, a 12px in-group / 24px between-groups gap, and the two muted breakdown lines shrunk to 16px (floor 13px) so they never cross the card edges. The coin icon now sits a fixed 10px gap beside "+N coins" via `centerCoins()`, re-centered each frame during the count-up. All line conditions, colors, strings, the count-up and screen-fit scaling are unchanged; check and smoke both pass.

- Self-review: APPROVE
- Time: 40.1 min
- Self-review made fixes (kept; checks pass).

```
.../chokepoint/game/src/scenes/RewardsScene.ts     | 120 +++++++++++++++++----
 1 file changed, 99 insertions(+), 21 deletions(-)
```

---
id: T0013
title: "The run's coins so far, live in the HUD"
assignee: yoga
size: S
priority: 2
status: todo
depends_on: [T0001]
attempts: 0
created: 2026-10-28T02:08:37Z
epic: E1
---

## Goal
The player sees the run paying out as it happens: the HUD shows this run's coin tally so far, ending at exactly the number the game-over card prints.

## Details
- In the HUD card that shows the run state (gold and lives — closest example: the existing gold readout in the HUD), one new line: a small yellow coin icon (~12 px, the same rounded-circle coin icon the profile card uses, T0007) and "+N coins" in muted gray, placed with the other run-state lines.
- N uses the EXACT same rule as the game-over card (T0001): waves cleared + floor(enemies stopped / 10) + clean waves. It updates when a wave is cleared and when an enemy dies — the number simply changes, no tween, no sound.
- It must read as different from the spendable gold: smaller, gray, prefixed with "+". A fresh run starts at "+0 coins".
- Layout: the line fits the card at 412x915 and 1280x720 without covering any existing line or pushing the card off screen; if the card must grow, every existing line stays visible at both sizes.
- No new inputs, no pause-screen change (it is a readout, not a control).

## Acceptance criteria
- [ ] During a run the HUD number grows as enemies die and waves clear, and the final game-over "+N coins" line equals the last number the HUD showed.
- [ ] A fresh run starts at "+0 coins"; a run with nothing earned yet stays at "+0 coins" with no pop and no sound.
- [ ] The line is visibly smaller and grayer than the gold readout — a first-time player can tell spendable gold from run coins at a glance at both sizes.
- [ ] The HUD card with the new line fits at 412x915 and 1280x720 with no overlap.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/StatsCard.ts` — grow the run-state card (196x48 → 196x72), shift the existing lives/gold line up, add one line below it: 12 px coin icon + `+N coins` in muted, where N = `coinsForRun({ waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves })` recomputed in `update()` every frame (same fields GameOverScene passes, so the final number always matches).
- No other file changes. `StatsCard` is already in the `parts` list in `HudScene.create()` — do not touch HudScene.

### Interfaces
No new types or signatures. `StatsCard` gains one private `coins: Phaser.GameObjects.Text` and imports `coinsForRun` from `../../core/profile`. Full class after the edit:

```ts
/** Top left: lives and gold, and the run's coin tally so far. */
export class StatsCard implements HudPart {
  private readonly box: Phaser.GameObjects.Container;
  private readonly lives: Phaser.GameObjects.Text;
  private readonly gold: Phaser.GameObjects.Text;
  private readonly coins: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const card = makeCard(scene, 0, 0, 196, 72, 24);
    const lifeIcon = artScale(scene.add.image(-74, -14, LIFE_TEXTURE), 1.25);
    this.lives = scene.add.text(-56, -13, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coinIcon = artScale(scene.add.image(14, -14, COIN_TEXTURE), 1.25);
    this.gold = scene.add.text(32, -13, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coinTallyIcon = artScale(scene.add.image(-74, 16, COIN_TEXTURE), 12 / 28);
    this.coins = scene.add.text(-60, 17, '', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
    this.box = scene.add.container(0, 0, [card, lifeIcon, this.lives, coinIcon, this.gold, coinTallyIcon, this.coins]);
  }

  layout(): void {
    // Card top stays at y = 12, so the card is 12..84 and nothing is pushed off screen.
    this.box.setPosition(EDGE + 98, 12 + 72 / 2);
  }

  update(game: GameScene): void {
    this.lives.setText(String(game.run.lives));
    this.gold.setText(String(game.run.gold));
    this.coins.setText(`+${coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves })} coins`);
  }
}
```

### Steps
1. In `src/ui/hud/StatsCard.ts` replace the class as above: keep the four existing objects' x values (`-74`, `-56`, `14`, `32`) and styles exactly, subtract 14 from each of their y values, change the card to `196, 72`, add the two new objects and add them to the container in the shown order, change `layout()` as shown, and add the one `update()` line.
2. Add `import { coinsForRun } from '../../core/profile';` and drop `HUD` from the `../../config` import (it is no longer used).
3. Run `npm run check` and `npm run smoke`; play one run: fresh run shows `+0 coins`, it grows on kills/waves, and the game-over card's `+N coins` equals the last HUD number.

### Pitfalls
- The number must use `game.run.wavesCleared` (the getter), `game.run.kills` and `game.run.cleanWaves` — the same three fields GameOverScene hands to `recordRun` — or the final numbers will disagree. Do not invent a `run.coins` field; do not touch `RunState`.
- The coin texture is painted 28x28 (`art/icons.ts`); the 12 px icon is `artScale(..., 12 / 28)` — never a bare `setScale()` and never a new texture.
- No tween, no sound, no input: the line is recomputed per frame in `update()`, exactly like the gold readout.
- The card bottom reaches y = 84 (12 px past `HUD.top` = 72) — that overlap with the board is intended; do not instead shift the card up (top would clip at y = 0).
- Don't touch the other three x/positions in the card, and don't edit `HudScene`/`GameOverScene`.

### Tests
none

---
id: T0076
title: "Flawless: every held wave clean gets the star"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T21:24:45Z
claimed_at: 2026-10-28T22:27:12Z
epic: E1
---

## Goal
The perfect run is named where it is claimed: a run that held every one of its completed waves clean earns a "Flawless" mark on the claim card and the game-over card.

## Details
- **The rule:** Flawless = every wave the run completed was clean — the run ledger's clean count equals its waves-held count, and the run completed at least one wave. The death wave (the one that takes the last life) is not a held wave and never counts against it. A life the clean streak (T0045) pays back is not a leak; a run that lost a life and won it back is not flawless if it leaked on a held wave — the rule is the waves, not the lives. Read the same values the claim card's count-up already reads (T0003/T0033); never recompute.
- **On the claim card** (`src/scenes/RewardsScene.ts`): a "Flawless" line under the Board line (T0056) — the small yellow star (the T0016 star, same size and yellow) beside the word "Flawless" in muted ink. Shown with the card (no count-up, no sound).
- **On the game-over card** (the GameOver scene's card, the one the flow shows before the claim card): the same small yellow star beside the score line, the moment the run ends flawless.
- A run that is not flawless shows both cards exactly as today (byte-identical). No coin change: the formula is untouched (the recipe line T0075 explains it).
- Closest example: the profile card's best-wave star (T0016) for the star, and the Board line (T0056) for the placement.

## Acceptance criteria
- [ ] A run that ends having held every completed wave clean (at least one held) shows "Flawless" — yellow star plus muted word — under the Board line on the claim card, and the small yellow star beside the score on the game-over card.
- [ ] A run that leaked on any held wave shows both cards exactly as today; a run that died on wave 1 (no held waves) is not flawless; a run that held wave 1 clean and died on wave 2 is.
- [ ] The coins, the recipe line (T0075), the score and the best-wave star are unchanged by this mark.
- [ ] The card fits 1280x720 and 412x915 with the new line.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, yoga)

### Files
- edit `src/scenes/RewardsScene.ts` - "Flawless" line (muted word + small yellow star) under the Board line on the claim card, card grows 36 px only when flawless
- edit `src/scenes/GameOverScene.ts` - small yellow star beside the score line, only when flawless
### Interfaces
No new types/functions. One boolean per scene, both from the two values the card already reads:
- RewardsScene, after `this.comboText = undefined;`: `const flawless = this.waves === this.clean && this.waves > 0; // every held wave was clean`
- GameOverScene, after the `score` text: `const flawless = run.wavesCleared === run.cleanWaves && run.wavesCleared > 0;`
### Steps
1. RewardsScene: import line → `import { ART, artScale, COIN_TEXTURE, STAR_TEXTURE } from '../art/textures';`. Change `panelH` to `372 + 2 * dy + (flawless ? 36 : 0)` and the menu button y `144 + dy` → `144 + dy + (flawless ? 36 : 0)`.
2. RewardsScene, after the `boardText` line: `let flawlessText: Phaser.GameObjects.Text | undefined;` / `let flawlessStar: Phaser.GameObjects.Image | undefined;` / `if (flawless) { flawlessText = this.add.text(0, 116 + dy, 'Flawless', titleStyle(22, PALETTE.muted)).setOrigin(0.5); flawlessStar = artScale(this.add.image(flawlessText.width / 2 + 13, 117 + dy, STAR_TEXTURE)); }`
3. RewardsScene: split `parts.push(this.scoreText, this.coinText, this.coinIcon, boardText, menuButton.container);` into `parts.push(this.scoreText, this.coinText, this.coinIcon, boardText);` then `if (flawlessText && flawlessStar) parts.push(flawlessText, flawlessStar);` then `parts.push(menuButton.container);`
4. GameOverScene: add `import { artScale, STAR_TEXTURE } from '../art/textures';`. After the `score` text: `let flawlessStar: Phaser.GameObjects.Image | undefined;` / `if (flawless) flawlessStar = artScale(this.add.image(score.width / 2 + 13, -99, STAR_TEXTURE));`
5. GameOverScene: replace the `const box = this.add.container(0, 0, [...]);` literal with `const parts: Phaser.GameObjects.GameObject[] = [panel, title, waveText, score]; if (flawlessStar) parts.push(flawlessStar); parts.push(wavesText, stoppedText, cleanText, coinsText, bestText, claimButton.container, againButton.container, menuButton.container); const box = this.add.container(0, 0, parts);`
### Pitfalls
- The Flawless line is static: no count-up in `update()`, no sound, no tween.
- Non-flawless runs must be byte-identical: everything stays behind `if (flawless)`; only the +36 panel growth (and menu +36) applies when flawless, preserving the menu button's 16 px bottom margin.
- Star exactly like `ProfileCard.ts`/`RecentLine.ts`: `artScale(...)` with no size arg (default), x = `text.width / 2 + 13`, y = text y + 1. Never a bare `setScale()`.
- Locate edit points by content, not line numbers — T0075 may have shifted `RewardsScene.ts`.
### Tests
none

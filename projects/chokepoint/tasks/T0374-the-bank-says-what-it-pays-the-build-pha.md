---
id: T0374
title: "The bank says what it pays: the build phase's 'bank +N' line on the stats card"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T18:48:59Z
claimed_at: 2026-11-01T19:09:33Z
---

## Goal
T0363 gave the build phase a spend-now-vs-bank decision — the bank pays 5% of the gold at wave start, capped at +10 — taught once in the first build phase. After that teach the payoff of the choice is nowhere to be seen: the player re-derives "5%, cap 10" in their head every build. One muted line in the stats card puts the number on the decision while the decision is open.

## Details
- **What:** one muted line in the stats card (the top-left card that holds lives, gold and the run's coin tally; the closest example is its coin-tally line, T0013 — 12 px muted ink with the small coin icon, in `src/ui/hud/StatsCard.ts`): "bank +N", where N is the bank's own number for the run's current gold — the existing pure function T0363 built (core/bankInterest.ts: 5% of the gold, floored, capped at +10 per build phase). No new rule: the line reads the same function the pay uses.
- **When:** the build phase only — the only time the choice is open. The line is shown while the interest would be at least 1 gold (20 gold or more, since the pay floors) and updates live as the player spends gold, so the number falls as the bank falls; below 20 gold it is absent and the stats card is byte-identical to today. Outside the build phase — a wave, the draft, the menu, the pause, the game over — it is never shown.
- **No state, no save field:** the line re-derives from the gold every frame, so a resumed run shows it purely from the restored gold.
- **Nothing shown twice, nothing replaced:** the gold balance is the line above it; "bank +N" is the payoff, which is shown nowhere else (the one-time teach says the rule, never the number). It is one line in a card that already holds three reads, present only while the decision is open; the level chips under the stats card follow the card's edge as they do today. No sound, no new button, no key. The line fits the card at 412x915 and 1280x720 alongside the lives/gold and coin-tally lines.

## Acceptance criteria
- [ ] During a build phase with 20 gold or more, the stats card shows a muted "bank +N" line with N the bank's number for the current gold (5%, floored, cap +10); it updates live as gold is spent, and below 20 gold it is absent and the card is byte-identical to today.
- [ ] Outside the build phase — a wave, the draft, the menu, the pause, the game over — the line is never shown and the stats card is byte-identical to today; a resumed run shows the line purely from the restored gold, with no new save field.
- [ ] The line fits the card at 412x915 and 1280x720; the coin-tally line, the lives/gold line and the level chips are unchanged; npm run check and the desktop/mobile smoke pass.

## Design (architect, desktop)

### Files
- edit `src/ui/hud/StatsCard.ts` — add the "bank +N" line (third row, shown only in a build phase with `bankInterest(gold) >= 1`), grow the card 72→92 only while the line is up, publish the card's bottom edge to the registry
- edit `src/ui/hud/LevelChips.ts` — follow the stats card's bottom edge (its bank line can grow it mid-run), instead of the fixed `TOP`
- create: none. No core change — the line reads the existing `bankInterest()` in `core/bankInterest.ts`.

### Interfaces
No new types or functions exported. New shared registry key (Phaser's game-wide registry, same one `statsGold`/`bankPay` already use):
```ts
// set by StatsCard (screen CSS px, the card's bottom edge):
this.scene.registry.set('statsCardBottom', 12 + (show ? 92 : 72));
```

### Steps
1. `StatsCard.ts` imports: add `import { bankInterest } from '../../core/bankInterest';`; change `import { makeCard } from '../card';` to `import { cardTexture, makeCard } from '../card';`
2. `StatsCard.ts` fields (next to `coinTallyIcon`):
```ts
private readonly card: Phaser.GameObjects.Image;
private readonly bankIcon: Phaser.GameObjects.Image;
private readonly bank: Phaser.GameObjects.Text;
private bankShown = false;
```
3. Constructor: replace `const card = makeCard(scene, 0, 0, 196, 72, 24);` with `this.card = makeCard(scene, 0, 0, 196, 72, 24);`. After the `this.coins` line add (same style/positioning as the coin-tally line, one 20 px row below it):
```ts
this.bankIcon = artScale(scene.add.image(-74, 36, COIN_TEXTURE), 12 / 28);
this.bank = scene.add.text(-60, 37, '', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
this.bankIcon.setVisible(false);
this.bank.setVisible(false);
```
In the `scene.add.container(...)` children list use `this.card` (was `card`) and append `this.bankIcon, this.bank` right after `this.coins`.
4. `StatsCard.update(game)`: after the `this.goldTagRow(...)` line add
```ts
const pay = bankInterest(game.run.gold);
this.bankRow(game.run.phase === 'build' && !game.scene.isPaused() && pay >= 1, pay);
```
5. `StatsCard.ts` new private method (next to `goldTagRow`):
```ts
/** The "bank +N" line: the bank's pay for the run's gold (core/bankInterest) while the build's choice is open.
 * Re-derived from the gold every frame, so a resumed run shows it from the restored gold; the card grows
 * 72 to 92 while it is up and the level chips follow the new edge (ui/hud/LevelChips.ts reads 'statsCardBottom'). */
private bankRow(show: boolean, pay: number): void {
  if (show) this.bank.setText(`bank +${pay}`); // live: the number falls as the bank falls
  if (show === this.bankShown) return;
  this.bankShown = show;
  this.bankIcon.setVisible(show);
  this.bank.setVisible(show);
  this.card.setTexture(show ? cardTexture(this.scene, 196, 92, 24) : cardTexture(this.scene, 196, 72, 24));
  this.card.y = show ? 10 : 0; // card top stays at y = 12 (box centre 48; half-heights 46 / 36)
  this.scene.registry.set('statsCardBottom', 12 + (show ? 92 : 72));
}
```
6. `LevelChips.ts`: keep `TOP` but rename its constant's meaning — set `const GAP = 6;` and `const TOP = 12 + 72 + GAP; // the stats card's bottom edge while its bank line is hidden`. Store the scene (`private readonly scene: Phaser.Scene;`, assigned in the constructor). Extend each chip entry with `x: number; yOff: number` (init 0). Rewrite `layout()` to compute per chip: wrap as today (`x = EDGE; yOff += CHIP_H + CHIP_GAP;`), store `chip.x = x + chip.w / 2; chip.yOff = yOff;`, then call `this.place()`. Add
```ts
/** GAP below the stats card's bottom edge; its bank line can grow the card mid-run, so the chips follow (StatsCard). */
private place(): void {
  const bottom = (this.scene.registry.get('statsCardBottom') as number | undefined) ?? TOP - GAP;
  for (const chip of this.chips) {
    chip.card.setPosition(chip.x, bottom + GAP + chip.yOff + CHIP_H / 2);
    chip.label.setPosition(chip.x, bottom + GAP + chip.yOff + CHIP_H / 2);
  }
}
```
and change `update()` to
```ts
private lastBottom = -1; // field, next to `chips`
update(): void {
  const bottom = this.scene.registry.get('statsCardBottom') as number | undefined;
  if (bottom !== this.lastBottom) { this.lastBottom = bottom; this.place(); }
}
```

### Pitfalls
- HudScene keeps updating while GameScene is paused (pause scene only pauses GameScene), so `game.run.phase` is still `'build'` behind the pause shade — the `!game.scene.isPaused()` check is what hides the line for pause; wave/draft/menu/over are covered by `phase`.
- Never recreate the card texture or the row objects every frame: texture swap and visibility happen only on the `show === this.bankShown` transition; only `bank.setText` runs every frame while shown. `cardTexture()` is cached per size, so `196x92` paints once.
- Hidden state must be exactly today: 72 texture, `this.card.y = 0`, row objects invisible — the lives/gold and coin-tally rows never move (the card grows downward, top fixed at y = 12; do not touch `layout()` or the `statsGold` registry).
- `LevelChips` must not `setPosition` every frame — guard on `lastBottom`; StatsCard's `update()` runs before LevelChips' (parts list order), so the registry is set before the first read.
- Fullest card state: lives "9" + gold "9999" with ×4 tag (existing `goldTagRow` shift already handles it), "+999 coins", "bank +10" (13 px, ends ≈ x −10, inside the 196-wide card); card 12..104 and chips 110..132 fit 412x915 and 1280x720.

### Tests
- none (UI-only; `bankInterest` is unchanged and already covered).

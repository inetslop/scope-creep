---
id: T0017
title: The HUD coin tally pops as it grows
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T03:39:38Z
claimed_at: 2026-10-28T04:29:59Z
epic: E1
---

## Goal
The run's coin tally (the "+N coins" line in the HUD, added by T0013) should feel alive: when N goes up, the number gives a quick, quiet pop.

## Details
- The StatsCard already shows "+N coins" and N grows during a run (T0013). When N increases by at least 1, the "+N" number does a quick scale pop: scale to about 1.15 and back over ~150 ms, once per increase.
- The small coin icon (the same 12 px coin the line already uses) flashes a touch brighter for the same ~150 ms.
- No sound here (the payout chime is T0009's job on the rewards screen); this is a quiet visual pop during the run.
- If N jumps by several coins at once (a wave bonus), it pops once, not once per coin.
- The card's size and layout are unchanged; the pop is a scale on the existing text and icon, so it inherits the card's layout.
- It must work at 412x915 and 1280x720.

## Acceptance criteria
- [ ] Killing an enemy (a coin gain) makes the "+N" number do one quick scale pop (~150 ms).
- [ ] A wave bonus (a bigger jump in N) pops once, not several times.
- [ ] The pop is quiet (no sound) and the card's size and layout are unchanged.
- [ ] A fresh run at "+0 coins" does not pop.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/StatsCard.ts` — the whole change is in this one existing HUD part; no new files, no registry lines, no sound, no other task's files touched.

### Interfaces
No new types. Additions to the `StatsCard` class only:
- `private readonly scene: Phaser.Scene;` (the scene the constructor already receives — needed for `scene.tweens`)
- `private readonly coinTallyIcon: Phaser.GameObjects.Image;` (the icon is a constructor local today; it becomes this field, type exactly as in `ExitWarning`'s `img`)
- `private lastN = 0;`  `private popping = false;`
- `private pop(): void` (private method, after `update()`)

### Steps
1. Constructor: keep every object-creation line in the same order; only (a) add `this.scene = scene;` as the first line, (b) assign the icon line to the field: `this.coinTallyIcon = artScale(scene.add.image(-74, 16, COIN_TEXTURE), 12 / 28);`, (c) in the container list replace the local `coinTallyIcon` with `this.coinTallyIcon`.
2. `update()`: replace its last line (`this.coins.setText(...)`) with:
```ts
const n = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves });
this.coins.setText(`+${n} coins`);
if (n > this.lastN) this.pop();
this.lastN = n;
```
3. Add the method:
```ts
/** One quiet pop per coin gain: tally and coin scale to 1.15 and back over ~150 ms; the coin
 * flashes white the same time. Skipped if one is already running. */
private pop(): void {
  if (this.popping) return;
  this.popping = true;
  this.coinTallyIcon.setTintFill(0xffffff);
  const base = this.coinTallyIcon.scale;
  this.scene.tweens.add({ targets: this.coins, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.coins.setScale(1) });
  this.scene.tweens.add({ targets: this.coinTallyIcon, scale: base * 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.popping = false; this.coinTallyIcon.setScale(base); this.coinTallyIcon.clearTint(); } });
}
```
That's all.

### Pitfalls
- The icon's base scale is `artScale(..., 12 / 28)` ≈ 0.19, NOT 1 — never tween it to an absolute `scale: 1.15`; use `base * 1.15` and restore `base` in `onComplete` (as written).
- The white flash must be `setTintFill` (fill mode, same idiom as the enemy hit flash in `Enemy.hit`), not `setTint` — a white `setTint` is multiplicative-neutral and shows nothing. `clearTint()` only in the icon tween's `onComplete`, never earlier.
- `duration: 75, yoyo: true, repeat: 1` = 150 ms total, ending exactly at the start scale; do not change duration, add `reverse`, or set final scale in a `delayedCall`.
- No pop on a fresh run: `lastN` starts 0 and a fresh scene's tally is 0, so `n > lastN` is false; run end → `GameOver` → `scene.start(SCENES.game)` makes a fresh `StatsCard`, so a run that ended high never pops, and a mid-pop increase (wave bonus + kill on one frame) is skipped by `popping` — one pop per jump.
- Card stays 196x72; the text at origin (0, 0.5) grows ≤15% into the card and fits at 412x915 and 1280x720 — no layout code changes.
- No sound, no new texture, no new invariant (not a system), no changes to HudScene/GameScene.
### Tests
none

---
id: T0033
title: "The rewards card says Clean: a green line for the waves you held"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T08:16:06Z
epic: E1
---

## Goal
The payout explains itself: the rewards claim card shows the clean waves you held, so a first-time player sees where part of the coins came from. It also completes E1's last unwritten slice — the card counts up waves held, stopped and +N coins, but never the clean waves that earn them.

## Details
- The rewards claim card (T0003's scene; exact file `game/src/scenes/RewardsScene.ts`) currently counts up three lines: waves held, stopped, +N coins. Add one line between "stopped" and "+N coins": "Clean N".
- N is the run's clean-wave count from the run ledger — the same number the coin formula (T0001) and the game-over card's green line (T0005) already use. Never recomputed.
- The line shows only when N > 0, in the same green as the "Clean" chip at the exit and the game-over card's line (T0005). When N = 0 the card looks exactly as today: three lines, unchanged height.
- Presence is decided before the count-up starts: the card is laid out at its final height from the beginning and the line counts up in place with the other lines, at the same pace (no layout jump mid-animation). Plain text, same size and style as the other lines, no icon.
- The card stays centered and inside the white card on 412x915 (portrait) and 1280x720 (landscape); it grows by exactly one line height (the same spacing the existing lines use).
- The "+N coins" line, its pop and the two-note chime (T0009) are untouched — they belong to the coins line only.
- Closest example: the green clean line on the game-over card (T0005) and the existing count-up lines in `RewardsScene.ts`.

## Acceptance criteria
- [ ] A run with one or more clean waves ends on the rewards card with a fourth line "Clean N" (N = clean waves from the ledger), in the same green as the exit's "Clean" chip, between "stopped" and "+N coins", counting up with the other lines.
- [ ] A run with zero clean waves shows the card exactly as today: three lines, same height, same timing.
- [ ] The card stays centered and fully inside the white card on 412x915 and 1280x720, the new line the same size and style as the others.
- [ ] The "+N coins" line, its pop and the two-note chime behave exactly as before.

## Design (architect, yoga)

### Files
- edit `src/scenes/RewardsScene.ts` - add the "Clean N" line to the rewards card (only file changed; no new file, no registry, no shared file touched)

### Interfaces
No new types or signatures. One optional private field on `RewardsScene`:
```ts
private clean = 0;                                  // next to `private stopped = 0;`
private cleanText?: Phaser.GameObjects.Text;       // next to `private stoppedText!: ...`
```

### Steps
1. `create()`: after `this.stopped = run.kills;` add `this.clean = run.cleanWaves;` (the ledger count — the same number `coinsForRun` and the game-over card's green line already use; never recomputed). After `this.elapsed = 0;` add `this.cleanText = undefined;` (the scene re-creates on a later claim; a stale reference from a clean run would otherwise land in the new container).
2. Replace the layout block (today's lines 61–70, `const panelW` … the `box` line) with:
```ts
const dy = run.cleanWaves > 0 ? 18 : 0; // clean line: top half shifts up, bottom half down, panel grows 36
const panelW = 360;
const panelH = 300 + 2 * dy;
const panel = makeCard(this, 0, 0, panelW, panelH, 28);
const title = this.add.text(0, -98 - dy, 'Rewards', titleStyle(32)).setOrigin(0.5);
this.wavesText = this.add.text(0, -44 - dy, 'Waves held 0', titleStyle(22)).setOrigin(0.5);
this.stoppedText = this.add.text(0, -8 - dy, 'Stopped 0', titleStyle(22)).setOrigin(0.5);
if (run.cleanWaves > 0) this.cleanText = this.add.text(0, 10, 'Clean 0', titleStyle(22, PALETTE.greenDeep)).setOrigin(0.5);
this.coinText = this.add.text(0, 44 + dy, '+0 coins', titleStyle(28, PALETTE.goldText)).setOrigin(0.5);
this.coinIcon = artScale(this.add.image(0, 44 + dy, COIN_TEXTURE), 1.5);
const menuButton = makeButton(this, 0, 108 + dy, 'Menu', menu, { width: 240, height: 52, radius: 26 });
const parts: Phaser.GameObjects.GameObject[] = [panel, title, this.wavesText, this.stoppedText];
if (this.cleanText) parts.push(this.cleanText);
parts.push(this.coinText, this.coinIcon, menuButton.container);
const box = this.add.container(0, 0, parts).setDepth(2);
```
3. `update()`: between the stopped and coins lines add `this.cleanText?.setText(\`Clean ${Math.round(this.clean * k)}\`);` — the same `k` (0.6 s) pace as the other lines; the coins line keeps its slower `kc`, its pop and its `coinIcon.setX` line are untouched.

### Pitfalls
- N=0 must be byte-identical to today: with `dy = 0` every y is the old value (-98/-44/-8/44/108) and `panelH` is 300 — check it, don't "tidy" the numbers.
- Spacings the split preserves: 36 between the 22 px lines, 52 above the 28 px coins line, 64 to the Menu button, 34/16 padding to the panel edges — the line sits at y=10 exactly halfway, so no layout jump and the box stays centered (`layout()` is unchanged; its `min(1, …)` scale is 1 on both 412x915 and 1280x720, card 360x336 fits).
- Green is `PALETTE.greenDeep` — the exit "Clean" chip's deep face and the exact color the game-over card's clean line uses; text style is plain `titleStyle(22)`, no icon.
- `run` (`const run = getRun(this)`) is already in `create()` scope; do not read clean from `lastRun` — it stores only `wave` and `coins`.
- Tests: run `npm run check` + `npm run smoke`; no test file is added.

### Tests
- none

---
id: T0327
title: "The Hauler's leak pays its gold: a -5 chip at the exit"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T23:47:13Z
---

## Goal
A Hauler that gets through is the run's priciest leak — a life **and** 5 gold — but T0307's teach covers only the run's first Hauler leak, and every Hauler leak after that takes its gold silently. A small "-5" chip at the exit names the cost on every Hauler leak after the first, so the priciest leak is seen paying where it pays.

## Details
- New enemy-hook file `src/systems/enemyHooks/haulerLeak.ts`, registered in `src/systems/enemyHooks/index.ts`. Closest examples: `src/systems/enemyHooks/leakEcho.ts` (a hook that fires on a leak) and the Toll leak hook (an exit moment ~100 ms after a leak, T0255).
- On every Hauler leak, one small white rounded chip just above the exit gate, in the first-leak chip's look (T0107, T0307): the HUD's own coin icon (~10 px, PALETTE yellow) with a bold "-5" in muted ink (~12 px, the chip's own text style). It pops ~100 ms after the leak, holds ~1.5 s and fades. Nothing else on the chip.
- Suppressed on the run's first Hauler leak — T0307's teach chip ("the Hauler also takes 5 gold") sits alone at that same spot there, including its 1.2 s delay when it is also the run's first leak. The hook reads the same first-Hauler-leak state T0307 owns (it survives a resume): in a resumed run where a Hauler already leaked, the next Hauler leak shows the "-5" chip and the teach chip stays seen; the first Hauler leak in a run where none has been seen shows the teach chip, not this one.
- It is a moment, not a mark: nothing stays on the board and it replaces nothing (after the one-time teach, a Hauler leak is the run's only chance to see what it cost). When the same leak also pays a Toll (T0234), the chip stacks with the Toll's gold pop in the exit chip's own arrangement — never two chips in one spot.
- No sound (leak sounds are closed, T0267), no input, no new HUD element. The gold rule is untouched: the run's gold changes exactly as it does today; the chip names the Hauler's defined cost, it does not compute or alter it.

## Acceptance criteria
- [ ] A Hauler leak that is not the run's first Hauler leak pops a small white chip — coin icon + bold "-5" — just above the exit gate, holding ~1.5 s and fading; the stats card's gold changes exactly as before this change.
- [ ] The run's first Hauler leak shows T0307's teach chip and no "-5" chip; if it is also the run's first leak, the teach chip's 1.2 s delay is unchanged.
- [ ] A resumed run in which a Hauler already leaked shows the "-5" chip on the next Hauler leak; the teach chip never re-shows.
- [ ] Non-Hauler leaks (a Dot, a Block, a boss) show no "-5" chip.
- [ ] When a Hauler leak also pays a Toll, the "-5" chip and the Toll's gold pop both show, stacked, never overlapping in one spot.
- [ ] The leak's existing thud, camera jolt and echo are unchanged; the chip is silent and takes no input.
- [ ] The chip is readable at 412x915 and 1280x720 (the exit chip's own footprint, T0307's).

## Design (architect, yoga)

### Files
- edit `src/systems/enemyHooks/haulerLeak.ts` — the task's "new file" already exists and is registered (it does the −5 gold); the chip goes in it, and its red `fx.popText(..., '-5', PALETTE.red)` line is replaced by the chip (keeping both would show the cost twice). No registry change: `haulerLeak` is already in `ENEMY_HOOKS`, and its line must stay directly above the `haulerTeach` line.
### Interfaces
None new. The file's full new content (replace the whole file):
```ts
import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import type { MakeEnemyHook } from './hook';

/**
 * The Hauler's leak: the 5 gold it costs (gold never goes below 0). The first Hauler leak stays
 * the teach chip alone (haulerTeach, below); every later one also shows the cost at the exit:
 * a small white chip, the HUD's own coin icon and a bold "-5", the first-leak chip's look
 * (fx/leakCost.ts). The jolt and the sound are the usual leak's.
 */
export const haulerLeak: MakeEnemyHook = ({ run, fx, board }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler') return;
    run.gold = Math.max(0, run.gold - 5); // every Hauler leak, the first included
    if (!run.haulerTold) return; // first Hauler leak: read BEFORE haulerTeach (below) sets it
    const pts = board.path.points; // same exit anchor as the teach chip (haulerTeach.ts)
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    fx.scene.time.delayedCall(100, () => {
      if (fx.full) return;
      const px = board.toScreen({ x: 1, y: 0 }).x - board.toScreen({ x: 0, y: 0 }).x; // CSS px per board unit
      const coin = artScale(fx.scene.add.image(0, -1, COIN_TEXTURE), 10 / (28 * px)); // the HUD's own coin, ~10 px
      const label = fx.scene.add.text(0, -1, '-5', {
        fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: cssColor(PALETTE.muted),
        resolution: 1 / fx.scene.scale.zoom,
      });
      label.setOrigin(0.5);
      const coinW = coin.displayWidth; // board units (its ~10 px)
      const w = coinW + 6 + label.width + 14; // the exit chip's body: same 14 padding as fx/leakCost.ts
      const g = fx.scene.add.graphics();
      g.fillStyle(PALETTE.cardDeep, 1);
      g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
      g.fillStyle(PALETTE.card, 1);
      g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
      const cx = -w / 2 + coinW / 2;
      coin.x = cx;
      label.x = cx + (coinW + label.width) / 2 + 3; // 6 px gap coin→label
      const chip = fx.scene.add.container(x, y, [g, coin, label]);
      chip.setDepth(DEPTH.fx).setScale(0);
      fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
      fx.track(chip, 300, { alpha: 0, delay: 1500, ease: 'Quad.easeIn' }); // hold ~1.5 s, out 300 ms
    });
  },
});
```
### Steps
1. Overwrite `src/systems/enemyHooks/haulerLeak.ts` with the code above. Everything else already exists: `run.haulerTold` is saved/resumed (`RunSave.ts`), `COIN_TEXTURE` is painted at boot, `toScreen` is public on `Board`.
2. Run `npm run check` (no new files, no registry line, no scene wiring).
### Pitfalls
- Suppression is order-dependent: `if (!run.haulerTold) return;` must run before `haulerTeach` sets the state on the first leak — that is why `haulerLeak` sits on the line above `haulerTeach` in `ENEMY_HOOKS`. If a later edit reorders those two lines, the first Hauler leak would show both chips; do not touch `index.ts` except to keep that order.
- The chip is created 100 ms late, after the leaker is pooled: use only the captured anchor `(x, y)`, never the `enemy` object.
- `fx.full` is checked inside the delayed callback (the cap can change in the 100 ms); a skipped chip is correct, like a skipped Toll pop.
- Coin size: `artScale(img, 10/(28*px))` with `px` from `killCoin.ts` — that is what keeps it ~10 CSS px at any zoom; a bare `setScale()` or missing `artScale` makes it 3× too big (textures are 3x).
- Keep `run.gold = Math.max(0, run.gold - 5);` before the suppression return: the first leak still pays gold, it just shows no chip.
- Readability: the chip reuses the exit chip's exact body (20 tall, 14 padding) at the teach chip's anchor, so 412x915 and 1280x720 are covered by T0307's footprint; it is shorter than the teach chip, nothing else lives at that anchor.
### Tests
none

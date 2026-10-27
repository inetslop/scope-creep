---
id: T0118
title: Boss tick — the bar shows what is left
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0114]
attempts: 1
created: 2026-10-27T15:11:35Z
claimed_at: 2026-10-27T16:50:57Z
finished_at: 2026-10-27T17:07:34Z
---

## Goal
The boss health bar prints a small ink tick at each 25/50/75% mark as the boss first drops below it, so how much of the fight is left is visible without counting.

## Details
- Only the boss health bar is touched — the bar T0006 added; The Grid (T0044) and The Palette (T0097) reuse it through the boss system. Edit the bar's draw (in the Boss system or the scene that owns the bar — confirm which in the design) and add the ticks beside the existing fill draw.
- As the boss's HP first drops to 75% of max, then 50%, then 25%, a small flat ink tick is printed on the bar at the point where that fraction of max HP remains: a short vertical ink line, 2 u wide, ~6 u tall, flat ink with no outline and no shadow — the same flat-ink style as the platemark × (T0094).
- One tick per threshold per boss spawn: printed once and it stays for the rest of that boss's life; the ticks live and die with the bar, so a fresh boss spawn shows a clean bar and no ticks from a previous boss remain.
- Nothing else about the bar changes: its width, fill, position, the nameplate (T0064), the spawn warning (T0070), the sting (T0058) and the boss-music hold (T0108) are all untouched. No new sound, key, scene or HUD element beyond the ticks on the existing bar.

## Acceptance criteria
- [ ] As a boss's HP first crosses 75%, 50% and 25% of its max, a small flat ink tick (2 u wide, ~6 u tall) prints on the boss bar at the matching point of the bar and stays for the rest of that boss's life.
- [ ] A fresh boss spawn starts with a clean bar: no ticks from a previous boss are visible.
- [ ] The bar's fill, width and position, the nameplate, the warning, the sting and the boss music are all unchanged; no sound, key, scene or new HUD element is added.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, inet-racing)

### Files
- edit `src/scenes/HudScene.ts` - the only file: one field, one create() reset, the boss-bar block in `update()`, one new private draw method. The bar lives here (`bossG`, line 192), not in BossSystem.

### Interfaces
No new types. All additions are private to HudScene:

```ts
// field, after `private bossFade = 1;` (line 53):
/** Boss bar ticks: bitmask (bits 1, 2, 4) of the 75/50/25% thresholds first crossed this boss's life; cleared when the boss leaves. */
private bossTickSeen = 0;

// method, directly after the drawBar() method (line 321):
/** Flat ink ticks (2 u wide, 6 u tall, no outline, no shadow) at the 75/50/25% marks of the boss bar, one per threshold first crossed this boss's life. */
private drawBossTicks(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  const fractions = [0.75, 0.5, 0.25];
  for (let i = 0; i < fractions.length; i++) {
    if (this.bossTickSeen & (1 << i)) {
      g.fillStyle(PALETTE.ink, 1);
      g.fillRect(x + w * fractions[i]! - 1, y + h / 2 - 3, 2, 6);
    }
  }
}
```

### Steps
1. Add the `bossTickSeen` field after `bossFade` (line 53).
2. In `create()`, add `this.bossTickSeen = 0;` right after `this.bossFade = 1;` (line 99) — scene instance survives stop/launch, like the other scalars there.
3. In `update()`, replace the boss block (lines 187–202) exactly with:

```ts
    if (run.bossAlive) {
      this.bossFade = 1;
      const top = (narrow ? PAD + 40 : PAD) + 26;
      this.bossName.setPosition(width / 2, top).setAlpha(1).setText(bossName);
      this.bossG.clear().setAlpha(1);
      const bossFrac = Phaser.Math.Clamp(run.bossHp / run.bossMaxHp, 0, 1);
      const bx = (width - width * 0.6) / 2;
      const by = top + 18;
      const bw = width * 0.6;
      this.drawBar(this.bossG, bx, by, bw, 12, bossFrac, PALETTE.red);
      // Ink ticks print once, as the boss first drops below 75/50/25% of max, and stay for the rest of this spawn.
      if (bossFrac < 0.75) this.bossTickSeen |= 1;
      if (bossFrac < 0.5) this.bossTickSeen |= 2;
      if (bossFrac < 0.25) this.bossTickSeen |= 4;
      this.drawBossTicks(this.bossG, bx, by, bw, 12);
    } else {
      this.bossTickSeen = 0; // a fresh spawn starts clean; the fading bar keeps its ticks until it fully clears
      if (this.bossFade > 0) {
        // Fade out over 0.5 s without clearing: lower the alpha of the last-drawn pixels.
        this.bossFade = Math.max(0, this.bossFade - dt / 0.5);
        this.bossG.setAlpha(this.bossFade);
        this.bossName.setAlpha(this.bossFade);
        if (this.bossFade === 0) {
          this.bossG.clear();
          this.bossG.setAlpha(1);
        }
      }
    }
```

4. Add the `drawBossTicks` method after `drawBar` (line 321).
5. `npm run check` and `npm run smoke`.

### Pitfalls
- The `else if (this.bossFade > 0)` must become `else { this.bossTickSeen = 0; if (this.bossFade > 0) {…} }` with the fade body kept byte-identical. Forgetting the reset is the one way a previous boss's ticks leak into the next spawn.
- The bar Graphics is cleared and redrawn every frame while `bossAlive`, so "printed once, stays" means: set the bit once, redraw it from the bit every frame. Do not make a one-off draw that expects to persist.
- `drawBar` call arguments must be unchanged in value (same x/y/width/12/frac/red) — only hoisted into `bx`/`by`/`bw`/`bossFrac` consts. Nameplate, warning, sting and music code is untouched.
- Ticks fading with the bar's alpha over the 0.5 s post-kill fade is correct ("live and die with the bar"); no extra cleanup.
- Palette boss needs nothing special: `run.bossHp` is already the cascade total.
- T0114 (in-progress) also edits `src/scenes/HudScene.ts`; keep this one commit small and, if it conflicts, re-apply these four hunks.

### Tests
none (pure HUD drawing, no src/core rule change).

## Result (attempt 1, yoga)

The boss health bar now prints a small flat ink tick (2 u × 6 u, no outline/shadow) at each of the 75/50/25% marks the first time the boss's HP drops below that fraction, and each tick stays for the rest of that boss's life. Implementation is a `bossTickSeen` bitmask on `HudScene` (set once per threshold in the boss block of `update()`, redrawn every frame via a new `drawBossTicks()` after `drawBar()`, cleared when the boss leaves so a fresh spawn starts clean and the ticks fade out with the bar's 0.5 s post-kill fade); the bar's fill, width, position, nameplate, warning, sting and music are untouched. `npm run check` (256 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 16.6 min

```
game/src/scenes/HudScene.ts | 44 +++++++++++++++++++++++++++++++++++---------
 1 file changed, 35 insertions(+), 9 deletions(-)
```

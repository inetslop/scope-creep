---
id: T0031
title: "Kill combo: a rising counter above quick kills"
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T06:24:55Z
---

## Goal
Quick kills feel chainable: a small rising ×N counter above rapid kills makes a burst from a Splash, a Lance line or a fast volley read as one moment.

## Details
- One change: where the kill chip burst is created (the baseline kill FX — the rounded chips; confirm the exact file and line when you start, it is in the kill path in `src/systems/`), track a kill chain and draw the counter:
  - Chain rule: a kill within 1.5 s of the previous kill continues the chain; any gap of 1.5 s or more resets it to zero. The chain counts kills, not enemies.
  - Look: from chain count 2 up, a small counter floats above the latest kill's chip position: "×2", then "×3", "×4"... Each new step: the counter moves 8 px up from where the previous step sat, and the number pops (scale 1.2 → 1.0 over about 150 ms — the same pop the HUD coin tally uses, T0017). Style: bold rounded 14 px type, muted ink (board text ink, not a HUD color — this lives on the board, not in a card).
  - Fade: when the chain ends (no kill for 1.5 s), the counter fades out over about 400 ms; the next quick pair starts again at ×2.
  - World space: the counter sits where the chip burst happens, at board scale, so it pans and zooms with the board exactly like the chips.
- No new sound (the kill chip sound already plays per kill), no new input, no HUD change.
- Closest example: the coin-tally pop in the HUD StatsCard (T0017) for the 1.2 → 1.0 scale pop; the kill chip burst for the anchor position.

## Acceptance criteria
- [ ] Two kills within 1.5 s: "×2" appears above the second kill's chips, bold 14 px, popping from 1.2 → 1.0; a third kill within 1.5 s of the second shows "×3" 8 px higher.
- [ ] No kill for 1.5 s: the counter fades out over about 400 ms, and the next quick pair starts again at ×2.
- [ ] A single isolated kill shows no counter at all.
- [ ] The counter is in world space: panning or zooming the board moves it with the chips; no HUD element is touched.

## Design (architect, yoga)

### Files
- edit `src/systems/FxSystem.ts` — add kill-chain state fields + `killCount(x, y)` (chain tracking + counter draw) + private `comboFadeStart()`, placed right after `burst()` (its kill-FX sibling); no import changes (`textStyle`, `cssColor`, `PALETTE`, `DEPTH`, `Phaser` all already imported)
- edit `src/systems/EnemySystem.ts` — one line in `strike()` after line 101 (`this.fx.burst(...)`)

### Interfaces
```ts
// FxSystem — new public method, board units at the kill spot:
killCount(x: number, y: number): void;
```
No changed types. `strike()` signature unchanged.

### Steps
1. In `FxSystem`, after `private static readonly MAX = 160;` add the fields:
```ts
  /** Kill chain for the rising ×N counter: count, last kill time, live objects. */
  private comboN = 0;
  private lastKill = 0;
  private comboText: Phaser.GameObjects.Text | null = null;
  private comboPop: Phaser.Tweens.Tween | null = null;
  private comboFade: Phaser.Tweens.Tween | null = null;
  private comboTimer: Phaser.Time.TimerEvent | null = null;
```
2. After `burst()` add:
```ts
  /** One kill for the chain: within 1.5 s it continues, a longer gap resets it. From ×2 up the
   * counter sits above the latest kill's chips, each step 8 px up, popping 1.2 → 1.0; 1.5 s idle fades it. */
  killCount(x: number, y: number): void {
    const now = this.scene.time.now;
    if (now - this.lastKill >= 1500) this.comboN = 0;
    this.lastKill = now;
    this.comboN += 1;
    if (this.comboN < 2) return;
    this.comboTimer?.remove();
    if (this.comboFade) { this.comboFade.remove(); this.comboFade = null; this.comboText?.destroy(); this.comboText = null; this.comboPop = null; }
    const fresh = !this.comboText;
    const t = this.comboText ?? this.scene.add.text(x, y - 40, '', textStyle(14, PALETTE.muted, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 })).setOrigin(0.5).setDepth(DEPTH.fx);
    this.comboText = t;
    t.setText(`×${this.comboN}`);
    if (!fresh) t.setY(t.y - 8);
    t.setScale(1.2);
    this.comboPop?.remove();
    this.comboPop = this.scene.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Quad.easeOut' });
    this.comboTimer = this.scene.time.delayedCall(1500, () => this.comboFadeStart());
  }

  /** The chain ended: fade the counter out over 400 ms, then destroy it. */
  private comboFadeStart(): void {
    this.comboTimer = null;
    const t = this.comboText;
    if (!t) return;
    this.comboFade = this.scene.tweens.add({ targets: t, alpha: 0, duration: 400, ease: 'Quad.easeOut', onComplete: () => {
      t.destroy();
      if (this.comboText === t) { this.comboText = null; this.comboFade = null; this.comboPop = null; }
    } });
  }
```
3. In `EnemySystem.strike()`, after `this.fx.burst(e.x, e.y, PALETTE[e.def.look.color]);` add exactly: `this.fx.killCount(e.x, e.y);`
4. `npm run check` and `npm run smoke` must pass.

### Pitfalls
- The counter is NOT transient FX: do not route it through `track()` or count it against `live`/`MAX` — it has its own lifecycle (created once per chain, faded by its own timer).
- Every count step must `remove()` the previous `comboTimer` — a stale timer must not fire and fade a live or new chain.
- Fast kills (< 150 ms apart) restart the pop: kill the old `comboPop` tween before adding a new one, or two scale tweens fight.
- A quick pair starting while the old counter is still fading: drop it (`comboFade.remove()`, destroy text) before spawning the fresh ×2.
- World space only: text at board coords with `DEPTH.fx`, no camera or HUD touches; it pans/zooms with the chips automatically.
- `T0005` also adds a method to `FxSystem` — add only the code above, next to `burst()`, and touch nothing else in the file.
### Tests
none

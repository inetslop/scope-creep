---
id: T0256
title: "The boss card: the Colossus's health and phase, pinned to the top edge"
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: [T0253]
attempts: 1
created: 2026-10-30T04:48:47Z
claimed_at: 2026-10-30T11:00:46Z
finished_at: 2026-10-30T11:59:43Z
epic: E5
---

## Goal
The run's peak is readable from anywhere on the board: while the Colossus (T0253) is alive, a small white card pinned to the top edge carries its token, its name and its health — with a notch at 50% where it goes out of reach, and the card itself dimming through each untargetable beat, so the phase is read on the card before it happens. (E5's "when done": "under its own health bar (a small white card pinned to the top edge, counting down as it is hit)".)

## Details
- **The card (a new HUD part, the WaveCard / NextWavePreview pattern):** one white rounded card, pinned top-center at the top edge — below the wave banner's slide (the banner's ~1 s slide above it at wave start plays as usual; at most one banner at a time is unchanged). It pops in with a ~200 ms scale-in the moment the Colossus spawns and fades out over ~200 ms the moment it dies or leaks. It blocks nothing and takes no input.
- **Its contents, in order:** the Colossus's on-board token at the preview's ~16 px size (its purple square), "Colossus" in bold ink, and a thin hp bar — a ~160×6 px rounded fill in the Colossus's own purple over a ~20%-alpha muted-ink track (the ComboBar's track language) — with one small notch (a 2 px tick) at the 50% mark. The bar carries no number; it is the only boss readout, and the notch is where the phase starts.
- **The bar is live:** it holds the Colossus's current hp (the same value its on-board bar shows) and drains as it is hit.
- **The phase is on the card:** while the Colossus is in its untargetable leg (T0253: 2.5 s out, every 8 s from its first drop to 50%), the token and the bar dim to 50% alpha — the same 50% as the board's token — and return to full for the rest of the 8 s cycle. The dim is the phase read at a distance: the notch says where it starts, the dim says that it is on.
- **Data-driven off the boss's def** (the way the enemies reference is off the enemy content, T0252): the token, the name and the notch's position (its `outOfReach.hpFrac`) come from the def — the second boss (E5's later slice) shows here with no change to this file. One boss on the board at a time (the boss wave sends exactly one, T0253), so the card is one.
- **Why the screen has room:** the on-board bar over a 0.45-size token is unreadable at a distance and says nothing about the phase; the card is the first place the boss's name, its 50% trigger and its dim cycle are seen together, and nothing else on screen shows them (E5's "when done" names this card). No new keys; the pause screen's controls are unchanged.

## Acceptance criteria
- [ ] During a boss wave (a multiple of 10), the moment the Colossus spawns the card pops in (~200 ms) pinned top-center: its ~16 px token, "Colossus" in bold ink, and the thin hp bar with one notch at the 50% mark; no card on any non-boss wave.
- [ ] The bar drains with the Colossus's live hp (the same value as its on-board bar) in its own purple over the muted track.
- [ ] While the Colossus is in its untargetable leg the token and the bar dim to 50% alpha, returning to full for the rest of each 8 s cycle — in lockstep with the board through 2× fast-forward (T0019).
- [ ] The card fades out (~200 ms) the moment the Colossus dies or leaks; it blocks nothing and takes no input, and the wave banner still slides above it at wave start.
- [ ] The card fits at 412x915 and 1280x720 without overlapping the stats card (top left) or the wave card / pause button (top right).
- [ ] The token, the name and the notch position are read from the boss's def (the notch at its `outOfReach.hpFrac`), not hard-coded.

## Design (architect, cachyos-x8664)

### Files
- create `src/ui/hud/BossCard.ts` — the boss card HUD part (token, name, live hp bar with a notch at `def.outOfReach.hpFrac`); pops in/fades out with the boss, and dims token + bar to the board token's alpha on its out-of-reach beats.
- edit `src/scenes/HudScene.ts` — one line in the `parts` list, after `new WaveBanner(this)`: `new BossCard(this),`.

### Interfaces
```ts
// src/ui/hud/BossCard.ts — new, existing HudPart, no signature changes
export class BossCard implements HudPart {
  constructor(scene: Phaser.Scene);
  layout(width: number, height: number): void;
  update(game: GameScene): void;
}
```
Contract T0253 must provide (build it first): `EnemyDef.outOfReach` in `src/content/types.ts` with `hpFrac: number` (0..1, the Colossus's is 0.5) — the card reads *only* `hpFrac`; the Colossus's def in `ENEMIES` (`name: 'Colossus'`, `look: { shape: 'square', color: 'purple', big size }`); and its board token at alpha 0.5 during every out-of-reach beat — the card reads `boss.alpha`, never re-derives the cycle. Boss lookup, every frame: `game.enemies.all.find((e) => e.active && e.def.outOfReach !== undefined)` — one on the board at a time; no wave number, no def import, so a later second boss shows here unchanged.

### Steps
1. Wait for T0253: the Colossus's def (with `outOfReach.hpFrac`), its registration, and the board-token dim it implements.
2. Create `src/ui/hud/BossCard.ts` (imports `CELL, HUD` from `../../config`, `PALETTE` from `../../content/palette`, `artScale, enemyTexture` from `../../art/textures`, `makeCard` from `../card`, `textStyle` from `../text`, `isNarrow, type HudPart` from `./hud`, `type { Enemy }` from `../../entities/Enemy`, `type { GameScene }` from `../../scenes/GameScene`). Constants `BAR_W = 160, BAR_H = 6, PAD = 12`. In `update(game)`: find the boss; if none, `fadeOut()`; else if `!this.box`: build it (below), `place()`, then `box.setScale(0.4)` tweened to `1` over 200 ms `Back.easeOut` (the pop-in — scale only, never touch alpha). Every frame after: `token.setAlpha(boss.alpha)` and redraw the bar (ComboBar pattern, `bar.clear()` first): track `fillRoundedRect(-80, -3, 160, 6, 3)` in `PALETTE.muted` alpha 0.2; fill at `frac = clamp(boss.hp / boss.maxHp, 0, 1)` in `PALETTE[boss.def.look.color]` — `fillRoundedRect(-80, -3, 160 * frac, 6, Math.min(3, 160 * frac / 2))` — then the notch after the fill, at the def's own mark: `fillRect(-80 + 160 * boss.def.outOfReach.hpFrac - 1, -4, 2, 8)` in `PALETTE.ink`; then `bar.setAlpha(boss.alpha)`. `build(boss)`: `name = add.text(0, 0, boss.name, textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5)`; `w = Math.max(160, 16 + 6 + name.width) + 2 * PAD` (a longer second-boss name widens the card); `token = artScale(add.image(0, 0, enemyTexture(boss.id)), 8 / (boss.def.look.size * CELL))` — the same ~16 px the preview shows; `bar = add.graphics()`; `card = makeCard(scene, 0, 0, w, 54, 12)`; row 1 center `-7`, row 2 center `12`: token `(-w/2 + PAD + 8, -7)`, name `(-w/2 + PAD + 22, -7)`, bar `(0, 12)`; `return add.container(0, 0, [card, token, name, bar])`. `place()`: `box.setPosition(width / 2, (isNarrow(width) ? HUD.top + 24 : 12) + 48 + 8 + 54 / 2)` — under the banner's settle (it holds at 12..60 wide, 96..144 narrow), so the card sits at 68..122 wide and 152..206 narrow. `fadeOut()`: guarded by a `fading` flag; tween `box.alpha` to 0 over 200 ms, `onComplete` `box.destroy(true)`, clear `box` and the flag — the next boss wave rebuilds and pops in again.
3. Edit `src/scenes/HudScene.ts`: the one line after `new WaveBanner(this)` in `create()`.
4. `npm run check` and `npm run smoke`.

### Pitfalls
- Lockstep: the scene clock does not run at 2x — never time the dim yourself; hp, alpha and dim all come off the boss's live state (the Enemy the board advances).
- `boss.alpha` is the dim source ("the same 50% as the board's token"); if T0253's dim lands somewhere other than the Enemy image's alpha, swap that one read — nothing else moves.
- Fade-out must not restart while running (the `fading` flag) and must not destroy the box before the next boss: `destroy(true)` in `onComplete` only, so wave 20's boss still pops the card in.
- The bar is redrawn, not tweened: `clear()` every frame; clamp `frac` (`maxHp >= 1` by spawn); clamp the rounded radius to the fill's half-width or a degenerate rect at tiny fills.
- 412x915: the card sits at 152..206, clear of the stats card (y ≤ 84) and the wave card / pause button (top right, y ≤ ~100); ~184 wide fits both sizes; `w` grows with a longer second-boss name and the rows flow from their y — no hand-picked offsets.
- Pop-in is scale-only, so a dimmed boss still pops correctly; don't touch alpha in the pop-in.
- No interactive objects (a texture Image takes no input); the wave banner plays as usual and slides above — it is 12..60 / 96..144, the card starts below it.
- Dim token and bar only; the name stays full alpha (the acceptance criterion names the two).

### Tests
- none (UI part; no core rule — the bar and phase live entirely in the HUD part off the boss's def and state).

## Result (attempt 1, desktop-4070)

Added `src/ui/hud/BossCard.ts`, a HUD part that pins a small white card top-center below the banner's resting place while the out-of-reach boss (the run's Colossus) is alive, showing its ~16 px token, name and live hp bar in its own color over a muted track with one ink notch at `outOfReach.hpFrac`; it pops in on spawn (~200 ms scale-in), fades out (~200 ms) on death or leak, takes no input and blocks nothing, and the token plus bar dim to `boss.alpha` for the untargetable leg in lockstep through fast-forward while the name stays full alpha. Registered it with one import and one line after `WaveBanner` in `HudScene.create()`; the card is fully data-driven off the boss def and fits both 412×915 and 1280×720 without overlapping the stats, wave or pause HUD. `npm run check` (typecheck, lint, 432 tests) and `npm run smoke` (desktop + mobile) both pass; no files were removed.

- Self-review: APPROVE
- Time: 59.0 min

```
projects/chokepoint/game/src/scenes/HudScene.ts |   2 +
 projects/chokepoint/game/src/ui/hud/BossCard.ts | 117 ++++++++++++++++++++++++
 2 files changed, 119 insertions(+)
```

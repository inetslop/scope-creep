---
id: T0063
title: "Panic pulse: buy your way out of a wave"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: [T0039, T0015]
attempts: 1
created: 2026-10-28T13:29:40Z
claimed_at: 2026-10-28T21:56:06Z
---

## Goal
A last gasp when a wave is getting away: during a wave, a "Panic · 25" button under the stats card clears every enemy on the board for 25 gold, once per wave — the first time a player can buy their way out of a wave, at the price of gold they were saving for slots.

## Details
- A bright white rounded button under the stats card (the same button style as the draft's "Reroll · 15", T0036): the coin icon (the HUD's coin, T0013) and "Panic · 25". It is shown only during the wave phase — it appears when the wave starts and is gone by the time the build phase does.
- States: normal when the run has at least 25 gold; dimmed with the price in red when gold is short (the T0036 language); after its one use this wave, dimmed "Panic · used". The use resets at the next wave's start. No keyboard key — tap/click only.
- Effect: every enemy currently on the board vanishes — a soft white flash at each enemy's spot (~150 ms, a small white ring fading out) and one soft low whoosh (a new Sfx at hit-blip volume, played once per pulse, not once per enemy).
- Vanished enemies are a paid wipe, not kills: they pay no gold, count as no "stopped", make no combo, leak nothing, pay no Mint "+1" (T0021) and trigger no burn jump (T0059). The wave's remaining spawns continue as normal, and the wave ends when they are done.
- Discoverable: the button is shown exactly where and when it is used (during a wave), and the pause screen's key list gains one line — "Panic — clear the board, 25 gold, once per wave".
- The button is a separate element below the stats card; the card's layout is unchanged.

## Acceptance criteria
- [ ] During a wave, a "Panic · 25" coin button appears under the stats card; tapping it with at least 25 gold spends 25 gold, every enemy on the board vanishes in soft white flashes with one soft whoosh, and the wave's remaining spawns continue.
- [ ] Vanished enemies pay no gold and count as nothing (no "stopped", no combo, no leak, no Mint +1, no burn jump); the button reads dimmed "Panic · used" for the rest of the wave and resets at the next wave.
- [ ] The button is dimmed with a red price when gold is under 25, is absent during the build phase, and the pause screen's key list has the Panic line.
- [ ] The stats card layout, gold rules, lives and all other sounds are unchanged; works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/ui/hud/PanicButton.ts` — the wave's one "Panic" button under the stats card (a `HudPart`): its states, the tap, and the board wipe
- edit `src/config.ts` — add `PANIC_COST` after the `REROLL_COST` line (line 33)
- edit `src/core/run.ts` — `panicUsed` field, `panic(cost)` method, one reset line in `startWave()`
- edit `src/audio/Sfx.ts` — `panic()` whoosh, after `waveClear()`
- edit `src/systems/FxSystem.ts` — `panicFlash(x, y)` white ring, after `markFlash()`; add `CELL` to its `config` import
- edit `src/scenes/HudScene.ts` — import + one `parts` line after `new StatsCard(this)`
- edit `src/scenes/PauseScene.ts` — the key-list line + one more item in `box`; import `textStyle`
- edit `tests/core/run.test.ts` — import `PANIC_COST`; two tests after the "cannot reroll" test

### Interfaces
```ts
// config.ts
export const PANIC_COST = 25;
// core/run.ts (RunState): field `panicUsed = false;` next to `rerollUsed`; method next to `reroll()`:
panic(cost: number): boolean; // true + gold -= cost only when !panicUsed && gold >= cost
// startWave(): add `this.panicUsed = false;` right after `this.leaksThisWave = 0;`
// audio/Sfx.ts
panic(): void; // this.tone(300, 0.3, 'sine', 0.18, 90) — soft low whoosh, hit-blip volume, played once per pulse
// systems/FxSystem.ts (import becomes `import { CELL, DEPTH } from '../config';`)
panicFlash(x: number, y: number): void; // fillRing radius CELL*0.4 thickness 3, white, scale 0.4->1, alpha->0, 150 ms
// ui/hud/PanicButton.ts
export class PanicButton implements HudPart { constructor(scene: Phaser.Scene, game: GameScene); layout(): void; update(game: GameScene): void; }
```

### Steps
1. `config.ts`: `/** The wave's one panic pulse: every enemy on the board vanishes. */` then `export const PANIC_COST = 25;` — after the `REROLL_COST` line.
2. `core/run.ts`: field after `rerollUsed = false;` — `/** This wave's one panic pulse was spent (reset at the next wave's start). */` + `panicUsed = false;`. Method after `reroll()`, same shape as it: `panic(cost) { if (this.panicUsed) return false; if (!this.spend(cost)) return false; this.panicUsed = true; return true; }` with a doc comment. In `startWave()`, `this.panicUsed = false;` after `this.leaksThisWave = 0;`.
3. `Sfx.ts` after `waveClear()`: `/** The wave's panic pulse: one soft low whoosh, at the hit-blip volume. */ panic(): void { this.tone(300, 0.3, 'sine', 0.18, 90); }`
4. `FxSystem.ts` after `markFlash()`: `panicFlash(x, y)` — guard `if (this.live >= FxSystem.MAX) return;`, `graphics` at `DEPTH.fx` positioned at (x, y), `fillRing(g, 0, 0, CELL * 0.4, 3, 0, Math.PI * 2, 0xffffff, 0.9)`, `g.setScale(0.4)`, `this.track(g, 150, { scale: 1, alpha: 0, ease: 'Quad.easeOut' })`.
5. Create `PanicButton.ts`: `makeButton(scene, 0, 0, '', () => this.pulse(game), { width: 148, height: 48, radius: 14, fadeWhenDisabled: false })`; content = coin `artScale(image, COIN_TEXTURE, 12 / 28)` + `word` text 'Panic ·' + `price` text `String(PANIC_COST)` (both `textStyle(14, ..., { fontStyle: 'bold' })`, origin (0, 0.5)), centered like DraftScene's `centerRow` (`w = 12 + 8 + word.width + 6 + price.width`; `coin.x = -w/2 + 6`; `word.x = -w/2 + 20`; `price.x = word.x + word.width + 6`), re-centered whenever the price text changes. `layout()`: `setPosition(EDGE + 98, 84 + 10 + 24)` (stats card is 16..212 × 12..84). `update(game)`: `visible = run.phase === 'wave'` (toggle only on change, and clear the cached state when it appears again); then state = `run.panicUsed ? 'used' : run.canAfford(PANIC_COST) ? 'ready' : 'poor'`, applied only when it changed: 'used' → word+price 'used' in `PALETTE.muted`, `content.setAlpha(0.5)`; 'poor' → price `PALETTE.red`, alpha 0.6; 'ready' → ink, alpha 1. `pulse(game)`: `if (game.run.phase !== 'wave' || !game.run.panic(PANIC_COST)) return;` then `for (const e of game.enemies.all) { if (!e.active) continue; game.fx.panicFlash(e.x, e.y); e.despawn(); }` then `getSfx(game)?.panic();` (whoosh outside the loop). Never call `setEnabled`.
6. `HudScene.ts`: import `PanicButton` next to the other ui/hud imports; in `parts`, `new PanicButton(this, game),` on the line after `new StatsCard(this),`.
7. `PauseScene.ts`: import becomes `import { textStyle, titleStyle } from '../ui/text';`; after the `quitButton` line add `const actionLine = this.add.text(0, 110, 'Panic — clear the board, 25 gold, once per wave', textStyle(12, PALETTE.muted)).setOrigin(0.5);` (the pause's key list, one line per action; small gray, under the buttons) and add `actionLine` to the `box` container's list.
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The wipe is paid despawn, not kills: `e.despawn()` only — never `EnemySystem.hit/strike` (would pay gold, count kills, combo, Mint +1), never `destroy()` (pooled), and don't touch `hook.stats`. Remaining spawns and the wave-end check keep working untouched.
- `panicUsed` resets in `startWave()` (called by `WaveSystem.start()` at the build→wave edge) — not in `clearWave()`/`startBuild()`.
- The per-frame `update()` must not re-render text every frame: cache the state string, `setText`/`setColor` only on change; clear the cache when the button re-appears so a next wave never shows a stale "used".
- A hidden container is non-interactive in Phaser, and `pulse()` re-checks phase + spend anyway — the button must never react in build/draft/over.
- Insert every new line at the exact anchors given; other machines append to `Sfx`, `FxSystem`, the `parts` list and the pause `box` at other spots. No `HOTKEYS` entry (no key), no StatsCard/EnemySystem/GameScene/RunFlow edits.
- Layout: at 412x915 the button (x 36..192, y 94..142) sits clear of WaveCard/PauseButton (top right) and HandBar (bottom); 48 px tall ≥ 44 touch target. Smoke's random clicks may press it — that's harmless (gold stays ≥ 0, counters untouched).

### Tests
- `tests/core/run.test.ts` (import `PANIC_COST`): (1) start a wave, `panic(PANIC_COST)` true and gold deducted, second call false with gold unchanged, `panicUsed` true; `clearWave()` → `startBuild(5)` → `startWave()` → `panicUsed` false and `panic()` true again. (2) spend down to `PANIC_COST - 1`, `panic()` false, `panicUsed` stays false, gold unchanged.

## Note (by hand, 2026-10-28)

No longer waits on T0059, T0019, T0030, T0035: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

---
id: T0277
title: "The bosses reference: the boss encounters, off the pause"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T10:09:05Z
epic: E5
---

## Goal
A first-time player should know what walks in at wave 10, 20 and 30 before it does: off the pause, a "Bosses" row (with the Enemies and Waves references, T0252 / T0264) opens a scene that lists the boss encounters in wave order — each with its on-board token, its name, its wave and its trick in the preview's own teach language (T0092) — so the run's peaks are read where every other "what is this" is read.

## Details
- **The row (the pause card):** a "Bosses" button row styled exactly like the existing "Enemies" (T0252) and "Waves" (T0264) rows — same size, same tap target, a matching line on the controls list. It opens the scene over the dimmed pause (their pattern); the back control returns to the pause. Nothing else on the pause changes.
- **The scene (a new file, the EnemiesScene / WavesScene pattern):** one white card, the boss encounters in wave order, one row each: the boss's on-board token (its def's own shape / color / size, T0252's rendering), its name, its wave number, and its trick as one plain line in the preview's teach wording. Read from the boss defs and the every-10 wave rule (core/waves), never hard-coded ids, so the list stays honest as the bosses grow.
- **The bosses, today:** the Colossus (wave 10) — "at half health it is out of reach for a beat, again every 8 s"; the Orb (wave 30) — "at half health it splits into two Shards that keep walking." The scene lists only the bosses that have a def, so today it shows two rows; the second boss (T0259's Titan and its Guard, wave 20) has no def yet and joins as a third row with no change to this file when T0259 lands.
- **The split with what already shows:** the Enemies reference is a flat index of all 14 (a "what walks" list); the Waves reference says a boss comes every 10th (timing, no name, no trick). This is the encounter-prep view — only the bosses, in order, each with its trick — the "what am I walking into at wave 10 / 20 / 30" a first-time player looks for. It is a reference card like the three that already are, not a new on-board readout.
- **Why it matters now:** the Colossus (wave 10) and the Orb (wave 30) already send today, so both rows are live in the game as it is; right now a player meets the run's biggest shapes knowing only the name chip (T0085) and the "boss" tag (T0257), and has to dig through the 14-row Enemies index to learn the trick.

## Acceptance criteria
- [ ] The pause card has a "Bosses" row styled like the Enemies and Waves rows, with a matching line on the controls list; tapping it opens a dimmed-pause white card and the back control returns to the pause.
- [ ] The scene lists, in wave order, one row per boss that has a def — today the Colossus (wave 10) and the Orb (wave 30) — each showing its on-board token, its name, its wave, and its trick as one plain line ("out of reach at half health, again every 8 s" / "splits into two Shards at half health").
- [ ] The rows are read from the boss defs and the every-10 rule (no hard-coded ids): a new boss def gains a row with no edit to this scene, and the not-yet-built second boss adds no broken row.
- [ ] No in-game HUD element, key, sound or on-board readout is added; the Enemies and Waves references, the boss card (T0256), the "boss" preview chip (T0257) and the pause card's other rows are unchanged.
- [ ] The new card and the pause card with the new row fit at 412x915 and 1280x720.

## Design (architect, cachyos-x8664)

### Files
- create `src/scenes/BossesScene.ts` - the bosses reference scene (the EnemiesScene pattern): one white card over the dimmed pause listing every boss encounter in wave order, each with its on-board token, name, wave and its trick as one plain line; read-only, back returns to the pause.
- edit `src/scenes/keys.ts` - one line in `SCENES`: `bosses: 'Bosses',` on the line after `waves: 'Waves',`.
- edit `src/main.ts` - `import { BossesScene } from './scenes/BossesScene';` in the import block (after the `BootScene` import, before `CodexScene`) and one array entry: `BossesScene` after `WavesScene` in `scene:`.
- edit `src/scenes/PauseScene.ts` - the "Bosses" row: one line in `CONTROLS` after the Waves line; `showBosses` + `bossesButton` after `wavesButton`; one more `GAP_S + 52` in the height sum; its `y += GAP_S;`/`setY(cy(52))` step after waves'; its `.container` in `boxKids`.
### Interfaces
No new exported types. `BossesScene` mirrors `EnemiesScene` exactly (`super(SCENES.bosses)`); its only content logic, in `build()`:
```ts
import { ENEMIES } from '../content/enemies';
import { isBossWave, waveBudget } from '../core/waves';
// A boss def is the wave itself: it never joins a normal mix (spawnOnly), its wave is a
// boss wave (the every-10 rule) and its threat is the wave's whole budget. A split piece
// (a Splinter, a Shard, the soon Guard) has a small threat: no row.
const bosses = ENEMIES
  .filter((e) => e.spawnOnly && isBossWave(e.fromWave) && e.threat === waveBudget(e.fromWave))
  .sort((a, b) => a.fromWave - b.fromWave); // today: 10 (Colossus), 30 (Orb)
```
Per row: token `artScale(this.add.image(x, y, enemyTexture(def.id)), 16 / (def.look.size * CELL))`; name `titleStyle(14)`; wave `` `wave ${def.fromWave}` `` in `textStyle(12, PALETTE.muted)` origin `(1, 0.5)`; trick = `def.description` in `textStyle(12, PALETTE.muted, { wordWrap: { width: textW } })`. The PauseScene handler, same shape as `showWaves`:
```ts
const showBosses = (): void => {
  if (closed) return;
  this.scene.launch(SCENES.bosses);
  this.scene.pause(); // the pause card's Escape key must not fire under the reference
};
const bossesButton = makeButton(this, 0, 0, 'Bosses', showBosses, { width: 240, height: 52, radius: 26 });
```
### Steps
1. Write `BossesScene` as a copy of `EnemiesScene` (same shade, ink back button, `doBack` with the `getSfx` blip, the smoke `delayedCall`, `onResize`), its imports being EnemiesScene's plus `import { isBossWave, waveBudget } from '../core/waves';`, swapping `SCENES.bosses`, the title `'Bosses'`, and the row data.
2. `keys.ts`: the `bosses: 'Bosses',` line after `waves`.
3. `main.ts`: the import and the array entry (after `WavesScene`).
4. `PauseScene`: the four edits - `CONTROLS` line `'Bosses — the bosses and their trick',`; the height sum becomes `h += GAP_B + 56 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + PAD;`; the placement step after waves'; `bossesButton.container` in `boxKids`.
### Pitfalls
- The `e.threat === waveBudget(e.fromWave)` term is the boss test: without it a Shard (spawnOnly, fromWave 30) becomes a broken row - a boss is "the wave itself" (its threat is the whole budget, per the defs' comments).
- Never drive the list off `bossId()`: hard-coded ids, and today `bossId(20)` is `'colossus'` (a duplicate wave-20 row).
- The wave line is `` `wave ${def.fromWave}` `` (never a `bossId` lookup); the trick is `def.description` verbatim (no new strings).
- The launch is `this.scene.launch(SCENES.bosses)` + `this.scene.pause()` so the pause card's key does not fire under the reference; `doBack` sets `hook.overlay = SCENES.pause` before `this.scene.start(SCENES.pause)` (GameScene stays paused).
- Layout: the height sum gains exactly one `GAP_S + 52` and the column one step; the scene scales with `Math.min(1, (width - 24) / panelW, (height - 24) / panelH)` and panelW 340 keeps it inside 412x915 and 1280x720 (2 rows today; the wave-20 row joins later).
- Keep `if (flags.smoke) this.time.delayedCall(1000, doBack);` so a smoke tap on the new row cannot strand the run.
### Tests
- none (the scene reads defs + the every-10 rule; content is auto-validated by `tests/content.test.ts`).

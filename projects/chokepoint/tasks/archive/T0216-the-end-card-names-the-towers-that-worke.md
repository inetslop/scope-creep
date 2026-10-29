---
id: T0216
title: "The end card names the towers that worked: kills by tower"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T15:52:06Z
claimed_at: 2026-10-29T16:44:31Z
finished_at: 2026-10-29T17:18:21Z
---

## Goal
When a run ends, the player sees which of their towers did the most work, so they learn what carried the run.

## Details
- On the end-of-run screen (the card that shows the score and the best wave), add one small new card beneath it, titled “By tower”: a wrapping row of the run's towers, each a small chip with the tower's first-augment icon and its kills this run (“×N”).
- The chips are sorted by kills, highest first. A tower with zero kills still appears as “×0”, so an idle tower is visible.
- Each chip uses the tower's own first-augment icon and color (the same icon the hand and the tower panel already use), so a tower is recognized at a glance.
- It reads each tower's existing per-tower kill count (the one the tower panel already shows, attributed by the source-of-kill rule). It changes nothing on the board, adds no new tracking, and does not re-derive any number already on the card — the score, best wave and coins are untouched.
- It is a readout: no sound, no input, no button.
- It is the game's white rounded card and fits the end screen at 412x915 and 1280x720; when a run has many towers the row wraps to a second line (it never scrolls, clips or overlaps the score).

## Acceptance criteria
- [ ] After any run ends, the end-of-run screen shows a new “By tower” card listing every tower built that run, each chip showing its first-augment icon and its kill count.
- [ ] The chips are ordered highest kills first, and a tower that killed nothing shows “×0”.
- [ ] It reads the towers' existing kill counts; the board, the towers, and the score / best-wave / coins lines on the end card are all unchanged.
- [ ] At both 412x915 and 1280x720 the card sits beneath the score card without overlapping or clipping, wrapping to a second line when the run has many towers.
- [ ] It is silent and takes no input.

## Design (architect, inet-racing)

### Files
- create `src/ui/byTower.ts` - the "By tower" end-screen card builder (card, chips, sorting, wrap)
- edit `src/systems/RunFlow.ts` - in `endRun()` (line ~156), snapshot each tower's first-augment id and kills into the registry before GameScene stops
- edit `src/scenes/GameOverScene.ts` - read the snapshot, place the new card beneath the score card, fit the scale to the combined height

### Interfaces
```ts
// src/ui/byTower.ts
export interface ByTowerEntry { first: string | undefined; kills: number }
export function makeByTowerCard(scene: Phaser.Scene, entries: ByTowerEntry[]): { card: Phaser.GameObjects.Container; height: number }
```
No changes to Tower, TowerSystem, RunState, TowerPanel or any board system. `tower.kills` and `tower.augments[0].id` are the existing fields (Tower.ts:36,46; the panel already shows `kills ${tower.kills}`).

### Steps
1. Create `src/ui/byTower.ts` (whole file):
```ts
import type Phaser from 'phaser';
import { artScale, augmentTexture } from '../art/textures';
import { PALETTE } from '../content/palette';
import { makeCard } from './card';
import { textStyle } from './text';

export interface ByTowerEntry {
  /** The tower's first augment (its icon); undefined only if it never got one (shouldn't happen). */
  first: string | undefined;
  kills: number;
}

const W = 360; // same width as the end card above it
const CHIP_W = 64;
const CHIP_H = 34;
const GAP_X = 8;
const ROW_GAP = 10;
const PER_ROW = 4;

/** The end screen's "By tower" card: a wrapping row of chips, one per tower built this run,
 * each with the tower's first-augment icon and its kills ("×N"), highest kills first. */
export function makeByTowerCard(scene: Phaser.Scene, entries: ByTowerEntry[]): { card: Phaser.GameObjects.Container; height: number } {
  const sorted = [...entries].sort((a, b) => b.kills - a.kills || (a.first ?? '').localeCompare(b.first ?? ''));
  const rows = Math.max(1, Math.ceil(sorted.length / PER_ROW));
  const H = 34 + rows * (CHIP_H + ROW_GAP);
  const card = scene.add.container(0, 0);
  card.add(makeCard(scene, 0, 0, W, H, 22));
  card.add(scene.add.text(-W / 2 + 18, -H / 2 + 12, 'By tower', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0));
  const rowW = PER_ROW * CHIP_W + (PER_ROW - 1) * GAP_X;
  sorted.forEach((t, i) => {
    const x = -rowW / 2 + CHIP_W / 2 + (i % PER_ROW) * (CHIP_W + GAP_X);
    const y = -H / 2 + 34 + Math.floor(i / PER_ROW) * (CHIP_H + ROW_GAP) + CHIP_H / 2;
    const chip = scene.add.container(x, y);
    chip.add(makeCard(scene, 0, 0, CHIP_W, CHIP_H, 12));
    if (t.first) chip.add(artScale(scene.add.image(-CHIP_W / 2 + 14, 0, augmentTexture(t.first)), 0.7));
    chip.add(scene.add.text(8, 0, `×${t.kills}`, textStyle(12, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5));
    card.add(chip);
  });
  return { card, height: H };
}
```
2. In `RunFlow.endRun()` add one line before `this.scene.scene.stop(SCENES.hud);` (no new import needed — plain objects):
```ts
    this.scene.registry.set('towerKills', this.s.towers.towers.map((t) => ({ first: t.augments[0]?.id, kills: t.kills })));
```
3. In `GameOverScene.create()` (src/scenes/GameOverScene.ts): add `import { makeByTowerCard, type ByTowerEntry } from '../ui/byTower';`. After the `parts` array is filled (line 61, before `const box`):
```ts
    const entries = this.registry.get('towerKills') as ByTowerEntry[] | undefined;
    let byTowerH = 0;
    if (entries && entries.length > 0) {
      const built = makeByTowerCard(this, entries);
      built.card.setPosition(0, panelH / 2 + 16 + built.height / 2);
      byTowerH = built.height;
      parts.push(built.card);
    }
    const box = this.add.container(0, 0, parts);
    const totalH = panelH + byTowerH + (byTowerH ? 16 : 0);
```
and change `layout()` (line 65) to scale against `totalH` instead of `panelH`: `Math.min(1, (width - 24) / panelW, (height - 24) / totalH)`.

### Pitfalls
- **GameScene is stopped when GameOver starts** (RunFlow.ts:159 `scene.start`), so the towers are destroyed by then — never read `getGameScene(this).towers` in GameOverScene; that is why the snapshot goes in the registry, exactly like `run` and `sfx`.
- Icons: use `augmentTexture(t.first)` + `artScale(..., 0.7)` — the same texture the hand (HandBar) and TowerPanel use; never a bare `setScale()`.
- A run can end with zero towers built (the player may skip the first pick): skip the card entirely when `entries` is empty, and keep `totalH === panelH` so the old layout is unchanged.
- Do not touch the score card's texts or positions; only the `layout` scale denominator changes.
- No sound, no input, no interactive objects: `makeCard` images are non-interactive by default — don't add `.setInteractive()`.

### Tests
- none (pure UI readout; no core rules added or changed)

## Result (attempt 1, asus)

The end-of-run screen now shows a "By tower" card beneath the score card: one chip per tower built, each with its first-augment icon and the tower's kill count ("×N"), sorted highest kills first (zero-kill towers show ×0). `RunFlow.endRun()` snapshots each tower's first-augment id and existing per-tower kill count into the scene registry before GameScene stops, and `GameOverScene` reads it to place the new card (wraps to a second line past four towers and fits at 412x915 and 1280x720). New file `src/ui/byTower.ts` holds the card builder; the score card's contents are unchanged and the readout is silent and non-interactive.

- Self-review: APPROVE
- Time: 33.8 min
- Self-review made fixes (kept; checks pass).

```
.../chokepoint/game/src/scenes/GameOverScene.ts    | 12 ++++++-
 projects/chokepoint/game/src/systems/RunFlow.ts    |  1 +
 projects/chokepoint/game/src/ui/byTower.ts         | 40 ++++++++++++++++++++++
 3 files changed, 52 insertions(+), 1 deletion(-)
```
